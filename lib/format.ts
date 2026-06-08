export function formatPct(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatPp(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)} pp`;
}

export function formatVotes(value: number): string {
  return new Intl.NumberFormat("es-PE").format(Math.round(value));
}

const MONTHS_ES = [
  "ene.",
  "feb.",
  "mar.",
  "abr.",
  "may.",
  "jun.",
  "jul.",
  "ago.",
  "set.",
  "oct.",
  "nov.",
  "dic.",
] as const;

function getLimaDateParts(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);

  const partMap = new Map(parts.map((part) => [part.type, part.value]));
  const day = Number(partMap.get("day"));
  const month = Number(partMap.get("month"));
  const year = partMap.get("year");
  const hour = Number(partMap.get("hour"));
  const minute = partMap.get("minute");

  if (!day || !month || !year || Number.isNaN(hour) || !minute) return null;

  return { day, month, year, hour, minute };
}

export function formatDateTime(iso: string): string {
  const parts = getLimaDateParts(iso);
  if (!parts) return iso;

  const hour12 = parts.hour % 12 || 12;
  const period = parts.hour < 12 ? "a. m." : "p. m.";

  return `${parts.day} ${MONTHS_ES[parts.month - 1]} ${parts.year}, ${hour12}:${parts.minute} ${period}`;
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `hace ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `hace ${hours}h`;
}
