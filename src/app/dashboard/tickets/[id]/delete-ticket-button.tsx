"use client";

import { Trash2 } from "lucide-react";

import { deleteTicket } from "@/actions/tickets";
import { SubmitButton } from "@/components/form-controls";

export function DeleteTicketButton({ ticketId, number }: { ticketId: string; number: number }) {
  return (
    <form
      action={deleteTicket}
      onSubmit={(event) => {
        if (!window.confirm(`¿Eliminar el ticket #${number}? Esta acción no se puede deshacer.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <SubmitButton variant="destructive" className="w-full" pendingText="Eliminando...">
        <Trash2 /> Eliminar ticket
      </SubmitButton>
    </form>
  );
}
