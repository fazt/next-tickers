"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import {
  type FormState,
  formDataToObject,
  validationError,
} from "@/lib/form-state";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { changePasswordSchema, profileSchema } from "@/lib/validations";

const EMAIL_TAKEN = (fields: Record<string, string>): FormState => ({
  status: "error",
  message: "Revisa los campos marcados.",
  errors: { email: ["Ese email ya está en uso"] },
  fields,
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const fields = formDataToObject(formData);
  const parsed = profileSchema.safeParse(fields);
  if (!parsed.success) return validationError(parsed.error, fields);

  const { name, email } = parsed.data;
  if (email !== user.email) {
    const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (taken) return EMAIL_TAKEN(fields);
  }

  try {
    await prisma.user.update({ where: { id: user.id }, data: { name, email } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return EMAIL_TAKEN(fields);
    }
    throw error;
  }

  revalidatePath("/dashboard", "layout");
  return { status: "success", message: "Perfil actualizado.", fields: { name, email } };
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(formDataToObject(formData));
  // No se devuelven los valores: las contraseñas no deben volver al formulario.
  if (!parsed.success) return validationError(parsed.error);

  const { passwordHash } = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  const valid = passwordHash !== "" && (await bcrypt.compare(parsed.data.currentPassword, passwordHash));
  if (!valid) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      errors: { currentPassword: ["La contraseña actual no es correcta"] },
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
  });
  return { status: "success", message: "Contraseña actualizada." };
}
