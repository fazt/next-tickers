import { requireRole } from "@/lib/session";

export default async function UsersPage() {
  await requireRole("ADMIN");
  return <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>;
}
