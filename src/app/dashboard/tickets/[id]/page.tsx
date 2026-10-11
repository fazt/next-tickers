import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Lock,
  RotateCcw,
  UserPlus,
  XCircle,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { setTicketStatusAsAuthor } from "@/actions/tickets";
import { CommentForm } from "@/app/dashboard/tickets/[id]/comment-form";
import { DeleteTicketButton } from "@/app/dashboard/tickets/[id]/delete-ticket-button";
import { ManageTicketForm } from "@/app/dashboard/tickets/[id]/manage-ticket-form";
import { SubmitButton } from "@/components/form-controls";
import {
  CategoryBadge,
  PriorityBadge,
  RoleBadge,
  StatusBadge,
} from "@/components/tickets/badges";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TicketPriority, TicketStatus } from "@/generated/prisma/enums";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, formatRelative, formatTicketNumber, initials } from "@/lib/format";
import { canDeleteTicket, canManageTicket, canViewTicket, isStaff } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { getStaffMembers, getTicketDetail, type TicketDetail } from "@/lib/tickets";
import { cn } from "@/lib/utils";
import { firstParam } from "@/lib/validations";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const ticket = await getTicketDetail(id);
  if (!ticket || !canViewTicket(user, ticket)) return { title: "Ticket no encontrado" };
  return { title: `${formatTicketNumber(ticket.number)} ${ticket.title}` };
}

export default async function TicketPage({ params, searchParams }: PageProps) {
  const [{ id }, query, user] = await Promise.all([params, searchParams, requireUser()]);
  const ticket = await getTicketDetail(id);
  // Un ticket ajeno responde igual que uno inexistente para no revelar que existe.
  if (!ticket || !canViewTicket(user, ticket)) notFound();

  const manage = canManageTicket(user);
  const isAuthor = ticket.authorId === user.id;
  const staffMembers = manage ? await getStaffMembers() : [];

  return (
    <>
      <Link
        href="/dashboard/tickets"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a tickets
      </Link>

      <header className="mb-6 grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <CategoryBadge category={ticket.category} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          <span className="mr-2 font-mono text-muted-foreground">{formatTicketNumber(ticket.number)}</span>
          {ticket.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Abierto por <span className="font-medium text-foreground">{ticket.author.name}</span>{" "}
          <time dateTime={ticket.createdAt.toISOString()} title={formatDateTime(ticket.createdAt)}>
            {formatRelative(ticket.createdAt)}
          </time>
          {" · "}
          {ticket.assignee ? (
            <>
              Responsable: <span className="font-medium text-foreground">{ticket.assignee.name}</span>
            </>
          ) : (
            "Sin responsable asignado"
          )}
        </p>
      </header>

      {firstParam(query.created) && (
        <Alert className="mb-6">
          <CheckCircle2 />
          <AlertDescription>
            Ticket creado. El equipo de soporte lo revisará pronto; te responderemos aquí.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Conversación{" "}
                <span className="font-normal text-muted-foreground">({ticket.comments.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              {ticket.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no hay comentarios.</p>
              ) : (
                <ol className="grid gap-5">
                  {ticket.comments.map((comment) => {
                    const fromStaff = isStaff(comment.author.role);
                    return (
                      <li key={comment.id} className="flex gap-3">
                        <Avatar size="sm" className="mt-0.5">
                          <AvatarFallback
                            className={cn("text-[10px] font-semibold", fromStaff && "bg-primary/12 text-primary")}
                          >
                            {initials(comment.author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid min-w-0 flex-1 gap-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                            <span className="font-medium">{comment.author.name}</span>
                            {fromStaff && <RoleBadge role={comment.author.role} />}
                            <time
                              dateTime={comment.createdAt.toISOString()}
                              title={formatDateTime(comment.createdAt)}
                              className="text-xs text-muted-foreground"
                            >
                              {formatRelative(comment.createdAt)}
                            </time>
                          </div>
                          <p
                            className={cn(
                              "rounded-lg border px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                              fromStaff ? "bg-primary/5" : "bg-muted/40",
                            )}
                          >
                            {comment.body}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              {ticket.status === "CLOSED" ? (
                <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Lock className="size-4" /> El ticket está cerrado. Reábrelo para seguir la conversación.
                </p>
              ) : (
                <CommentForm ticketId={ticket.id} />
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="grid content-start gap-6">
          {manage && (
            <Card>
              <CardHeader>
                <CardTitle>Gestionar</CardTitle>
              </CardHeader>
              <CardContent>
                <ManageTicketForm
                  ticketId={ticket.id}
                  status={ticket.status}
                  priority={ticket.priority}
                  assigneeId={ticket.assigneeId}
                  staffMembers={staffMembers}
                  currentUserId={user.id}
                />
              </CardContent>
            </Card>
          )}

          {isAuthor && !manage && <AuthorActions ticketId={ticket.id} status={ticket.status} />}

          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                <dt className="text-muted-foreground">Categoría</dt>
                <dd>{CATEGORY_LABELS[ticket.category]}</dd>
                <dt className="text-muted-foreground">Autor</dt>
                <dd className="min-w-0">
                  <span className="block truncate">{ticket.author.name}</span>
                  {manage && (
                    <span className="block truncate text-xs text-muted-foreground">{ticket.author.email}</span>
                  )}
                </dd>
                <dt className="text-muted-foreground">Responsable</dt>
                <dd>{ticket.assignee?.name ?? "Sin asignar"}</dd>
                <dt className="text-muted-foreground">Creado</dt>
                <dd>{formatDateTime(ticket.createdAt)}</dd>
                <dt className="text-muted-foreground">Actualizado</dt>
                <dd>{formatDateTime(ticket.updatedAt)}</dd>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative grid gap-4 border-l pl-5">
                {ticket.events.map((event) => (
                  <li key={event.id} className="relative text-sm">
                    <span className="absolute top-0.5 -left-[29px] flex size-4 items-center justify-center rounded-full bg-background ring-1 ring-border">
                      <EventIcon type={event.type} />
                    </span>
                    <p>{describeEvent(event)}</p>
                    <time
                      dateTime={event.createdAt.toISOString()}
                      title={formatDateTime(event.createdAt)}
                      className="text-xs text-muted-foreground"
                    >
                      {formatRelative(event.createdAt)}
                    </time>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {canDeleteTicket(user) && <DeleteTicketButton ticketId={ticket.id} number={ticket.number} />}
        </aside>
      </div>
    </>
  );
}

function AuthorActions({ ticketId, status }: { ticketId: string; status: TicketStatus }) {
  const canReopen = status === "RESOLVED" || status === "CLOSED";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {status === "RESOLVED" && (
          <p className="text-sm text-muted-foreground">
            El equipo marcó este ticket como resuelto. Ciérralo si todo está bien o reábrelo si
            el problema continúa.
          </p>
        )}
        {status !== "CLOSED" && (
          <form action={setTicketStatusAsAuthor}>
            <input type="hidden" name="ticketId" value={ticketId} />
            <input type="hidden" name="status" value="CLOSED" />
            <SubmitButton variant="outline" className="w-full">
              <XCircle /> Cerrar ticket
            </SubmitButton>
          </form>
        )}
        {canReopen && (
          <form action={setTicketStatusAsAuthor}>
            <input type="hidden" name="ticketId" value={ticketId} />
            <input type="hidden" name="status" value="OPEN" />
            <SubmitButton variant="outline" className="w-full">
              <RotateCcw /> Reabrir ticket
            </SubmitButton>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function EventIcon({ type }: { type: TicketDetail["events"][number]["type"] }) {
  const className = "size-2.5 text-muted-foreground";
  if (type === "ASSIGNED") return <UserPlus className={className} />;
  if (type === "CREATED") return <CircleDot className="size-2.5 text-primary" />;
  return <span className="size-1.5 rounded-full bg-muted-foreground" />;
}

function describeEvent(event: TicketDetail["events"][number]) {
  const actor = <span className="font-medium">{event.actor.name}</span>;
  switch (event.type) {
    case "CREATED":
      return <>{actor} creó el ticket</>;
    case "STATUS_CHANGED":
      return (
        <>
          {actor} cambió el estado de {STATUS_LABELS[event.fromValue as TicketStatus] ?? event.fromValue} a{" "}
          <span className="font-medium">{STATUS_LABELS[event.toValue as TicketStatus] ?? event.toValue}</span>
        </>
      );
    case "PRIORITY_CHANGED":
      return (
        <>
          {actor} cambió la prioridad de {PRIORITY_LABELS[event.fromValue as TicketPriority] ?? event.fromValue} a{" "}
          <span className="font-medium">{PRIORITY_LABELS[event.toValue as TicketPriority] ?? event.toValue}</span>
        </>
      );
    case "ASSIGNED":
      if (!event.toValue) return <>{actor} quitó la asignación{event.fromValue ? ` a ${event.fromValue}` : ""}</>;
      if (event.toValue === event.actor.name) return <>{actor} se asignó el ticket</>;
      return (
        <>
          {actor} asignó el ticket a <span className="font-medium">{event.toValue}</span>
        </>
      );
  }
}
