import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { addDaysISO } from "@/lib/legal/date";
import { createId } from "./id";
import { requireAdmin } from "./admin";
import type { Company } from "./types";

/**
 * The Compliance Rule engine: structured, DB-backed configuration for "what
 * compliance obligations apply to a company, and when are they due" — the
 * extensible alternative to hard-coding deadlines in TypeScript. A rule only
 * ever auto-generates an obligation with a real due date once a human has
 * set both `active` and `deadline_ready` to true; until then it either
 * doesn't fire at all (active = false) or fires with due_date = null,
 * surfaced in the UI as "Configuration required" — see
 * evaluateRulesForCompanyFn in compliance-obligations.ts. Nothing here
 * invents a Pakistani statutory deadline; it only computes dates from rules
 * a human has explicitly marked verified.
 */

export const COMPLIANCE_CATEGORIES = [
  "secp",
  "tax",
  "corporate",
  "employment",
  "contract",
  "licensing",
  "other",
] as const;
export type ComplianceCategory = (typeof COMPLIANCE_CATEGORIES)[number];

export const COMPLIANCE_CATEGORY_LABEL: Record<ComplianceCategory, string> = {
  secp: "SECP",
  tax: "Tax",
  corporate: "Corporate",
  employment: "Employment",
  contract: "Contract",
  licensing: "Licensing",
  other: "Other",
};

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

export type ComplianceRule = {
  id: string;
  name: string;
  authority: string;
  category: ComplianceCategory;
  applicability_conditions: ApplicabilityConditions;
  recurrence: RecurrenceConfig | null;
  deadline_logic: string;
  deadline_ready: boolean;
  required_documents: string[];
  active: boolean;
  source_reference: string;
  source_verified_on: string | null;
  created_at: string;
  updated_at: string;
};

const RULE_COLUMNS = `
  id, name, authority, category, applicability_conditions, recurrence,
  deadline_logic, deadline_ready, required_documents, active,
  source_reference, source_verified_on::text as source_verified_on,
  created_at::text as created_at, updated_at::text as updated_at
`;

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
      const due = addDaysISO(anchorDate, recurrence.offsetDays ?? 0);
      return { dueDate: due, periodKey: due ? due.slice(0, 4) : null };
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

export const listComplianceRulesFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const sql = await getSql();
    return sql.query<ComplianceRule>(`select ${RULE_COLUMNS} from compliance_rule order by created_at desc`);
  });

const applicabilitySchema = z
  .object({
    companyType: z.array(z.string()).optional(),
    publicLinked: z.boolean().optional(),
    hasSubsidiary: z.boolean().optional(),
    minEmployees: z.number().optional(),
    minPaidUpCapital: z.number().optional(),
    minTurnover: z.number().optional(),
  })
  .strict();

const recurrenceSchema = z
  .object({
    frequency: z.enum(["annual", "monthly", "quarterly", "once"]),
    anchor: z.enum(["financial_year_end", "incorporation_date", "agm_date", "period_end"]).optional(),
    offsetDays: z.number().int().optional(),
    fixedMonth: z.number().int().min(1).max(12).optional(),
    fixedDay: z.number().int().min(1).max(31).optional(),
  })
  .strict();

const ruleInputSchema = z.object({
  name: z.string().trim().min(1, "Give this rule a name"),
  authority: z.string().trim().min(1, "Which authority requires this?"),
  category: z.enum(COMPLIANCE_CATEGORIES),
  applicabilityConditions: applicabilitySchema.optional(),
  recurrence: recurrenceSchema.optional(),
  deadlineLogic: z.string().trim().optional(),
  deadlineReady: z.boolean().optional(),
  requiredDocuments: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  sourceReference: z.string().trim().optional(),
  sourceVerifiedOn: z.string().optional(),
});
export type ComplianceRuleInput = z.infer<typeof ruleInputSchema>;

export const createComplianceRuleFn = createServerFn({ method: "POST" })
  .validator((input: ComplianceRuleInput) => ruleInputSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const id = createId("crule");
    const rows = await sql.query<ComplianceRule>(
      `insert into compliance_rule (
        id, name, authority, category, applicability_conditions, recurrence,
        deadline_logic, deadline_ready, required_documents, active,
        source_reference, source_verified_on, created_by
      ) values ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9::jsonb,$10,$11,$12,$13)
      returning ${RULE_COLUMNS}`,
      [
        id,
        input.name,
        input.authority,
        input.category,
        JSON.stringify(input.applicabilityConditions ?? {}),
        input.recurrence ? JSON.stringify(input.recurrence) : null,
        input.deadlineLogic ?? "",
        input.deadlineReady ?? false,
        JSON.stringify(input.requiredDocuments ?? []),
        input.active ?? false,
        input.sourceReference ?? "",
        input.sourceVerifiedOn || null,
        context.userId,
      ],
    );
    return rows[0];
  });

const updateRuleSchema = ruleInputSchema
  .partial()
  .extend({ ruleId: z.string().min(1), recurrence: recurrenceSchema.nullable().optional() });
export type UpdateComplianceRuleInput = z.infer<typeof updateRuleSchema>;

export const updateComplianceRuleFn = createServerFn({ method: "POST" })
  .validator((input: UpdateComplianceRuleInput) => updateRuleSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const existingRows = await sql.query<ComplianceRule>(`select ${RULE_COLUMNS} from compliance_rule where id = $1`, [
      input.ruleId,
    ]);
    const existing = existingRows[0];
    if (!existing) throw new Error("Rule not found");

    const next = {
      name: input.name ?? existing.name,
      authority: input.authority ?? existing.authority,
      category: input.category ?? existing.category,
      applicabilityConditions: input.applicabilityConditions ?? existing.applicability_conditions,
      recurrence: input.recurrence !== undefined ? input.recurrence : existing.recurrence,
      deadlineLogic: input.deadlineLogic ?? existing.deadline_logic,
      deadlineReady: input.deadlineReady ?? existing.deadline_ready,
      requiredDocuments: input.requiredDocuments ?? existing.required_documents,
      active: input.active ?? existing.active,
      sourceReference: input.sourceReference ?? existing.source_reference,
      sourceVerifiedOn: input.sourceVerifiedOn !== undefined ? input.sourceVerifiedOn || null : existing.source_verified_on,
    };

    const rows = await sql.query<ComplianceRule>(
      `update compliance_rule set
        name = $2, authority = $3, category = $4, applicability_conditions = $5::jsonb,
        recurrence = $6::jsonb, deadline_logic = $7, deadline_ready = $8, required_documents = $9::jsonb,
        active = $10, source_reference = $11, source_verified_on = $12, updated_at = now()
      where id = $1
      returning ${RULE_COLUMNS}`,
      [
        input.ruleId,
        next.name,
        next.authority,
        next.category,
        JSON.stringify(next.applicabilityConditions),
        next.recurrence ? JSON.stringify(next.recurrence) : null,
        next.deadlineLogic,
        next.deadlineReady,
        JSON.stringify(next.requiredDocuments),
        next.active,
        next.sourceReference,
        next.sourceVerifiedOn,
      ],
    );
    return rows[0];
  });

export const deleteComplianceRuleFn = createServerFn({ method: "POST" })
  .validator((ruleId: string) => z.string().min(1).parse(ruleId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: ruleId }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    await sql.query(`delete from compliance_rule where id = $1`, [ruleId]);
    return null;
  });
