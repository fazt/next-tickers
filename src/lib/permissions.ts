import type { Role } from "@/generated/prisma/enums";

/**
 * Matriz de permisos:
 * - USER: crea tickets, ve y comenta solo los suyos, puede cerrarlos o reabrirlos.
 * - AGENT: ve todos los tickets, cambia estado/prioridad y asigna a cualquier
 *   miembro del equipo (agente o admin).
 * - ADMIN: todo lo anterior, además de gestionar usuarios y borrar tickets.
 */

type Actor = { id: string; role: Role };

export function isStaff(role: Role) {
  return role === "ADMIN" || role === "AGENT";
}

export function isAdmin(role: Role) {
  return role === "ADMIN";
}

export function canViewTicket(user: Actor, ticket: { authorId: string }) {
  return isStaff(user.role) || ticket.authorId === user.id;
}

export function canManageTicket(user: Actor) {
  return isStaff(user.role);
}

export function canDeleteTicket(user: Actor) {
  return isAdmin(user.role);
}
