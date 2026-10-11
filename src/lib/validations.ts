import { z } from "zod";

import {
  Role,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/generated/prisma/enums";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Ingresa un email válido").max(120, "Máximo 120 caracteres"));

const name = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres")
  .max(80, "Máximo 80 caracteres");

// bcrypt solo usa los primeros 72 bytes de la contraseña.
const newPassword = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const signUpSchema = z
  .object({
    name,
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Mínimo 5 caracteres")
    .max(120, "Máximo 120 caracteres"),
  description: z
    .string()
    .trim()
    .min(10, "Describe el problema con al menos 10 caracteres")
    .max(5000, "Máximo 5000 caracteres"),
  priority: z.enum(TicketPriority, "Elige una prioridad"),
  category: z.enum(TicketCategory, "Elige una categoría"),
});

export const updateTicketSchema = z.object({
  status: z.enum(TicketStatus, "Estado no válido"),
  priority: z.enum(TicketPriority, "Prioridad no válida"),
  // Cadena vacía = sin asignar.
  assigneeId: z.string().trim().max(40),
});

export const authorStatusSchema = z.enum(["OPEN", "CLOSED"]);

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Escribe un comentario")
    .max(2000, "Máximo 2000 caracteres"),
});

export const profileSchema = z.object({ name, email });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
    newPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const updateRoleSchema = z.object({
  role: z.enum(Role, "Rol no válido"),
});

// Filtros de listados (searchParams). Los valores inválidos se ignoran.
const optionalEnum = <T extends Record<string, string>>(values: T) =>
  z.enum(values).optional().catch(undefined);

const page = z.coerce.number().int().min(1).max(10_000).catch(1);
const query = z.string().trim().max(100).optional().catch(undefined);

export const ticketFiltersSchema = z.object({
  q: query,
  status: optionalEnum(TicketStatus),
  priority: optionalEnum(TicketPriority),
  category: optionalEnum(TicketCategory),
  // "me", "none" o el id de un miembro del equipo.
  assignee: z.string().trim().max(40).optional().catch(undefined),
  page,
});

export const userFiltersSchema = z.object({
  q: query,
  role: optionalEnum(Role),
  page,
});

export type TicketFilters = z.infer<typeof ticketFiltersSchema>;
export type UserFilters = z.infer<typeof userFiltersSchema>;

/** Toma el primer valor de un searchParam (puede venir repetido). */
export function firstParam(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "" ? undefined : v;
}

export function parseSearchParams<T extends z.ZodType>(
  schema: T,
  params: Record<string, string | string[] | undefined>,
): z.infer<T> {
  const flat = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, firstParam(value)]),
  );
  return schema.parse(flat);
}
