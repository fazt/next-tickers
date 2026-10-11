import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignUpForm } from "@/app/auth/sign-up/sign-up-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Crea tu cuenta</CardTitle>
        <CardDescription>Registra tus solicitudes y sigue su avance.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
      <CardFooter className="justify-center border-t py-4 text-sm text-muted-foreground">
        ¿Ya tienes cuenta?&nbsp;
        <Link href="/auth/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
          Inicia sesión
        </Link>
      </CardFooter>
    </Card>
  );
}
