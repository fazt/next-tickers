"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { changePassword, updateProfile } from "@/actions/profile";
import { FieldError, SubmitButton } from "@/components/form-controls";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type FormState, initialFormState } from "@/lib/form-state";

function useSuccessToast(state: FormState) {
  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, formAction] = useActionState(updateProfile, initialFormState);
  useSuccessToast(state);
  const errors = state.errors ?? {};
  // Tras enviar, React reinicia el formulario a estos valores por defecto.
  const values = state.fields ?? { name, email };

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" defaultValue={values.name} autoComplete="name" aria-invalid={!!errors.name} />
        <FieldError errors={errors.name} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={values.email}
          autoComplete="email"
          aria-invalid={!!errors.email}
        />
        <FieldError errors={errors.email} />
      </div>
      <div className="flex justify-end">
        <SubmitButton pendingText="Guardando...">Guardar cambios</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState(changePassword, initialFormState);
  useSuccessToast(state);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="currentPassword">Contraseña actual</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.currentPassword}
        />
        <FieldError errors={errors.currentPassword} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="newPassword">Nueva contraseña</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.newPassword}
          />
          <FieldError errors={errors.newPassword} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Repite la nueva contraseña</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
          />
          <FieldError errors={errors.confirmPassword} />
        </div>
      </div>
      <div className="flex justify-end">
        <SubmitButton pendingText="Actualizando...">Cambiar contraseña</SubmitButton>
      </div>
    </form>
  );
}
