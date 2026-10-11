"use client";

import { useActionState } from "react";

import { addComment } from "@/actions/tickets";
import { FieldError, SubmitButton } from "@/components/form-controls";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState } from "@/lib/form-state";

export function CommentForm({ ticketId }: { ticketId: string }) {
  const [state, formAction] = useActionState(addComment, initialFormState);
  const bodyError = state.errors?.body ?? (state.status === "error" && state.message ? [state.message] : undefined);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      <Label htmlFor="body" className="sr-only">
        Nuevo comentario
      </Label>
      <Textarea
        id="body"
        name="body"
        rows={3}
        maxLength={2000}
        // Tras un error React reinicia el formulario: se recupera el texto enviado.
        defaultValue={state.status === "error" ? state.fields?.body : ""}
        placeholder="Escribe una respuesta..."
        aria-invalid={!!state.errors?.body}
        aria-describedby="body-error"
      />
      <div className="flex items-center justify-between gap-3">
        <FieldError id="body-error" errors={bodyError} />
        <SubmitButton size="sm" className="ml-auto" pendingText="Enviando...">
          Comentar
        </SubmitButton>
      </div>
    </form>
  );
}
