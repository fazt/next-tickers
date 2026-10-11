"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { TicketEventType } from "@/generated/prisma/enums";
import {
  type FormState,
  formDataToObject,
  validationError,
} from "@/lib/form-state";
import {
  canDeleteTicket,
  canManageTicket,
  canViewTicket,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  authorStatusSchema,
  commentSchema,
  createTicketSchema,
  updateTicketSchema,
} from "@/lib/validations";

const ticketPath = (id: string) => `/dashboard/tickets/${id}`;

// El id del ticket llega como campo oculto del formulario y no con .bind():
// con acciones enlazadas + useActionState, el envío sin JavaScript (mejora
// progresiva) deja la respuesta colgada en Next 16.4 / React 19.3.
function assertId(id: unknown): asserts id is string {
  if (typeof id !== "string" || id.length === 0 || id.length > 40) {
    throw new Error("Identificador de ticket no válido");
  }
}

export async function createTicket(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const fields = formDataToObject(formData);
  const parsed = createTicketSchema.safeParse(fields);
  if (!parsed.success) return validationError(parsed.error, fields);

  const ticket = await prisma.ticket.create({
    data: {
      ...parsed.data,
      authorId: user.id,
      events: { create: { type: "CREATED", toValue: "OPEN", actorId: user.id } },
    },
    select: { id: true },
  });

  revalidatePath("/dashboard", "layout");
  redirect(`${ticketPath(ticket.id)}?created=1`);
}

/** Cambio de estado, prioridad y responsable (solo agentes y admins). */
export async function updateTicket(_prev: FormState, formData: FormData): Promise<FormState> {
  const ticketId = formData.get("ticketId");
  assertId(ticketId);
  const user = await requireUser();
  if (!canManageTicket(user)) {
    return { status: "error", message: "No tienes permiso para gestionar tickets." };
  }

  const fields = formDataToObject(formData);
  const parsed = updateTicketSchema.safeParse(fields);
  if (!parsed.success) return validationError(parsed.error, fields);
  const { status, priority, assigneeId } = parsed.data;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { status: true, priority: true, assigneeId: true, assignee: { select: { name: true } } },
  });
  if (!ticket) return { status: "error", message: "El ticket ya no existe." };

  let assignee: { id: string; name: string } | null = null;
  if (assigneeId) {
    assignee = await prisma.user.findFirst({
      where: { id: assigneeId, active: true, role: { in: ["ADMIN", "AGENT"] } },
      select: { id: true, name: true },
    });
    if (!assignee) {
      return {
        status: "error",
        message: "Revisa los campos marcados.",
        errors: { assigneeId: ["Elige un agente o admin activo"] },
      };
    }
  }

  const events: { type: TicketEventType; fromValue: string | null; toValue: string | null; actorId: string }[] = [];
  if (status !== ticket.status) {
    events.push({ type: "STATUS_CHANGED", fromValue: ticket.status, toValue: status, actorId: user.id });
  }
  if (priority !== ticket.priority) {
    events.push({ type: "PRIORITY_CHANGED", fromValue: ticket.priority, toValue: priority, actorId: user.id });
  }
  if ((assignee?.id ?? null) !== ticket.assigneeId) {
    events.push({
      type: "ASSIGNED",
      fromValue: ticket.assignee?.name ?? null,
      toValue: assignee?.name ?? null,
      actorId: user.id,
    });
  }

  if (events.length === 0) {
    return { status: "success", message: "No había cambios que guardar." };
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status, priority, assigneeId: assignee?.id ?? null, events: { create: events } },
  });

  revalidatePath(ticketPath(ticketId));
  return { status: "success", message: "Ticket actualizado." };
}

/** El autor puede cerrar su ticket o reabrirlo si ya estaba resuelto o cerrado. */
export async function setTicketStatusAsAuthor(formData: FormData) {
  const ticketId = formData.get("ticketId");
  assertId(ticketId);
  const target = authorStatusSchema.parse(formData.get("status"));
  const user = await requireUser();

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { authorId: true, status: true },
  });
  if (!ticket || ticket.authorId !== user.id) {
    throw new Error("No puedes modificar este ticket");
  }

  const allowed =
    target === "CLOSED"
      ? ticket.status !== "CLOSED"
      : ticket.status === "RESOLVED" || ticket.status === "CLOSED";
  if (allowed) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: target,
        events: {
          create: { type: "STATUS_CHANGED", fromValue: ticket.status, toValue: target, actorId: user.id },
        },
      },
    });
  }

  revalidatePath(ticketPath(ticketId));
}

export async function addComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const ticketId = formData.get("ticketId");
  assertId(ticketId);
  const user = await requireUser();

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { authorId: true, status: true },
  });
  if (!ticket || !canViewTicket(user, ticket)) {
    return { status: "error", message: "El ticket no existe." };
  }
  if (ticket.status === "CLOSED") {
    return { status: "error", message: "El ticket está cerrado. Reábrelo para comentar." };
  }

  const fields = formDataToObject(formData);
  const parsed = commentSchema.safeParse(fields);
  if (!parsed.success) return validationError(parsed.error, fields);

  // Se actualiza updatedAt para que el ticket suba en "actualizados recientemente".
  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      updatedAt: new Date(),
      comments: { create: { body: parsed.data.body, authorId: user.id } },
    },
  });

  revalidatePath(ticketPath(ticketId));
  return { status: "success", message: "Comentario publicado." };
}

export async function deleteTicket(formData: FormData) {
  const ticketId = formData.get("ticketId");
  assertId(ticketId);
  const user = await requireUser();
  if (!canDeleteTicket(user)) throw new Error("Solo un admin puede eliminar tickets");

  await prisma.ticket.delete({ where: { id: ticketId } });

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/tickets?deleted=1");
}
