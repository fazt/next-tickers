import { Plus } from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center px-5">
          <Brand href="/dashboard" />
        </div>
        <nav aria-label="Principal" className="py-2">
          <DashboardNav role={user.role} />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
            <Brand href="/dashboard" className="md:hidden" />
            <div className="ml-auto flex items-center gap-1.5">
              <Button asChild size="sm">
                <Link href="/dashboard/tickets/new">
                  <Plus />
                  <span className="hidden sm:inline">Nuevo ticket</span>
                </Link>
              </Button>
              <ModeToggle />
              <UserMenu name={user.name} email={user.email} role={user.role} />
            </div>
          </div>
          <nav aria-label="Principal" className="overflow-x-auto border-t md:hidden">
            <DashboardNav role={user.role} orientation="horizontal" />
          </nav>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
