// Las fechas se formatean en el servidor; se fija la zona horaria para que el
// resultado no dependa de dónde corre el proceso.
const TIME_ZONE = "America/Lima";

const dateTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeZone: TIME_ZONE,
});

const relativeFormatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

export function formatDateTime(date: Date) {
  return dateTimeFormatter.format(date);
}

export function formatDate(date: Date) {
  return dateFormatter.format(date);
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

export function formatRelative(date: Date, now: Date = new Date()) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return relativeFormatter.format(Math.round(seconds / size), unit);
    }
  }
  return "hace un momento";
}

export function formatTicketNumber(number: number) {
  return `#${number}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
