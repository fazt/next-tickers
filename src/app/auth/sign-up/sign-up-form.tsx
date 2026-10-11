"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { registerUser } from "@/actions/auth";
import { FieldError } from "@/components/form-controls";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/form-state";

export function SignUpForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [pending, startTransition] = useTransition();
  const errors = state.errors ?? {};

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(
      [...new FormData(event.currentTarget).entries()].map(([k, v]) => [k, String(v)]),
    );

    startTransition(async () => {
      const result = await registerUser(fields);
      if (result.status !== "success") {
        setState(result);
        return;
      }
      // Cuenta creada: inicia sesión con las mismas credenciales.
      const login = await signIn("credentials", {
        email: fields.email,
        password: fields.password,
        redirect: false,
      });
      if (!login || login.error) {
        router.replace("/auth/sign-in");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" autoComplete="name" required aria-invalid={!!errors.name} aria-describedby="name-error" />
        <FieldError id="name-error" errors={errors.name} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="tu@correo.com" required aria-invalid={!!errors.email} aria-describedby="email-error" />
        <FieldError id="email-error" errors={errors.email} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required aria-invalid={!!errors.password} aria-describedby="password-error" />
        <FieldError id="password-error" errors={errors.password} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Repite la contraseña</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required aria-invalid={!!errors.confirmPassword} aria-describedby="confirm-error" />
        <FieldError id="confirm-error" errors={errors.confirmPassword} />
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Crear cuenta
      </Button>
    </form>
  );
}
