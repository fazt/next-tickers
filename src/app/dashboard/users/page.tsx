import { Search, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { UserActiveForm, UserRoleForm } from "@/app/dashboard/users/user-row-actions";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { RoleBadge } from "@/components/tickets/badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Prisma } from "@/generated/prisma/client";
import { ROLE_LABELS, ROLES, USERS_PAGE_SIZE } from "@/lib/constants";
import { formatDate, initials } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { parseSearchParams, userFiltersSchema } from "@/lib/validations";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // El proxy ya filtra por el rol del JWT; aquí se valida contra la base de datos.
  const admin = await requireRole("ADMIN");
  const filters = parseSearchParams(userFiltersSchema, await searchParams);

  const where: Prisma.UserWhereInput = {
    ...(filters.role && { role: filters.role }),
    ...(filters.q && {
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { email: { contains: filters.q, mode: "insensitive" } },
      ],
    }),
  };

  const total = await prisma.user.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const users = await prisma.user.findMany({
    where,
    orderBy: [{ role: "asc" }, { name: "asc" }],
    skip: (page - 1) * USERS_PAGE_SIZE,
    take: USERS_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      _count: {
        select: {
          ticketsCreated: true,
          ticketsAssigned: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } } },
        },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Gestiona roles y accesos. Las cuentas desactivadas no pueden iniciar sesión."
      />

      <form
        action="/dashboard/users"
        method="get"
        role="search"
        className="mb-4 grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Buscar por nombre o email"
            aria-label="Buscar usuarios"
            className="pl-8"
          />
        </div>
        <NativeSelect name="role" defaultValue={filters.role ?? ""} aria-label="Rol" className="w-full">
          <NativeSelectOption value="">Todos los roles</NativeSelectOption>
          {ROLES.map((r) => (
            <NativeSelectOption key={r} value={r}>
              {ROLE_LABELS[r]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            Filtrar
          </Button>
          {(filters.q || filters.role) && (
            <Button asChild variant="ghost">
              <Link href="/dashboard/users">Limpiar</Link>
            </Button>
          )}
        </div>
      </form>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="Sin resultados" description="Ningún usuario coincide con la búsqueda." />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Creados</TableHead>
                <TableHead className="text-right">Asignados</TableHead>
                <TableHead>Alta</TableHead>
                <TableHead className="pr-4 text-right">Acceso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isSelf = u.id === admin.id;
                return (
                  <TableRow key={u.id} className={u.active ? undefined : "opacity-60"}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback className="text-[10px] font-semibold">{initials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div className="grid">
                          <span className="font-medium">
                            {u.name}
                            {isSelf && <span className="ml-1 text-muted-foreground">(tú)</span>}
                          </span>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isSelf ? <RoleBadge role={u.role} /> : <UserRoleForm userId={u.id} role={u.role} />}
                    </TableCell>
                    <TableCell>
                      {u.active ? (
                        <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="outline">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{u._count.ticketsCreated}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {u.role === "USER" ? <span className="text-muted-foreground">—</span> : u._count.ticketsAssigned}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="pr-4 text-right">
                      {isSelf ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex justify-end">
                          <UserActiveForm userId={u.id} active={u.active} />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        basePath="/dashboard/users"
        params={{ q: filters.q, role: filters.role }}
        page={page}
        pageCount={pageCount}
        pageSize={USERS_PAGE_SIZE}
        total={total}
      />
    </>
  );
}
