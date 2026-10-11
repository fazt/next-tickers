import type {
  Role,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/generated/prisma/enums";

// Etiquetas en español y estilos de los enums. Solo importa tipos de Prisma,
// así que se puede usar también desde componentes de cliente.

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  GENERAL: "General",
  TECHNICAL: "Soporte técnico",
  BILLING: "Facturación",
  ACCOUNT: "Cuenta",
  FEATURE_REQUEST: "Sugerencia",
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  AGENT: "Agente",
  USER: "Usuario",
};

export const TICKET_STATUSES = Object.keys(STATUS_LABELS) as TicketStatus[];
export const TICKET_PRIORITIES = Object.keys(PRIORITY_LABELS) as TicketPriority[];
export const TICKET_CATEGORIES = Object.keys(CATEGORY_LABELS) as TicketCategory[];
export const ROLES = Object.keys(ROLE_LABELS) as Role[];

export const STATUS_STYLES: Record<TicketStatus, string> = {
  OPEN: "bg-sky-500/12 text-sky-700 border-sky-500/25 dark:text-sky-300",
  IN_PROGRESS:
    "bg-amber-500/12 text-amber-700 border-amber-500/25 dark:text-amber-300",
  RESOLVED:
    "bg-emerald-500/12 text-emerald-700 border-emerald-500/25 dark:text-emerald-300",
  CLOSED: "bg-muted text-muted-foreground border-border",
};

export const STATUS_DOT: Record<TicketStatus, string> = {
  OPEN: "bg-sky-500",
  IN_PROGRESS: "bg-amber-500",
  RESOLVED: "bg-emerald-500",
  CLOSED: "bg-zinc-400",
};

export const PRIORITY_STYLES: Record<TicketPriority, string> = {
  LOW: "bg-muted text-muted-foreground border-border",
  MEDIUM: "bg-indigo-500/10 text-indigo-700 border-indigo-500/25 dark:text-indigo-300",
  HIGH: "bg-orange-500/12 text-orange-700 border-orange-500/25 dark:text-orange-300",
  URGENT: "bg-red-500/12 text-red-700 border-red-500/30 dark:text-red-300",
};

export const PRIORITY_BAR: Record<TicketPriority, string> = {
  LOW: "bg-zinc-400",
  MEDIUM: "bg-indigo-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

export const ROLE_STYLES: Record<Role, string> = {
  ADMIN: "bg-primary/12 text-primary border-primary/25",
  AGENT: "bg-teal-500/12 text-teal-700 border-teal-500/25 dark:text-teal-300",
  USER: "bg-muted text-muted-foreground border-border",
};

export const TICKETS_PAGE_SIZE = 10;
export const USERS_PAGE_SIZE = 10;
