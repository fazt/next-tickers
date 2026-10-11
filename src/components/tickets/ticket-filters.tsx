import { Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "@/lib/constants";
import type { TicketFilters as Filters } from "@/lib/validations";

// Formulario GET: los filtros viven en la URL y funcionan sin JavaScript.
export function TicketFilters({
  filters,
  staffMembers,
}: {
  filters: Filters;
  staffMembers?: { id: string; name: string }[];
}) {
  const hasFilters = Boolean(
    filters.q || filters.status || filters.priority || filters.category || filters.assignee || filters.sort !== "updated",
  );

  return (
    <form
      action="/dashboard/tickets"
      method="get"
      role="search"
      className="mb-4 grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_repeat(3,auto)] xl:grid-cols-[minmax(0,1fr)_repeat(5,auto)_auto]"
    >
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Buscar por título, descripción o #número"
          aria-label="Buscar tickets"
          className="pl-8"
        />
      </div>

      <NativeSelect name="status" defaultValue={filters.status ?? ""} aria-label="Estado" className="w-full">
        <NativeSelectOption value="">Todos los estados</NativeSelectOption>
        {TICKET_STATUSES.map((s) => (
          <NativeSelectOption key={s} value={s}>
            {STATUS_LABELS[s]}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      <NativeSelect name="priority" defaultValue={filters.priority ?? ""} aria-label="Prioridad" className="w-full">
        <NativeSelectOption value="">Todas las prioridades</NativeSelectOption>
        {TICKET_PRIORITIES.map((p) => (
          <NativeSelectOption key={p} value={p}>
            {PRIORITY_LABELS[p]}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      <NativeSelect name="category" defaultValue={filters.category ?? ""} aria-label="Categoría" className="w-full">
        <NativeSelectOption value="">Todas las categorías</NativeSelectOption>
        {TICKET_CATEGORIES.map((c) => (
          <NativeSelectOption key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      {staffMembers && (
        <NativeSelect name="assignee" defaultValue={filters.assignee ?? ""} aria-label="Responsable" className="w-full">
          <NativeSelectOption value="">Cualquier responsable</NativeSelectOption>
          <NativeSelectOption value="me">Asignados a mí</NativeSelectOption>
          <NativeSelectOption value="none">Sin asignar</NativeSelectOption>
          <NativeSelectOptGroup label="Equipo">
            {staffMembers.map((m) => (
              <NativeSelectOption key={m.id} value={m.id}>
                {m.name}
              </NativeSelectOption>
            ))}
          </NativeSelectOptGroup>
        </NativeSelect>
      )}

      <NativeSelect name="sort" defaultValue={filters.sort} aria-label="Orden" className="w-full">
        <NativeSelectOption value="updated">Actualizados recientemente</NativeSelectOption>
        <NativeSelectOption value="created">Más nuevos</NativeSelectOption>
        <NativeSelectOption value="priority">Mayor prioridad</NativeSelectOption>
      </NativeSelect>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Filtrar
        </Button>
        {hasFilters && (
          <Button asChild variant="ghost">
            <Link href="/dashboard/tickets">Limpiar</Link>
          </Button>
        )}
      </div>
    </form>
  );
}
