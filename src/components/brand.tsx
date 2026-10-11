import Link from "next/link";
import { LifeBuoy } from "lucide-react";

import { cn } from "@/lib/utils";

export function Brand({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}
    >
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <LifeBuoy className="size-4" />
      </span>
      NextTickets
    </Link>
  );
}
