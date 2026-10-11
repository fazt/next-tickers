import type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/generated/prisma/enums";
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/constants";
import { isStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/session";
import { visibleTicketsWhere } from "@/lib/tickets";

const ACTIVE: TicketStatus[] = ["OPEN", "IN_PROGRESS"];

function toRecord<K extends string>(keys: K[], rows: { key: K; count: number }[]) {
  const record = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  for (const row of rows) record[row.key] = row.count;
  return record;
}

/** Métricas del panel. Un USER solo ve las de sus propios tickets. */
export async function getDashboardMetrics(user: CurrentUser) {
  const base = visibleTicketsWhere(user);
  const staff = isStaff(user.role);

  const [byStatus, byPriority, byCategory, recent, unassigned, assignedToMe, workload] =
    await Promise.all([
      prisma.ticket.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
      prisma.ticket.groupBy({
        by: ["priority"],
        where: { ...base, status: { in: ACTIVE } },
        _count: { _all: true },
      }),
      prisma.ticket.groupBy({ by: ["category"], where: base, _count: { _all: true } }),
      prisma.ticket.findMany({
        where: base,
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          priority: true,
          updatedAt: true,
          assignee: { select: { name: true } },
        },
      }),
      staff
        ? prisma.ticket.count({ where: { status: { in: ACTIVE }, assigneeId: null } })
        : Promise.resolve(0),
      staff
        ? prisma.ticket.count({ where: { status: { in: ACTIVE }, assigneeId: user.id } })
        : Promise.resolve(0),
      staff
        ? prisma.user.findMany({
            where: { active: true, role: { in: ["ADMIN", "AGENT"] } },
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              _count: { select: { ticketsAssigned: { where: { status: { in: ACTIVE } } } } },
            },
          })
        : Promise.resolve([]),
    ]);

  const status = toRecord<TicketStatus>(
    TICKET_STATUSES,
    byStatus.map((r) => ({ key: r.status, count: r._count._all })),
  );
  const priority = toRecord<TicketPriority>(
    TICKET_PRIORITIES,
    byPriority.map((r) => ({ key: r.priority, count: r._count._all })),
  );
  const category = toRecord<TicketCategory>(
    TICKET_CATEGORIES,
    byCategory.map((r) => ({ key: r.category, count: r._count._all })),
  );

  return {
    total: Object.values(status).reduce((a, b) => a + b, 0),
    active: status.OPEN + status.IN_PROGRESS,
    status,
    priority,
    category,
    recent,
    unassigned,
    assignedToMe,
    workload: workload.map((m) => ({ id: m.id, name: m.name, count: m._count.ticketsAssigned })),
  };
}
