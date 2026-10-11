"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { toggleUserActive, updateUserRole } from "@/actions/users";
import { SubmitButton } from "@/components/form-controls";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS, ROLES } from "@/lib/constants";
import { type FormState, initialFormState } from "@/lib/form-state";

function useToastFeedback(state: FormState) {
  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);
}

export function UserRoleForm({ userId, role }: { userId: string; role: Role }) {
  const [state, formAction] = useActionState(updateUserRole, initialFormState);
  useToastFeedback(state);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <NativeSelect name="role" defaultValue={role} size="sm" aria-label="Rol">
        {ROLES.map((r) => (
          <NativeSelectOption key={r} value={r}>
            {ROLE_LABELS[r]}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <SubmitButton size="sm" variant="outline">
        Guardar
      </SubmitButton>
    </form>
  );
}

export function UserActiveForm({ userId, active }: { userId: string; active: boolean }) {
  const [state, formAction] = useActionState(toggleUserActive, initialFormState);
  useToastFeedback(state);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton size="sm" variant={active ? "ghost" : "outline"} className={active ? "text-destructive" : ""}>
        {active ? "Desactivar" : "Activar"}
      </SubmitButton>
    </form>
  );
}
