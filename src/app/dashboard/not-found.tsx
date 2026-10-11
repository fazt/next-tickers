import { SearchX } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="No encontramos lo que buscas"
      description="El recurso no existe o no tienes acceso a él."
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/tickets">Ir a mis tickets</Link>
        </Button>
      }
    />
  );
}
