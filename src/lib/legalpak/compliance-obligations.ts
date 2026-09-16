import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { addDaysISO, addMonthsISO, diffDaysISO, todayISO } from "@/lib/legal/date";
import { createId } from "./id";
import { requireCompanyAccess, requireObligationAccess, requireWorkspaceAccess } from "./access";
import { logAudit, type AuditLogRow } from "./audit";
import {
  COMPLIANCE_CATEGORIES,
  matchesApplicability,
  computeRuleDueDate,
  type ComplianceCategory,
  type ComplianceRule,
} from "./compliance-rules";
import type { Company } from "./types";

export const COMPLIANCE_OBLIGATION_STATUSES = ["upcoming", "due_soon", "overdue", "in_progress", "completed"] as const;
export type ComplianceObligationStatus = (typeof COMPLIANCE_OBLIGATION_STATUSES)[number];

export const COMPLIANCE_OBLIGATION_STATUS_LABEL: Record<ComplianceObligationStatus, string> = {
  upcoming: "Upcoming",
  due_soon: "Due soon",
  overdue: "Overdue",
  in_progress: "In progress",
  completed: "Completed",
};

export const COMPLIANCE_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type CompliancePriority = (typeof COMPLIANCE_PRIORITIES)[number];

export const COMPLIANCE_PRIORITY_LABEL: Record<CompliancePriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const OBLIGATION_RECURRENCE_OPTIONS = ["annual", "monthly", "quarterly"] as const;
export type ObligationRecurrence = (typeof OBLIGATION_RECURRENCE_OPTIONS)[number];

export type ComplianceObligation = {
  id: string;
  workspace_id: string;
  company_id: string;
  rule_id: string | null;
  title: string;
  description: string;
  category: ComplianceCategory;
  authority: string;
  due_date: string | null;
  status: ComplianceObligationStatus;
  priority: CompliancePriority;
  recurring: boolean;
  recurrence_rule: string | null;
  period_key: string | null;
  required_documents: string[];
  notes: string;
  completed_at: string | null;
  completed_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ComplianceObligationWithCompany = ComplianceObligation & { company_name: string };

const OBLIGATION_COLUMNS = `
  id, workspace_id, company_id, rule_id, title, description, category, authority,
  due_date::text as due_date, status, priority, recurring, recurrence_rule, period_key,
  required_documents, notes, completed_at::text as completed_at, completed_by,
  created_by, created_at::text as created_at, updated_at::text as updated_at
`;

// Same columns, qualified with the `o` alias — "id" and "workspace_id" both
// exist on `company` too, so the two queries below that join company must
// disambiguate or Postgres rejects the whole select as ambiguous.
const OBLIGATION_COLUMNS_O = `
  o.id, o.workspace_id, o.company_id, o.rule_id, o.title, o.description, o.category, o.authority,
  o.due_date::text as due_date, o.status, o.priority, o.recurring, o.recurrence_rule, o.period_key,
  o.required_documents, o.notes, o.completed_at::text as completed_at, o.completed_by,
  o.created_by, o.created_at::text as created_at, o.updated_at::text as updated_at
`;

/**
 * The status actually shown in the UI: `in_progress` and `completed` are
 * sticky (only a human action changes them), while the three date-derived
 * buckets (`upcoming`/`due_soon`/`overdue`) are recomputed from `due_date`
 * against today every time — so "overdue" is always auto-detected even
 * though the stored column doesn't tick over on its own. Mirrors
 * computeComplianceHealth in compliance.ts for the matter-linked items.
 */
export function computeObligationEffectiveStatus(
  status: ComplianceObligationStatus,
  dueDate: string | null,
): ComplianceObligationStatus {
  if (status === "completed" || status === "in_progress") return status;
  if (!dueDate) return "upcoming";
  const today = todayISO();
  if (dueDate < today) return "overdue";
  const soonCutoff = addDaysISO(today, 7) ?? today;
  if (dueDate <= soonCutoff) return "due_soon";
  return "upcoming";
}

/** True when this obligation has no computed due date yet and isn't done — the "Configuration required" case, never a fabricated date. */
export function isConfigurationRequired(o: Pick<ComplianceObligation, "due_date" | "status">): boolean {
  return o.due_date === null && o.status !== "completed";
}

export const listComplianceObligationsFn = createServerFn({ method: "GET" })
  .validator((workspaceId: string) => z.string().min(1).parse(workspaceId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: workspaceId }) => {
    await requireWorkspaceAccess(context.userId, workspaceId);
    const sql = await getSql();
    return sql.query<ComplianceObligationWithCompany>(
      `select ${OBLIGATION_COLUMNS_O}, c.name as company_name
       from compliance_obligation o
       join company c on c.id = o.company_id
       where o.workspace_id = $1
       order by (o.due_date is null), o.due_date asc, o.created_at desc`,
      [workspaceId],
    );
  });

export const getComplianceObligationFn = createServerFn({ method: "GET" })
  .validator((obligationId: string) => z.string().min(1).parse(obligationId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: obligationId }) => {
    await requireObligationAccess(context.userId, obligationId);
    const sql = await getSql();
    const rows = await sql.query<ComplianceObligationWithCompany>(
      `select ${OBLIGATION_COLUMNS_O}, c.name as company_name
       from compliance_obligation o
       join company c on c.id = o.company_id
       where o.id = $1`,
      [obligationId],
    );
    return rows[0];
  });

const createSchema = z.object({
  companyId: z.string().min(1),
  title: z.string().trim().min(1, "Give this obligation a title"),
  description: z.string().trim().optional(),
  category: z.enum(COMPLIANCE_CATEGORIES),
  authority: z.string().trim().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(COMPLIANCE_PRIORITIES).optional(),
  recurring: z.boolean().optional(),
  recurrenceRule: z.enum(OBLIGATION_RECURRENCE_OPTIONS).optional(),
  requiredDocuments: z.array(z.string()).optional(),
  notes: z.string().trim().optional(),
});
export type CreateComplianceObligationInput = z.infer<typeof createSchema>;

export const createComplianceObligationFn = createServerFn({ method: "POST" })
  .validator((input: CreateComplianceObligationInput) => createSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const company = await requireCompanyAccess(context.userId, input.companyId);
    const sql = await getSql();
    const id = createId("cobl");
    const rows = await sql.query<ComplianceObligation>(
      `insert into compliance_obligation (
        id, workspace_id, company_id, title, description, category, authority,
        due_date, priority, recurring, recurrence_rule, required_documents, notes, created_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14)
      returning ${OBLIGATION_COLUMNS}`,
      [
        id,
        company.workspace_id,
        input.companyId,
        input.title,
        input.description ?? "",
        input.category,
        input.authority ?? "",
        input.dueDate || null,
        input.priority ?? "medium",
        input.recurring ?? false,
        input.recurrenceRule ?? null,
        JSON.stringify(input.requiredDocuments ?? []),
        input.notes ?? "",
        context.userId,
      ],
    );
    const obligation = rows[0];
    logAudit({
      workspaceId: obligation.workspace_id,
      companyId: obligation.company_id,
      userId: context.userId,
      action: "OBLIGATION_CREATED",
      entityType: "compliance_obligation",
      entityId: obligation.id,
      metadata: { title: obligation.title, category: obligation.category },
    }).catch(() => {});
    return obligation;
  });

const updateSchema = z.object({
  obligationId: z.string().min(1),
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  category: z.enum(COMPLIANCE_CATEGORIES).optional(),
  authority: z.string().trim().optional(),
  priority: z.enum(COMPLIANCE_PRIORITIES).optional(),
  recurring: z.boolean().optional(),
  recurrenceRule: z.enum(OBLIGATION_RECURRENCE_OPTIONS).nullable().optional(),
  requiredDocuments: z.array(z.string()).optional(),
});
export type UpdateComplianceObligationInput = z.infer<typeof updateSchema>;

/** Edits the descriptive fields of an obligation — status and due_date have their own dedicated actions below so each gets its own audit label. */
export const updateComplianceObligationFn = createServerFn({ method: "POST" })
  .validator((input: UpdateComplianceObligationInput) => updateSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireObligationAccess(context.userId, input.obligationId);
    const sql = await getSql();
    const existingRows = await sql.query<ComplianceObligation>(
      `select ${OBLIGATION_COLUMNS} from compliance_obligation where id = $1`,
      [input.obligationId],
    );
    const existing = existingRows[0];
    if (!existing) throw new Error("Obligation not found");

    const rows = await sql.query<ComplianceObligation>(
      `update compliance_obligation set
        title = $2, description = $3, category = $4, authority = $5, priority = $6,
        recurring = $7, recurrence_rule = $8, required_documents = $9::jsonb, updated_at = now()
      where id = $1
      returning ${OBLIGATION_COLUMNS}`,
      [
        input.obligationId,
        input.title ?? existing.title,
        input.description ?? existing.description,
        input.category ?? existing.category,
        input.authority ?? existing.authority,
        input.priority ?? existing.priority,
        input.recurring ?? existing.recurring,
        input.recurrenceRule !== undefined ? input.recurrenceRule : existing.recurrence_rule,
        JSON.stringify(input.requiredDocuments ?? existing.required_documents),
      ],
    );
    const obligation = rows[0];
    logAudit({
      workspaceId: obligation.workspace_id,
      companyId: obligation.company_id,
      userId: context.userId,
      action: "OBLIGATION_UPDATED",
      entityType: "compliance_obligation",
      entityId: obligation.id,
    }).catch(() => {});
    return obligation;
  });

const deadlineSchema = z.object({ obligationId: z.string().min(1), dueDate: z.string().min(1).nullable() });

export const changeObligationDeadlineFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof deadlineSchema>) => deadlineSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireObligationAccess(context.userId, input.obligationId);
    const sql = await getSql();
    const before = await sql.query<{ due_date: string | null }>(
      `select due_date::text as due_date from compliance_obligation where id = $1`,
      [input.obligationId],
    );
    const rows = await sql.query<ComplianceObligation>(
      `update compliance_obligation set due_date = $2, updated_at = now() where id = $1 returning ${OBLIGATION_COLUMNS}`,
      [input.obligationId, input.dueDate || null],
    );
    const obligation = rows[0];
    logAudit({
      workspaceId: obligation.workspace_id,
      companyId: obligation.company_id,
      userId: context.userId,
      action: "OBLIGATION_DEADLINE_CHANGED",
      entityType: "compliance_obligation",
      entityId: obligation.id,
      metadata: { from: before[0]?.due_date ?? null, to: obligation.due_date },
    }).catch(() => {});
    return obligation;
  });

const statusSchema = z.object({ obligationId: z.string().min(1), status: z.enum(COMPLIANCE_OBLIGATION_STATUSES) });

/** The generic status-change action behind Start / Mark Complete and any manual status edit. */
export const changeObligationStatusFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof statusSchema>) => statusSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireObligationAccess(context.userId, input.obligationId);
    const sql = await getSql();
    const beforeRows = await sql.query<ComplianceObligation>(
      `select ${OBLIGATION_COLUMNS} from compliance_obligation where id = $1`,
      [input.obligationId],
    );
    const before = beforeRows[0];
    if (!before) throw new Error("Obligation not found");

    const completing = input.status === "completed";
    const rows = await sql.query<ComplianceObligation>(
      `update compliance_obligation set
        status = $2,
        completed_at = case when $3 then now() else null end,
        completed_by = case when $3 then $4 else null end,
        updated_at = now()
      where id = $1
      returning ${OBLIGATION_COLUMNS}`,
      [input.obligationId, input.status, completing, context.userId],
    );
    const obligation = rows[0];
    logAudit({
      workspaceId: obligation.workspace_id,
      companyId: obligation.company_id,
      userId: context.userId,
      action: completing ? "OBLIGATION_COMPLETED" : "OBLIGATION_STATUS_CHANGED",
      entityType: "compliance_obligation",
      entityId: obligation.id,
      metadata: { from: before.status, to: obligation.status },
    }).catch(() => {});

    if (completing && obligation.recurring && obligation.due_date && obligation.recurrence_rule) {
      await spawnNextOccurrence(obligation, context.userId);
    }
    return obligation;
  });

async function spawnNextOccurrence(completed: ComplianceObligation, userId: string): Promise<void> {
  if (!completed.due_date || !completed.recurrence_rule) return;
  const months = completed.recurrence_rule === "annual" ? 12 : completed.recurrence_rule === "quarterly" ? 3 : 1;
  const nextDue = addMonthsISO(completed.due_date, months);
  if (!nextDue) return;
  const sql = await getSql();
  const id = createId("cobl");
  await sql.query(
    `insert into compliance_obligation (
      id, workspace_id, company_id, rule_id, title, description, category, authority,
      due_date, priority, recurring, recurrence_rule, required_documents, created_by
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14)`,
    [
      id,
      completed.workspace_id,
      completed.company_id,
      completed.rule_id,
      completed.title,
      completed.description,
      completed.category,
      completed.authority,
      nextDue,
      completed.priority,
      true,
      completed.recurrence_rule,
      JSON.stringify(completed.required_documents),
      userId,
    ],
  );
  logAudit({
    workspaceId: completed.workspace_id,
    companyId: completed.company_id,
    userId,
    action: "OBLIGATION_CREATED",
    entityType: "compliance_obligation",
    entityId: id,
    metadata: { title: completed.title, recurringFrom: completed.id },
  }).catch(() => {});
}

export type ComplianceObligationNote = {
  id: string;
  obligation_id: string;
  body: string;
  created_by: string;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
};

export const listObligationNotesFn = createServerFn({ method: "GET" })
  .validator((obligationId: string) => z.string().min(1).parse(obligationId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: obligationId }) => {
    await requireObligationAccess(context.userId, obligationId);
    const sql = await getSql();
    return sql.query<ComplianceObligationNote>(
      `select n.id, n.obligation_id, n.body, n.created_by, n.created_at::text as created_at,
              u.name as user_name, u.email as user_email
       from compliance_obligation_note n
       left join "user" u on u.id = n.created_by
       where n.obligation_id = $1
       order by n.created_at desc`,
      [obligationId],
    );
  });

const addNoteSchema = z.object({ obligationId: z.string().min(1), body: z.string().trim().min(1) });

export const addObligationNoteFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof addNoteSchema>) => addNoteSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const obligation = await requireObligationAccess(context.userId, input.obligationId);
    const sql = await getSql();
    const id = createId("coblnote");
    await sql.query(
      `insert into compliance_obligation_note (id, obligation_id, workspace_id, body, created_by) values ($1,$2,$3,$4,$5)`,
      [id, input.obligationId, obligation.workspace_id, input.body, context.userId],
    );
    logAudit({
      workspaceId: obligation.workspace_id,
      companyId: obligation.company_id,
      userId: context.userId,
      action: "OBLIGATION_NOTE_ADDED",
      entityType: "compliance_obligation",
      entityId: obligation.id,
    }).catch(() => {});
    return null;
  });

export const deleteObligationNoteFn = createServerFn({ method: "POST" })
  .validator((noteId: string) => z.string().min(1).parse(noteId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: noteId }) => {
    const sql = await getSql();
    const rows = await sql.query<{ obligation_id: string }>(
      `select obligation_id from compliance_obligation_note where id = $1`,
      [noteId],
    );
    const row = rows[0];
    if (!row) return null;
    await requireObligationAccess(context.userId, row.obligation_id);
    await sql.query(`delete from compliance_obligation_note where id = $1`, [noteId]);
    return null;
  });

export const listObligationActivityFn = createServerFn({ method: "GET" })
  .validator((obligationId: string) => z.string().min(1).parse(obligationId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: obligationId }) => {
    await requireObligationAccess(context.userId, obligationId);
    const sql = await getSql();
    return sql.query<AuditLogRow>(
      `select a.id, a.action, a.entity_type, a.metadata, a.created_at::text as created_at,
              u.name as user_name, u.email as user_email
       from audit_log a
       left join "user" u on u.id = a.user_id
       where a.entity_type = 'compliance_obligation' and a.entity_id = $1
       order by a.created_at desc`,
      [obligationId],
    );
  });

const FULL_COMPANY_COLUMNS = `
  id, workspace_id, name, cuin, ntn, company_type,
  paid_up_capital, turnover, employees,
  incorporation_date::text as incorporation_date,
  financial_year_end::text as financial_year_end,
  agm_date::text as agm_date,
  public_linked, has_subsidiary, status,
  registered_address, business_activity, province, city,
  archived_at::text as archived_at
`;

/** Evaluates every active compliance_rule against one company and inserts any obligation that's missing for the current period. Returns how many were created. Archived companies are skipped — no new obligations for a company that's no longer active. */
async function evaluateForCompany(companyId: string, userId: string): Promise<number> {
  const sql = await getSql();
  const companyRows = await sql.query<Company>(`select ${FULL_COMPANY_COLUMNS} from company where id = $1`, [companyId]);
  const company = companyRows[0];
  if (!company || company.status === "archived") return 0;

  const rules = await sql.query<ComplianceRule>(
    `select id, name, authority, category, applicability_conditions, recurrence,
            deadline_logic, deadline_ready, required_documents, active
     from compliance_rule where active = true`,
  );

  const today = todayISO();
  let created = 0;
  for (const rule of rules) {
    if (!matchesApplicability(rule.applicability_conditions, company)) continue;

    let dueDate: string | null = null;
    let periodKey: string | null = null;
    if (rule.deadline_ready && rule.recurrence) {
      const computed = computeRuleDueDate(rule.recurrence, company, today);
      dueDate = computed.dueDate;
      periodKey = computed.periodKey;
    }

    const existing = periodKey
      ? await sql.query(
          `select id from compliance_obligation where company_id = $1 and rule_id = $2 and period_key = $3`,
          [companyId, rule.id, periodKey],
        )
      : await sql.query(
          `select id from compliance_obligation where company_id = $1 and rule_id = $2 and period_key is null and status != 'completed'`,
          [companyId, rule.id],
        );
    if (existing[0]) continue;

    const id = createId("cobl");
    await sql.query(
      `insert into compliance_obligation (
        id, workspace_id, company_id, rule_id, title, description, category, authority,
        due_date, recurring, recurrence_rule, period_key, required_documents, created_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14)`,
      [
        id,
        company.workspace_id,
        companyId,
        rule.id,
        rule.name,
        rule.deadline_logic,
        rule.category,
        rule.authority,
        dueDate,
        rule.recurrence ? rule.recurrence.frequency !== "once" : false,
        rule.recurrence && rule.recurrence.frequency !== "once" ? rule.recurrence.frequency : null,
        periodKey,
        JSON.stringify(rule.required_documents),
        userId,
      ],
    );
    created += 1;
    logAudit({
      workspaceId: company.workspace_id,
      companyId,
      userId,
      action: "OBLIGATION_CREATED",
      entityType: "compliance_obligation",
      entityId: id,
      metadata: { title: rule.name, fromRule: rule.id },
    }).catch(() => {});
  }
  return created;
}

export const evaluateRulesForCompanyFn = createServerFn({ method: "POST" })
  .validator((companyId: string) => z.string().min(1).parse(companyId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: companyId }) => {
    await requireCompanyAccess(context.userId, companyId);
    const created = await evaluateForCompany(companyId, context.userId);
    return { created };
  });

export const evaluateRulesForWorkspaceFn = createServerFn({ method: "POST" })
  .validator((workspaceId: string) => z.string().min(1).parse(workspaceId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: workspaceId }) => {
    await requireWorkspaceAccess(context.userId, workspaceId);
    const sql = await getSql();
    const companies = await sql.query<{ id: string }>(`select id from company where workspace_id = $1`, [workspaceId]);
    let created = 0;
    for (const c of companies) {
      created += await evaluateForCompany(c.id, context.userId);
    }
    return { created };
  });

export { diffDaysISO };
