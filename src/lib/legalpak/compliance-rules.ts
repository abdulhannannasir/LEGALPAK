import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { createId } from "./id";
import { requireAdmin } from "./admin";
import type { ApplicabilityConditions, RecurrenceConfig } from "./compliance-rule-logic";

// The applicability/recurrence types and the pure functions that use them (matchesApplicability,
// computeRuleDueDate) live in compliance-rule-logic.ts, which has no `@/`-aliased imports so it can
// be unit tested with the plain Node test runner — see compliance-rules.test.ts. Re-exported here
// so every existing import from "./compliance-rules" (or "@/lib/legalpak/compliance-rules") keeps
// working unchanged.
export {
  matchesApplicability,
  computeRuleDueDate,
  type ApplicabilityConditions,
  type RecurrenceFrequency,
  type RecurrenceAnchor,
  type RecurrenceConfig,
} from "./compliance-rule-logic";

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

/**
 * Every rule, to any signed-in user — deliberately NOT scoped by `context.userId`.
 * `compliance_rule` is global statutory configuration (no workspace or user
 * column; the same rules are evaluated against every company), so there is
 * no per-user data here to scope to, and scoping by user would show everyone
 * an empty list. The rules page lets any signed-in user *view* the configured
 * rules while only an admin can create, edit or delete them (requireAdmin on
 * every mutation below). Nothing tenant-specific is selected — `created_by`
 * is not in RULE_COLUMNS.
 */
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
