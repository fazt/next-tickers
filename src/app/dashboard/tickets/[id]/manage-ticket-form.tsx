"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { updateTicket } from "@/actions/tickets";
import { FieldError, SubmitButton } from "@/components/form-controls";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { Role, TicketPriority, TicketStatus } from "@/generated/prisma/enums";
import {
  PRIORITY_LABELS,
  ROLE_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "@/lib/constants";
import { initialFormState } from "@/lib/form-state";

export function ManageTicketForm({
  ticketId,
  status,
  priority,
  assigneeId,
  staffMembers,
  currentUserId,
}: {
  ticketId: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  staffMembers: { id: string; name: string; role: Role }[];
  currentUserId: string;
}) {
  const [state, formAction] = useActionState(updateTicket, initialFormState);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="ticketId" value={ticketId} />
      <div className="grid gap-2">
        <Label htmlFor="status">Estado</Label>
        <NativeSelect id="status" name="status" defaultValue={status} className="w-full">
          {TICKET_STATUSES.map((s) => (
            <NativeSelectOption key={s} value={s}>
              {STATUS_LABELS[s]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldError errors={state.errors?.status} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="priority">Prioridad</Label>
        <NativeSelect id="priority" name="priority" defaultValue={priority} className="w-full">
          {TICKET_PRIORITIES.map((p) => (
            <NativeSelectOption key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldError errors={state.errors?.priority} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="assigneeId">Responsable</Label>
        <NativeSelect id="assigneeId" name="assigneeId" defaultValue={assigneeId ?? ""} className="w-full">
          <NativeSelectOption value="">Sin asignar</NativeSelectOption>
          <NativeSelectOptGroup label="Equipo">
            {staffMembers.map((m) => (
              <NativeSelectOption key={m.id} value={m.id}>
                {m.id === currentUserId ? `${m.name} (yo)` : m.name} · {ROLE_LABELS[m.role]}
              </NativeSelectOption>
            ))}
          </NativeSelectOptGroup>
        </NativeSelect>
        <FieldError errors={state.errors?.assigneeId} />
      </div>
      <SubmitButton pendingText="Guardando...">Guardar cambios</SubmitButton>
    </form>
  );
}
