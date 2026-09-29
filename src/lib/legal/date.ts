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
 * Adds calendar months to `iso`, clamped to `anchorDay` (not necessarily `iso`'s own
 * day-of-month) if the target month is too short to have that day at all. Exported
 * separately from `addMonthsISO` below so a caller chaining this across a series of
 * dates can pass the SAME anchor day every time instead of `iso`'s own day, which may
 * already have been clamped down by a previous call — see `addMonthsISO`'s own comment
 * for why that distinction matters.
 */
export function addMonthsFromAnchorISO(iso: string, months: number, anchorDay: number): string | null {
  const d = parseISO(iso);
  if (!d) return null;
  // Move to the 1st before shifting months so setUTCMonth can't overflow into a later month by
  // landing on a day the target month doesn't have (e.g. Jan 31 -> "Feb 31", which JS normalizes
  // to Mar 2/3) — then clamp back to the target month's last day if it's shorter than anchorDay.
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const daysInTargetMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(anchorDay, daysInTargetMonth));
  return toISO(d);
}

/**
 * Adds calendar months to a one-time date (an incorporation date, a joining date, a fixed offset
 * from either): the same day-of-month N months later, clamped to the target month's last day only
 * when it's too short to have that day at all. Deliberately NOT "sticky" to month-end — whether a
 * date like Feb 28 was chosen because it's the 28th or because it's Feb's last day is genuinely
 * ambiguous from the value alone, and guessing "always month-end" moves one-time deadlines later
 * than intended (Feb 28 + 3 months becoming May 31 instead of May 28).
 *
 * Chaining this call-by-call across a *series* of dates (as opposed to a single one-time offset)
 * silently loses the original day-of-month the first time a short month clamps it — Jan 31 + 1mo
 * -> Feb 28, then Feb 28 + 1mo -> Mar 28 instead of Mar 31. A caller that needs to keep recurring
 * on the same day across a chain of dates must track that day separately and use
 * `addMonthsFromAnchorISO` instead — see spawnNextOccurrence in compliance-obligations.ts, which
 * does exactly that for manually-recurring obligations (rule-generated ones don't chain at all;
 * they recompute fresh from the rule each time, so this doesn't apply to them either).
 */
export function addMonthsISO(iso: string, months: number): string | null {
  const d = parseISO(iso);
  if (!d) return null;
  return addMonthsFromAnchorISO(iso, months, d.getUTCDate());
}

/** The day-of-month (1-31) of a calendar date string, or null if `iso` doesn't parse. */
export function dayOfMonthISO(iso: string): number | null {
  const d = parseISO(iso);
  return d ? d.getUTCDate() : null;
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
