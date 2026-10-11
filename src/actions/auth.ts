"use server";

import bcrypt from "bcryptjs";

import { Prisma } from "@/generated/prisma/client";
import { type FormState, validationError } from "@/lib/form-state";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validations";

const EMAIL_TAKEN: FormState = {
  status: "error",
  message: "Revisa los campos marcados.",
  errors: { email: ["Ya existe una cuenta con este email"] },
};

/** Registro público: siempre crea cuentas con rol USER. */
export async function registerUser(input: Record<string, string>): Promise<FormState> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { name, email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return EMAIL_TAKEN;

  try {
    await prisma.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(password, 10), role: "USER" },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return EMAIL_TAKEN;
    }
    throw error;
  }

  return { status: "success", message: "Cuenta creada" };
}
