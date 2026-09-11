/**
 * Every date in this app is a plain "YYYY-MM-DD" calendar date with no time
 * component — an AGM date, a financial year end, a filing deadline. Doing
 * arithmetic on those via `new Date(iso + "T00:00:00")` (local midnight) and
 * then `.toISOString()` (UTC) silently shifts the result by a day in any
 * timezone ahead of UTC — which includes Pakistan (UTC+5), this app's entire
 * audience. A statutory deadline computed one day early or late is exactly
 * the kind of mistake this tool exists to prevent, so all date math here is
 * done in UTC end-to-end: parse as UTC, add as UTC, format as UTC.
 */

function parseISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string | null {
  const d = parseISO(iso);
  if (!d) return null;
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

export function addMonthsISO(iso: string, months: number): string | null {
  const d = parseISO(iso);
  if (!d) return null;
  d.setUTCMonth(d.getUTCMonth() + months);
  return toISO(d);
}

export function isAfterISO(a: string, b: string): boolean {
  const da = parseISO(a);
  const db = parseISO(b);
  if (!da || !db) return false;
  return da.getTime() > db.getTime();
}

export function formatLong(iso: string): string {
  const d = parseISO(iso);
  if (!d) return iso || "____________";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function formatShort(iso: string): string {
  const d = parseISO(iso);
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
