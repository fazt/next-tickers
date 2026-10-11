import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type Params = Record<string, string | number | undefined>;

function buildHref(basePath: string, params: Params, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && key !== "page") search.set(key, String(value));
  }
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  basePath,
  params,
  page,
  pageCount,
  pageSize,
  total,
}: {
  basePath: string;
  params: Params;
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3 pt-4 text-sm">
      <p className="text-muted-foreground">
        Mostrando <span className="font-medium text-foreground">{from}–{to}</span> de{" "}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">
          Página {page} de {pageCount}
        </span>
        {page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={buildHref(basePath, params, page - 1)} rel="prev">
              <ChevronLeft /> Anterior
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft /> Anterior
          </Button>
        )}
        {page < pageCount ? (
          <Button asChild variant="outline" size="sm">
            <Link href={buildHref(basePath, params, page + 1)} rel="next">
              Siguiente <ChevronRight />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Siguiente <ChevronRight />
          </Button>
        )}
      </div>
    </nav>
  );
}
