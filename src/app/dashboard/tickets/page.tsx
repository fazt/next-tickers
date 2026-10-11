import { CheckCircle2, Inbox, MessageSquare, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { CategoryBadge, PriorityBadge, StatusBadge } from "@/components/tickets/badges";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TICKETS_PAGE_SIZE } from "@/lib/constants";
import { formatDateTime, formatRelative, formatTicketNumber } from "@/lib/format";
import { isStaff } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { getStaffMembers, getTicketsPage } from "@/lib/tickets";
import { firstParam, parseSearchParams, ticketFiltersSchema } from "@/lib/validations";

export const metadata: Metadata = { title: "Tickets" };

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const filters = parseSearchParams(ticketFiltersSchema, params);
  const staff = isStaff(user.role);

  const [{ tickets, total, page, pageCount }, staffMembers] = await Promise.all([
    getTicketsPage(user, filters),
    staff ? getStaffMembers() : Promise.resolve(undefined),
  ]);

  return (
    <>
      <PageHeader
        title="Tickets"
        description={staff ? "Todos los tickets del equipo de soporte." : "Tus solicitudes de soporte."}
        actions={
          <Button asChild>
            <Link href="/dashboard/tickets/new">
              <Plus /> Nuevo ticket
            </Link>
          </Button>
        }
      />

      {firstParam(params.deleted) && (
        <Alert className="mb-4">
          <CheckCircle2 />
          <AlertDescription>El ticket se eliminó correctamente.</AlertDescription>
        </Alert>
      )}

      <TicketFilters filters={filters} staffMembers={staffMembers} />

      {tickets.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={total === 0 && !filters.q ? "No hay tickets todavía" : "Sin resultados"}
          description={
            total === 0 && !filters.q
              ? "Cuando se cree un ticket aparecerá aquí."
              : "Prueba con otros filtros o limpia la búsqueda."
          }
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/tickets/new">Crear ticket</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%] pl-4">Ticket</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead className="pr-4 text-right">Actualizado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="max-w-0 pl-4 whitespace-normal">
                    <Link href={`/dashboard/tickets/${t.id}`} className="group grid gap-1">
                      <span className="truncate font-medium group-hover:underline">
                        <span className="mr-1.5 font-mono text-xs text-muted-foreground">
                          {formatTicketNumber(t.number)}
                        </span>
                        {t.title}
                      </span>
                      <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <CategoryBadge category={t.category} />
                        {staff && <span>por {t.author.name}</span>}
                        {t._count.comments > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="size-3" /> {t._count.comments}
                          </span>
                        )}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={t.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={t.priority} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.assignee?.name ?? <span className="italic">Sin asignar</span>}
                  </TableCell>
                  <TableCell className="pr-4 text-right text-muted-foreground">
                    <time dateTime={t.updatedAt.toISOString()} title={formatDateTime(t.updatedAt)}>
                      {formatRelative(t.updatedAt)}
                    </time>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        basePath="/dashboard/tickets"
        params={{ ...filters, sort: filters.sort === "updated" ? undefined : filters.sort }}
        page={page}
        pageCount={pageCount}
        pageSize={TICKETS_PAGE_SIZE}
        total={total}
      />
    </>
  );
}
