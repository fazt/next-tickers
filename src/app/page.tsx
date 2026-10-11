import { ArrowRight, BarChart3, History, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { ModeToggle } from "@/components/mode-toggle";
import { PriorityBadge, StatusBadge } from "@/components/tickets/badges";
import { Button } from "@/components/ui/button";
import type { TicketPriority, TicketStatus } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/session";

const FEATURES = [
  {
    icon: History,
    title: "Seguimiento de principio a fin",
    text: "Cada ticket guarda sus comentarios y un historial de estados, prioridades y asignaciones.",
  },
  {
    icon: ShieldCheck,
    title: "Roles con permisos claros",
    text: "Usuarios, agentes y administradores ven y hacen solo lo que les corresponde.",
  },
  {
    icon: BarChart3,
    title: "Métricas al día",
    text: "Un panel con tickets por estado y prioridad para saber dónde poner el foco.",
  },
];

const PREVIEW: { number: number; title: string; status: TicketStatus; priority: TicketPriority; who: string }[] = [
  { number: 12, title: "Cobro duplicado en la factura de septiembre", status: "OPEN", priority: "URGENT", who: "Sin asignar" },
  { number: 11, title: "No llegan los correos de recuperación", status: "IN_PROGRESS", priority: "URGENT", who: "Diego P." },
  { number: 8, title: "La página de pagos tarda mucho en cargar", status: "IN_PROGRESS", priority: "MEDIUM", who: "Lucía T." },
  { number: 6, title: "El cambio de plan no se refleja", status: "RESOLVED", priority: "HIGH", who: "Diego P." },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Brand />
        <div className="flex items-center gap-1.5">
          {user ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Ir al panel</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/sign-in">Iniciar sesión</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/sign-up">Crear cuenta</Link>
              </Button>
            </>
          )}
          <ModeToggle />
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="grid gap-6">
            <p className="w-fit rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              Mesa de ayuda para equipos pequeños
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Soporte ordenado, sin correos perdidos.
            </h1>
            <p className="max-w-xl text-lg text-pretty text-muted-foreground">
              Tus usuarios abren tickets, tu equipo los asigna y resuelve, y todos ven en qué
              punto está cada solicitud.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={user ? "/dashboard/tickets/new" : "/auth/sign-up"}>
                  {user ? "Crear un ticket" : "Empezar gratis"}
                  <ArrowRight />
                </Link>
              </Button>
              {!user && (
                <Button asChild size="lg" variant="outline">
                  <Link href="/auth/sign-in">Ya tengo cuenta</Link>
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-2 shadow-xl shadow-primary/5" aria-hidden>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium">Tickets activos</span>
              <span className="text-xs text-muted-foreground">Actualizado hace un momento</span>
            </div>
            <ul className="divide-y rounded-xl border bg-background">
              {PREVIEW.map((t) => (
                <li key={t.number} className="grid gap-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium">
                      <span className="mr-1.5 font-mono text-muted-foreground">#{t.number}</span>
                      {t.title}
                    </span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <StatusBadge status={t.status} />
                    {t.who}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="grid gap-2">
                <Icon className="size-5 text-primary" />
                <h2 className="font-medium">{title}</h2>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 text-sm text-muted-foreground sm:px-6">
          NextTickets · Next.js, Prisma y PostgreSQL
        </div>
      </footer>
    </div>
  );
}
