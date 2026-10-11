import type { Metadata } from "next";

import { PasswordForm, ProfileForm } from "@/app/dashboard/profile/profile-forms";
import { PageHeader } from "@/components/page-header";
import { RoleBadge } from "@/components/tickets/badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, initials } from "@/lib/format";
import { isStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const user = await requireUser();
  const counts = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      _count: {
        select: {
          ticketsCreated: true,
          ticketsAssigned: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } } },
          comments: true,
        },
      },
    },
  });

  return (
    <>
      <PageHeader title="Perfil" description="Tus datos de acceso y preferencias de cuenta." />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardContent className="grid justify-items-center gap-3 text-center">
            <Avatar size="lg" className="size-16">
              <AvatarFallback className="bg-primary/12 text-lg font-semibold text-primary">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm break-all text-muted-foreground">{user.email}</p>
            </div>
            <RoleBadge role={user.role} />
            <dl className="mt-2 grid w-full grid-cols-2 gap-3 border-t pt-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Tickets creados</dt>
                <dd className="text-lg font-semibold tabular-nums">{counts._count.ticketsCreated}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{isStaff(user.role) ? "Asignados activos" : "Comentarios"}</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {isStaff(user.role) ? counts._count.ticketsAssigned : counts._count.comments}
                </dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">Miembro desde {formatDate(user.createdAt)}</p>
          </CardContent>
        </Card>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos personales</CardTitle>
              <CardDescription>Tu nombre aparece en los tickets y comentarios.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm name={user.name} email={user.email} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cambiar contraseña</CardTitle>
              <CardDescription>Usa al menos 8 caracteres.</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
