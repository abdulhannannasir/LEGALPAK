import { diffDaysISO, todayISO } from "./date.ts";

/**
 * The Compliance Health engine behind the company dashboard: one score, a
 * ranked "what to do next" list, and a per-category breakdown, all derived
 * from the unified compliance items (see compliance-unified.ts). Pure and
 * DB-free — it takes plain items plus "today" and returns plain data, so the
 * dashboard is a thin renderer and the arithmetic is unit-tested.
 *
 * Deliberately honest about what it doesn't know:
 *  - an item with no computed deadline ("Configuration required") is never
 *    scored — guessing would fabricate either a pass or a fail;
 *  - a standing requirement that hasn't been started as a matter is listed as
 *    "not tracked yet", never as a failure;
 *  - with nothing scoreable there is NO score (null), not a flattering 100.
 */

export type HealthItem = {
  id: string;
  kind: "matter" | "obligation";
  title: string;
  category: string;
  dueDate: string | null;
  status: "upcoming" | "due_soon" | "overdue" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  href: string;
  /** Matter-backed items only. */
  matterType?: string;
  matterStatus?: string;
};

/** What a single item's health is *today*, recomputed from its due date rather than trusting a stored status. */
export type ItemHealth = "overdue" | "due_soon" | "upcoming" | "completed" | "needs_setup";

/** Matches computeComplianceHealth / computeObligationEffectiveStatus: due within a week counts as "due soon". */
export const DUE_SOON_DAYS = 7;
/** A completed item only keeps counting toward the score for a year after its deadline, so old filings don't dilute this year's picture. */
export const COMPLETED_LOOKBACK_DAYS = 365;
/** Any overdue item keeps the score out of the "Good"/"Excellent" bands, however many other items are fine. */
export const OVERDUE_SCORE_CAP = 74;

export const PRIORITY_WEIGHT: Record<HealthItem["priority"], number> = { low: 1, medium: 2, high: 3, critical: 4 };

/** Share of an item's weight it earns: completed/on-track are fully healthy, due-soon is a medium penalty, overdue is the heavy one. */
export const HEALTH_CREDIT: Record<Exclude<ItemHealth, "needs_setup">, number> = {
  completed: 1,
  upcoming: 1,
  due_soon: 0.6,
  overdue: 0,
};

export type HealthBand = "excellent" | "good" | "attention" | "at_risk" | "not_scored";

export const HEALTH_BAND_LABEL: Record<HealthBand, string> = {
  excellent: "Excellent",
  good: "Good",
  attention: "Needs attention",
  at_risk: "At risk",
  not_scored: "Not scored yet",
};

export function bandForScore(score: number | null): HealthBand {
  if (score === null) return "not_scored";
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 50) return "attention";
  return "at_risk";
}

export type ScoredItem<T extends HealthItem = HealthItem> = {
  item: T;
  health: ItemHealth;
  /** Days from today to the deadline; negative when overdue; null when there's no deadline. */
  daysUntilDue: number | null;
  weight: number;
  /** Whether this item's credit went into the score. */
  counted: boolean;
};

export function classifyItem<T extends HealthItem>(item: T, today: string): ScoredItem<T> {
  const weight = PRIORITY_WEIGHT[item.priority] ?? PRIORITY_WEIGHT.medium;
  const days = item.dueDate ? diffDaysISO(today, item.dueDate) : null;

  if (item.status === "completed") {
    const withinLookback = days === null || days >= -COMPLETED_LOOKBACK_DAYS;
    return { item, health: "completed", daysUntilDue: days, weight, counted: withinLookback };
  }
  if (days === null) return { item, health: "needs_setup", daysUntilDue: null, weight, counted: false };
  const health: ItemHealth = days < 0 ? "overdue" : days <= DUE_SOON_DAYS ? "due_soon" : "upcoming";
  return { item, health, daysUntilDue: days, weight, counted: true };
}

export type HealthCounts = Record<ItemHealth, number>;

export type HealthSummary<T extends HealthItem = HealthItem> = {
  /** 0–100, or null when nothing has a deadline to score against. */
  score: number | null;
  band: HealthBand;
  /** True when the overdue cap pulled the score below what the weighted average alone gave. */
  capped: boolean;
  /** How many items fed the score. */
  scoredCount: number;
  counts: HealthCounts;
  items: ScoredItem<T>[];
};

export function summarizeCompliance<T extends HealthItem>(items: T[], today: string = todayISO()): HealthSummary<T> {
  const classified = items.map((i) => classifyItem(i, today));
  const counts: HealthCounts = { overdue: 0, due_soon: 0, upcoming: 0, completed: 0, needs_setup: 0 };
  let possible = 0;
  let earned = 0;
  let scoredCount = 0;
  for (const c of classified) {
    counts[c.health] += 1;
    if (!c.counted || c.health === "needs_setup") continue;
    scoredCount += 1;
    possible += c.weight;
    earned += c.weight * HEALTH_CREDIT[c.health];
  }
  const average = possible === 0 ? null : Math.round((100 * earned) / possible);
  const cap = counts.overdue > 0 ? OVERDUE_SCORE_CAP : 100;
  const score = average === null ? null : Math.min(average, cap);
  return {
    score,
    band: bandForScore(score),
    capped: average !== null && score !== null && score < average,
    scoredCount,
    counts,
    items: classified,
  };
}

/** Most pressing first: overdue → due soon → needs setup → upcoming → completed; then earliest deadline, then priority. */
const HEALTH_RANK: Record<ItemHealth, number> = { overdue: 0, due_soon: 1, needs_setup: 2, upcoming: 3, completed: 4 };

export function compareScored(a: ScoredItem, b: ScoredItem): number {
  const rank = HEALTH_RANK[a.health] - HEALTH_RANK[b.health];
  if (rank !== 0) return rank;
  if (a.item.dueDate !== b.item.dueDate) {
    if (!a.item.dueDate) return 1;
    if (!b.item.dueDate) return -1;
    return a.item.dueDate < b.item.dueDate ? -1 : 1;
  }
  const priority = PRIORITY_WEIGHT[b.item.priority] - PRIORITY_WEIGHT[a.item.priority];
  if (priority !== 0) return priority;
  return a.item.title.localeCompare(b.item.title);
}

export type CategoryBreakdown<T extends HealthItem = HealthItem> = {
  category: string;
  items: ScoredItem<T>[];
  counts: HealthCounts;
  /** Number of items in this category needing action now (overdue, due soon, or needing setup). */
  attention: number;
};

const CATEGORY_ORDER = ["secp", "tax", "corporate", "employment", "contract", "licensing", "other"];

/**
 * Groups items by category, most urgent items first within each. `alwaysInclude`
 * lets the caller keep SECP and Tax cards on screen even when they're empty
 * (so an empty card can say "nothing tracked yet" instead of vanishing).
 */
export function breakdownByCategory<T extends HealthItem>(
  scored: ScoredItem<T>[],
  alwaysInclude: string[] = [],
): CategoryBreakdown<T>[] {
  const byCategory = new Map<string, ScoredItem<T>[]>();
  for (const c of alwaysInclude) byCategory.set(c, []);
  for (const s of scored) {
    const list = byCategory.get(s.item.category) ?? [];
    list.push(s);
    byCategory.set(s.item.category, list);
  }
  const orderOf = (c: string) => {
    const i = CATEGORY_ORDER.indexOf(c);
    return i === -1 ? CATEGORY_ORDER.length : i;
  };
  return [...byCategory.entries()]
    .sort(([a], [b]) => orderOf(a) - orderOf(b) || a.localeCompare(b))
    .map(([category, list]) => {
      const sorted = [...list].sort(compareScored);
      const counts: HealthCounts = { overdue: 0, due_soon: 0, upcoming: 0, completed: 0, needs_setup: 0 };
      for (const s of sorted) counts[s.health] += 1;
      return { category, items: sorted, counts, attention: counts.overdue + counts.due_soon + counts.needs_setup };
    });
}

/**
 * Masonry-style layout: deals cards, in order, into `columnCount` columns,
 * always putting the next card in whichever column is currently shortest (ties
 * go to the leftmost). The first `columnCount` cards therefore land side by
 * side across the top, and later cards fill under the shorter column instead
 * of leaving a gap the way a plain grid row does. `weightOf` is an estimate of
 * the card's rendered height in any consistent unit.
 */
export function balanceColumns<T>(cards: T[], columnCount: number, weightOf: (card: T) => number): T[][] {
  const count = Math.max(1, Math.floor(columnCount));
  const columns: T[][] = Array.from({ length: count }, () => []);
  const heights: number[] = new Array(count).fill(0);
  for (const card of cards) {
    let shortest = 0;
    for (let i = 1; i < count; i++) if (heights[i] < heights[shortest]) shortest = i;
    columns[shortest].push(card);
    heights[shortest] += weightOf(card);
  }
  return columns;
}

/**
 * The recurring statutory filings a company is expected to track as a matter.
 * Form 9 is deliberately absent — it's filed when officers change, not on a
 * schedule, so "no Form 9 matter" is not a gap.
 */
export const STANDING_REQUIREMENTS = [
  { matterType: "FINANCIAL_STATEMENTS", category: "secp", label: "Financial statements", short: "financial statements" },
  { matterType: "FORM_A", category: "secp", label: "Form A / annual return", short: "Form A" },
  { matterType: "INCOME_TAX_RETURN", category: "tax", label: "Income tax return", short: "income tax return" },
] as const;

export type StandingRequirement = (typeof STANDING_REQUIREMENTS)[number];

/** Standing requirements with no matter of that type on file at all (a filed/closed matter still counts as tracked). */
export function findUntrackedRequirements(items: HealthItem[]): StandingRequirement[] {
  const tracked = new Set(items.filter((i) => i.kind === "matter" && i.matterType).map((i) => i.matterType));
  return STANDING_REQUIREMENTS.filter((r) => !tracked.has(r.matterType));
}

const MATTER_SHORT_NAME: Record<string, string> = {
  FINANCIAL_STATEMENTS: "financial statements",
  FORM_A: "Form A",
  FORM_9: "Form 9",
  INCOME_TAX_RETURN: "income tax return",
};

export type NextAction = {
  key: string;
  health: ItemHealth | "untracked";
  title: string;
  /** e.g. "Due in 11 days", "3 days overdue". */
  detail: string;
  cta: string;
  /** Existing item to open — its page pre-fills from the company profile. */
  href?: string;
  /** No matter exists yet: the UI creates one for this company, then opens it. */
  startMatterType?: string;
  category: string;
};

export function describeDue(days: number | null): string {
  if (days === null) return "No deadline set yet";
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

/** Matter titles are created as "<Type> — <Company>"; on a single-company screen the suffix is noise. */
export function stripCompanySuffix(title: string, companyName: string): string {
  const suffix = ` — ${companyName}`;
  return companyName && title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}

function ctaFor(s: ScoredItem): string {
  const { item } = s;
  if (s.health === "needs_setup") return "Review requirements";
  if (item.kind === "obligation") return item.status === "in_progress" ? "Continue" : "Open obligation";
  const name = (item.matterType && MATTER_SHORT_NAME[item.matterType]) || "filing";
  if (item.matterStatus === "review") return `Review ${name}`;
  if (item.matterStatus === "approved" || item.matterStatus === "signed") return `File ${name}`;
  return `Continue ${name}`;
}

/**
 * The next few things worth doing, most pressing first: overdue, due soon,
 * deadlines still to be configured, upcoming, and finally standing filings
 * nobody has started tracking. Completed items never appear.
 */
export function buildNextActions(
  scored: ScoredItem[],
  untracked: StandingRequirement[],
  companyName: string,
  limit = 3,
): NextAction[] {
  const open = scored.filter((s) => s.health !== "completed").sort(compareScored);
  const actions: NextAction[] = open.map((s) => ({
    key: `${s.item.kind}:${s.item.id}`,
    health: s.health,
    title: stripCompanySuffix(s.item.title, companyName),
    detail: s.health === "needs_setup" ? "No deadline yet — details needed" : describeDue(s.daysUntilDue),
    cta: ctaFor(s),
    href: s.item.href,
    category: s.item.category,
  }));

  // A standing filing nobody has started tracking has no deadline to rank by, so it only fills whatever room is left.
  const gaps: NextAction[] = untracked.map((r) => ({
    key: `untracked:${r.matterType}`,
    health: "untracked",
    title: r.label,
    detail: "Not tracked yet",
    cta: `Start ${r.short}`,
    startMatterType: r.matterType,
    category: r.category,
  }));
  return [...actions, ...gaps].slice(0, limit);
}
