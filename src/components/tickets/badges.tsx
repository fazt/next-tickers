import { Badge } from "@/components/ui/badge";
import type {
  Role,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/generated/prisma/enums";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  ROLE_LABELS,
  ROLE_STYLES,
  STATUS_DOT,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status], className)}>
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} aria-hidden />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority, className }: { priority: TicketPriority; className?: string }) {
  return (
    <Badge variant="outline" className={cn(PRIORITY_STYLES[priority], className)}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function CategoryBadge({ category, className }: { category: TicketCategory; className?: string }) {
  return (
    <Badge variant="secondary" className={className}>
      {CATEGORY_LABELS[category]}
    </Badge>
  );
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <Badge variant="outline" className={cn(ROLE_STYLES[role], className)}>
      {ROLE_LABELS[role]}
    </Badge>
  );
}
