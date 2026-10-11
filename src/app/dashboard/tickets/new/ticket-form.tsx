"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createTicket } from "@/actions/tickets";
import { FieldError, SubmitButton } from "@/components/form-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from "@/lib/constants";
import { initialFormState } from "@/lib/form-state";

export function TicketForm() {
  const [state, formAction] = useActionState(createTicket, initialFormState);
  const errors = state.errors ?? {};
  const fields = state.fields ?? {};

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          defaultValue={fields.title}
          placeholder="Ej.: No puedo descargar mis facturas"
          maxLength={120}
          required
          aria-invalid={!!errors.title}
          aria-describedby="title-error"
        />
        <FieldError id="title-error" errors={errors.title} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="category">Categoría</Label>
          <NativeSelect
            id="category"
            name="category"
            defaultValue={fields.category ?? "GENERAL"}
            className="w-full"
            aria-invalid={!!errors.category}
          >
            {TICKET_CATEGORIES.map((c) => (
              <NativeSelectOption key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError errors={errors.category} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="priority">Prioridad</Label>
          <NativeSelect
            id="priority"
            name="priority"
            defaultValue={fields.priority ?? "MEDIUM"}
            className="w-full"
            aria-invalid={!!errors.priority}
          >
            {TICKET_PRIORITIES.map((p) => (
              <NativeSelectOption key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError errors={errors.priority} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={fields.description}
          rows={8}
          maxLength={5000}
          placeholder="¿Qué pasó? ¿Qué esperabas que pasara? ¿Desde cuándo ocurre?"
          required
          aria-invalid={!!errors.description}
          aria-describedby="description-error"
        />
        <FieldError id="description-error" errors={errors.description} />
      </div>

      <div className="flex justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href="/dashboard/tickets">Cancelar</Link>
        </Button>
        <SubmitButton pendingText="Creando...">Crear ticket</SubmitButton>
      </div>
    </form>
  );
}
