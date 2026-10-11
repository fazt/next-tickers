"use server";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import type { FormState } from "@/lib/form-state";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { updateRoleSchema } from "@/lib/validations";

const ACTIVE_STATUSES = ["OPEN", "IN_PROGRESS"] as const;

/**
 * Quita al usuario de los tickets activos que tenía asignados (deja constancia
 * en el historial). Se usa al pasar a rol USER o al desactivar la cuenta.
 */
async function unassignActiveTickets(
  tx: Prisma.TransactionClient,
  user: { id: string; name: string },
  actorId: string,
) {
  const tickets = await tx.ticket.findMany({
    where: { assigneeId: user.id, status: { in: [...ACTIVE_STATUSES] } },
    select: { id: true },
  });
  if (tickets.length === 0) return 0;

  await tx.ticket.updateMany({
    where: { id: { in: tickets.map((t) => t.id) } },
    data: { assigneeId: null },
  });
  await tx.ticketEvent.createMany({
    data: tickets.map((t) => ({
      ticketId: t.id,
      type: "ASSIGNED" as const,
      fromValue: user.name,
      toValue: null,
      actorId,
    })),
  });
  return tickets.length;
}

function getUserId(formData: FormData) {
  const id = formData.get("userId");
  return typeof id === "string" && id.length > 0 && id.length <= 40 ? id : null;
}

export async function updateUserRole(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");
  const userId = getUserId(formData);
  const parsed = updateRoleSchema.safeParse({ role: formData.get("role") });
  if (!userId || !parsed.success) return { status: "error", message: "Datos no válidos." };
  if (userId === admin.id) {
    return { status: "error", message: "No puedes cambiar tu propio rol." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, role: true } });
  if (!target) return { status: "error", message: "El usuario no existe." };
  if (target.role === parsed.data.role) return { status: "success", message: "Sin cambios." };

  const unassigned = await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { role: parsed.data.role } });
    return parsed.data.role === "USER" ? unassignActiveTickets(tx, target, admin.id) : 0;
  });

  revalidatePath("/dashboard/users");
  return {
    status: "success",
    message:
      unassigned > 0
        ? `Rol actualizado. Se liberaron ${unassigned} tickets que tenía asignados.`
        : `Rol de ${target.name} actualizado.`,
  };
}

export async function toggleUserActive(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");
  const userId = getUserId(formData);
  if (!userId) return { status: "error", message: "Datos no válidos." };
  if (userId === admin.id) {
    return { status: "error", message: "No puedes desactivar tu propia cuenta." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, active: true } });
  if (!target) return { status: "error", message: "El usuario no existe." };

  const active = !target.active;
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { active } });
    if (!active) await unassignActiveTickets(tx, target, admin.id);
  });

  revalidatePath("/dashboard/users");
  return {
    status: "success",
    message: active ? `${target.name} puede volver a iniciar sesión.` : `Cuenta de ${target.name} desactivada.`,
  };
}
