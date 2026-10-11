import { cache } from "react";

import type { Prisma } from "@/generated/prisma/client";
import { TICKETS_PAGE_SIZE } from "@/lib/constants";
import { isStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/session";
import type { TicketFilters } from "@/lib/validations";

/** Filtro base según el rol: un USER solo ve sus propios tickets. */
export function visibleTicketsWhere(user: CurrentUser): Prisma.TicketWhereInput {
  return isStaff(user.role) ? {} : { authorId: user.id };
}

export function ticketsWhere(user: CurrentUser, filters: TicketFilters): Prisma.TicketWhereInput {
  const and: Prisma.TicketWhereInput[] = [visibleTicketsWhere(user)];

  if (filters.status) and.push({ status: filters.status });
  if (filters.priority) and.push({ priority: filters.priority });
  if (filters.category) and.push({ category: filters.category });

  if (isStaff(user.role) && filters.assignee) {
    const assigneeId =
      filters.assignee === "me" ? user.id : filters.assignee === "none" ? null : filters.assignee;
    and.push({ assigneeId });
  }

  if (filters.q) {
    const number = Number(filters.q.replace(/^#/, ""));
    and.push({
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        ...(Number.isInteger(number) && number > 0 && number < 2 ** 31 ? [{ number }] : []),
      ],
    });
  }

  return { AND: and };
}

const ORDER_BY: Record<TicketFilters["sort"], Prisma.TicketOrderByWithRelationInput[]> = {
  updated: [{ updatedAt: "desc" }],
  created: [{ createdAt: "desc" }],
  priority: [{ priority: "desc" }, { createdAt: "asc" }],
};

export async function getTicketsPage(user: CurrentUser, filters: TicketFilters) {
  const where = ticketsWhere(user, filters);
  const total = await prisma.ticket.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / TICKETS_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: ORDER_BY[filters.sort],
    skip: (page - 1) * TICKETS_PAGE_SIZE,
    take: TICKETS_PAGE_SIZE,
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      priority: true,
      category: true,
      updatedAt: true,
      author: { select: { name: true } },
      assignee: { select: { name: true } },
      _count: { select: { comments: true } },
    },
  });

  return { tickets, total, page, pageCount };
}

// cache(): generateMetadata y la página comparten la misma consulta.
export const getTicketDetail = cache((id: string) =>
  prisma.ticket.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, role: true } } },
      },
      events: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { name: true } } },
      },
    },
  }),
);

export type TicketDetail = NonNullable<Awaited<ReturnType<typeof getTicketDetail>>>;

/** Agentes y admins activos: posibles responsables de un ticket. */
export function getStaffMembers() {
  return prisma.user.findMany({
    where: { active: true, role: { in: ["ADMIN", "AGENT"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });
}
