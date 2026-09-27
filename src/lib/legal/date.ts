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

/**
 * Adds calendar months to a one-time date (an incorporation date, a joining date, a fixed offset
 * from either): the same day-of-month N months later, clamped to the target month's last day only
 * when it's too short to have that day at all. Deliberately NOT "sticky" to month-end — whether a
 * date like Feb 28 was chosen because it's the 28th or because it's Feb's last day is genuinely
 * ambiguous from the value alone, and guessing "always month-end" moves one-time deadlines later
 * than intended (Feb 28 + 3 months becoming May 31 instead of May 28) and lets a manually chosen
 * recurring day silently turn into a different, month-end-anchored one after a single short-month
 * clamp. A rule-generated recurring obligation, which must never drift or land on the wrong day at
 * all, does not use this for its next due date — see spawnNextOccurrence's own comment.
 */
export function addMonthsISO(iso: string, months: number): string | null {
  const d = parseISO(iso);
  if (!d) return null;
  const day = d.getUTCDate();
  // Move to the 1st before shifting months so setUTCMonth can't overflow into a later month by
  // landing on a day the target month doesn't have (e.g. Jan 31 -> "Feb 31", which JS normalizes
  // to Mar 2/3) — then clamp back to the target month's last day if it's shorter than the original.
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const daysInTargetMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, daysInTargetMonth));
  return toISO(d);
}

export function isAfterISO(a: string, b: string): boolean {
  const da = parseISO(a);
  const db = parseISO(b);
  if (!da || !db) return false;
  return da.getTime() > db.getTime();
}

/** Today's date as a UTC calendar-date string. */
export function todayISO(): string {
  return toISO(new Date());
}

/**
 * Today's date on the user's own clock. `todayISO()` above is the UTC date, which
 * for Pakistan (UTC+5) is still "yesterday" until 5 am — fine for deadline math,
 * wrong for a date the user is about to sign or record as "today". Browser-side use only.
 */
export function localTodayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whole days from `a` to `b` (negative when `a` is after `b`), e.g. days remaining until a deadline. */
export function diffDaysISO(a: string, b: string): number | null {
  const da = parseISO(a);
  const db = parseISO(b);
  if (!da || !db) return null;
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
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
