import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { TicketForm } from "@/app/dashboard/tickets/new/ticket-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Nuevo ticket" };

export default async function NewTicketPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/tickets"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a tickets
      </Link>
      <PageHeader
        title="Nuevo ticket"
        description="Cuéntanos qué ocurre. Mientras más detalle, más rápido podremos ayudarte."
      />
      <Card>
        <CardContent>
          <TicketForm />
        </CardContent>
      </Card>
    </div>
  );
}
