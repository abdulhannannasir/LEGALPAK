import { addDaysISO } from "../legal/date.ts";
import type { Company } from "./types";

/**
 * Pure recurrence/applicability logic for compliance rules, split out of compliance-rules.ts so
 * it has no `@/`-aliased imports and can be unit tested with the plain Node test runner (which,
 * unlike Vite, doesn't resolve that alias) — see compliance-rules.test.ts. Behavior only, no
 * server functions or DB access here; compliance-rules.ts re-exports everything below.
 */

export type ApplicabilityConditions = {
  companyType?: string[];
  publicLinked?: boolean;
  hasSubsidiary?: boolean;
  minEmployees?: number;
  minPaidUpCapital?: number;
  minTurnover?: number;
};

export type RecurrenceFrequency = "annual" | "monthly" | "quarterly" | "once";
export type RecurrenceAnchor = "financial_year_end" | "incorporation_date" | "agm_date" | "period_end";

export type RecurrenceConfig = {
  frequency: RecurrenceFrequency;
  /** A company date field (annual only) or "period_end" (monthly/quarterly — end of the current month/quarter). Omit for a fixed annual calendar date. */
  anchor?: RecurrenceAnchor;
  offsetDays?: number;
  /** Annual only, used when `anchor` is omitted: a fixed month/day each year. */
  fixedMonth?: number;
  fixedDay?: number;
};

/** Whether `company` satisfies every condition in `conditions` (AND-combined). An empty/missing condition set matches every company. */
export function matchesApplicability(conditions: ApplicabilityConditions, company: Company): boolean {
  if (conditions.companyType && conditions.companyType.length > 0) {
    if (!company.company_type || !conditions.companyType.includes(company.company_type)) return false;
  }
  if (conditions.publicLinked !== undefined && company.public_linked !== conditions.publicLinked) return false;
  if (conditions.hasSubsidiary !== undefined && company.has_subsidiary !== conditions.hasSubsidiary) return false;
  if (conditions.minEmployees !== undefined && (company.employees ?? 0) < conditions.minEmployees) return false;
  if (conditions.minPaidUpCapital !== undefined && Number(company.paid_up_capital ?? 0) < conditions.minPaidUpCapital)
    return false;
  if (conditions.minTurnover !== undefined && Number(company.turnover ?? 0) < conditions.minTurnover) return false;
  return true;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function periodEnd(frequency: "monthly" | "quarterly", referenceIso: string): string {
  const year = Number(referenceIso.slice(0, 4));
  const month = Number(referenceIso.slice(5, 7));
  const endMonth = frequency === "monthly" ? month : Math.ceil(month / 3) * 3;
  const lastDay = new Date(Date.UTC(year, endMonth, 0)).getUTCDate();
  return `${year}-${pad2(endMonth)}-${pad2(lastDay)}`;
}

const ANCHOR_FIELD: Record<Exclude<RecurrenceAnchor, "period_end">, keyof Company> = {
  financial_year_end: "financial_year_end",
  incorporation_date: "incorporation_date",
  agm_date: "agm_date",
};

/**
 * Computes the next due date and a dedup `periodKey` for a rule against one
 * company, as of `referenceIso` (normally today). Returns null values when
 * the recurrence can't be resolved (e.g. an annual rule anchored to an AGM
 * date the company hasn't recorded yet) — callers must not substitute a
 * guessed date.
 */
export function computeRuleDueDate(
  recurrence: RecurrenceConfig,
  company: Company,
  referenceIso: string,
): { dueDate: string | null; periodKey: string | null } {
  const year = Number(referenceIso.slice(0, 4));

  if (recurrence.frequency === "once") {
    if (recurrence.fixedMonth && recurrence.fixedDay) {
      return { dueDate: `${year}-${pad2(recurrence.fixedMonth)}-${pad2(recurrence.fixedDay)}`, periodKey: "once" };
    }
    return { dueDate: null, periodKey: null };
  }

  if (recurrence.frequency === "annual") {
    if (recurrence.anchor && recurrence.anchor !== "period_end") {
      const anchorDate = company[ANCHOR_FIELD[recurrence.anchor]] as string | null;
      if (!anchorDate) return { dueDate: null, periodKey: null };
      // The company only records one instance of this date (e.g. the financial year end it last
      // told us), but the obligation recurs every year on that same month/day — so re-anchor it to
      // the reference year instead of reusing whatever year happens to be stored. Otherwise this
      // permanently returns the original due date, and once that period has an obligation, no
      // later year's ever gets created.
      const thisCycleAnchor = `${year}-${anchorDate.slice(5, 10)}`;
      const due = addDaysISO(thisCycleAnchor, recurrence.offsetDays ?? 0);
      // periodKey identifies the CYCLE (this reference year), not the due date's own year — an
      // offset can push `due` into the year before or after `year` (a Dec 31 anchor with a 35-day
      // offset falls due in the NEXT calendar year; a negative offset on an early-month anchor
      // falls due in the PREVIOUS one). Keying off `due`'s year instead, as this used to, mislabels
      // which cycle the obligation belongs to: spawnNextOccurrence's periodEndExclusive then adds
      // one year to that wrong label, which either skips an entire cycle (positive offset) or keeps
      // recomputing the exact same due date forever (negative offset, silently blocked by the
      // unique index) — see compliance-rules.test.ts. Matches the fixedMonth/fixedDay branch
      // below, which already keys on `year` rather than the computed due date.
      return { dueDate: due, periodKey: due ? String(year) : null };
    }
    if (recurrence.fixedMonth && recurrence.fixedDay) {
      return { dueDate: `${year}-${pad2(recurrence.fixedMonth)}-${pad2(recurrence.fixedDay)}`, periodKey: String(year) };
    }
    return { dueDate: null, periodKey: null };
  }

  if (recurrence.frequency === "monthly" || recurrence.frequency === "quarterly") {
    const end = periodEnd(recurrence.frequency, referenceIso);
    const due = addDaysISO(end, recurrence.offsetDays ?? 0);
    const month = Number(referenceIso.slice(5, 7));
    const periodKey =
      recurrence.frequency === "monthly" ? referenceIso.slice(0, 7) : `${year}-Q${Math.ceil(month / 3)}`;
    return { dueDate: due, periodKey: due ? periodKey : null };
  }

  return { dueDate: null, periodKey: null };
}
