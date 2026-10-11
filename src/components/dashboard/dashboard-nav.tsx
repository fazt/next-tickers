"use client";

import { LayoutDashboard, Ticket, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/users", label: "Usuarios", icon: Users, adminOnly: true },
  { href: "/dashboard/profile", label: "Perfil", icon: UserRound },
];

export function DashboardNav({
  role,
  orientation = "vertical",
}: {
  role: Role;
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => !item.adminOnly || role === "ADMIN");

  return (
    <ul
      className={cn(
        "flex gap-1",
        orientation === "vertical" ? "flex-col px-3" : "flex-row px-4 py-2",
      )}
    >
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
