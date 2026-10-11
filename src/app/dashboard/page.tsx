import { ArrowRight, Inbox, Plus, UserCheck, UserX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, PageHeader } from "@/components/page-header";
import { PriorityBadge, StatusBadge } from "@/components/tickets/badges";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CATEGORY_LABELS,
  PRIORITY_BAR,
  PRIORITY_LABELS,
  STATUS_DOT,
  STATUS_LABELS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "@/lib/constants";
import { formatDateTime, formatRelative, formatTicketNumber } from "@/lib/format";
import { getDashboardMetrics } from "@/lib/metrics";
import { isStaff } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Panel" };

const pct = (value: number, total: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

export default async function DashboardPage() {
  const user = await requireUser();
  const staff = isStaff(user.role);
  const m = await getDashboardMetrics(user);
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Hola, ${firstName}`}
        description={
          staff
            ? `${m.active} tickets activos de ${m.total} en total.`
            : m.total === 0
              ? "Aún no has creado tickets."
              : `Tienes ${m.active} tickets activos de ${m.total} en total.`
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/tickets">
              Ver tickets <ArrowRight />
            </Link>
          </Button>
        }
      />

      <section aria-label="Tickets por estado" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TICKET_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/dashboard/tickets?status=${s}`}
            className="group rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-accent/40"
          >
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className={cn("size-2 rounded-full", STATUS_DOT[s])} aria-hidden />
              {STATUS_LABELS[s]}
            </span>
            <span className="mt-2 block text-3xl font-semibold tabular-nums tracking-tight">{m.status[s]}</span>
            <span className="text-xs text-muted-foreground">{pct(m.status[s], m.total)} % del total</span>
          </Link>
        ))}
      </section>

      {staff && (
        <section aria-label="Asignación" className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link
            href="/dashboard/tickets?assignee=none"
            className="flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-accent/40"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-orange-500/12 text-orange-600 dark:text-orange-300">
              <UserX className="size-5" />
            </span>
            <span>
              <span className="block text-2xl font-semibold tabular-nums">{m.unassigned}</span>
              <span className="text-sm text-muted-foreground">Activos sin asignar</span>
            </span>
          </Link>
          <Link
            href="/dashboard/tickets?assignee=me"
            className="flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-accent/40"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <UserCheck className="size-5" />
            </span>
            <span>
              <span className="block text-2xl font-semibold tabular-nums">{m.assignedToMe}</span>
              <span className="text-sm text-muted-foreground">Activos asignados a mí</span>
            </span>
          </Link>
        </section>
      )}

      {m.total === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Inbox}
            title="Todavía no hay tickets"
            description="Cuando abras un ticket verás aquí sus métricas y los más recientes."
            action={
              <Button asChild size="sm">
                <Link href="/dashboard/tickets/new">
                  <Plus /> Crear ticket
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por estado</CardTitle>
                <CardDescription>Todos los tickets</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label="Distribución de tickets por estado">
                  {TICKET_STATUSES.map((s) =>
                    m.status[s] > 0 ? (
                      <span key={s} className={STATUS_DOT[s]} style={{ width: `${pct(m.status[s], m.total)}%` }} />
                    ) : null,
                  )}
                </div>
                <ul className="grid gap-2 text-sm">
                  {TICKET_STATUSES.map((s) => (
                    <li key={s} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", STATUS_DOT[s])} aria-hidden />
                        {STATUS_LABELS[s]}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{m.status[s]}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activos por prioridad</CardTitle>
                <CardDescription>Abiertos y en progreso</CardDescription>
              </CardHeader>
              <CardContent>
                <BarList
                  total={m.active}
                  rows={[...TICKET_PRIORITIES].reverse().map((p) => ({
                    key: p,
                    label: PRIORITY_LABELS[p],
                    value: m.priority[p],
                    color: PRIORITY_BAR[p],
                    href: `/dashboard/tickets?priority=${p}`,
                  }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Por categoría</CardTitle>
                <CardDescription>Todos los tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <BarList
                  total={m.total}
                  rows={TICKET_CATEGORIES.map((c) => ({
                    key: c,
                    label: CATEGORY_LABELS[c],
                    value: m.category[c],
                    color: "bg-chart-1",
                    href: `/dashboard/tickets?category=${c}`,
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          <div className={cn("mt-6 grid gap-6", staff && "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]")}>
            <Card>
              <CardHeader>
                <CardTitle>Actividad reciente</CardTitle>
                <CardAction>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard/tickets">Ver todos</Link>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="px-0">
                <ul className="divide-y">
                  {m.recent.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/dashboard/tickets/${t.id}`}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 transition-colors hover:bg-muted/50"
                      >
                        <span className="min-w-0 flex-1 basis-60 truncate text-sm font-medium">
                          <span className="mr-1.5 font-mono text-xs text-muted-foreground">
                            {formatTicketNumber(t.number)}
                          </span>
                          {t.title}
                        </span>
                        <StatusBadge status={t.status} />
                        <PriorityBadge priority={t.priority} />
                        <time
                          dateTime={t.updatedAt.toISOString()}
                          title={formatDateTime(t.updatedAt)}
                          className="w-28 text-right text-xs text-muted-foreground"
                        >
                          {formatRelative(t.updatedAt)}
                        </time>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {staff && (
              <Card>
                <CardHeader>
                  <CardTitle>Carga del equipo</CardTitle>
                  <CardDescription>Tickets activos por responsable</CardDescription>
                </CardHeader>
                <CardContent>
                  <BarList
                    total={Math.max(...m.workload.map((w) => w.count), 1)}
                    rows={m.workload.map((w) => ({
                      key: w.id,
                      label: w.id === user.id ? `${w.name} (yo)` : w.name,
                      value: w.count,
                      color: "bg-chart-3",
                      href: `/dashboard/tickets?assignee=${w.id}`,
                    }))}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </>
  );
}

function BarList({
  rows,
  total,
}: {
  rows: { key: string; label: string; value: number; color: string; href: string }[];
  total: number;
}) {
  return (
    <ul className="grid gap-3">
      {rows.map((row) => (
        <li key={row.key}>
          <Link href={row.href} className="group grid gap-1.5 text-sm">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate group-hover:underline">{row.label}</span>
              <span className="tabular-nums text-muted-foreground">{row.value}</span>
            </span>
            <span className="block h-2 overflow-hidden rounded-full bg-muted">
              <span
                className={cn("block h-full rounded-full", row.color)}
                style={{ width: `${pct(row.value, total)}%` }}
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
