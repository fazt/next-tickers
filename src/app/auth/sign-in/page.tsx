import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "@/app/auth/sign-in/sign-in-form";
import { getCurrentUser } from "@/lib/session";
import { safeCallbackUrl } from "@/lib/utils";
import { firstParam } from "@/lib/validations";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(firstParam(params.callbackUrl));

  if (await getCurrentUser()) redirect(callbackUrl);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Inicia sesión</CardTitle>
        <CardDescription>Accede a tus tickets de soporte.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm callbackUrl={callbackUrl} />
      </CardContent>
      <CardFooter className="justify-center border-t py-4 text-sm text-muted-foreground">
        ¿No tienes cuenta?&nbsp;
        <Link href="/auth/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
          Regístrate
        </Link>
      </CardFooter>
    </Card>
  );
}
