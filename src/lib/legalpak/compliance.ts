import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { addDaysISO, diffDaysISO, todayISO } from "@/lib/legal/date";
import { createId } from "./id";
import { requireMatterAccess, requireWorkspaceAccess } from "./access";
import { logAudit } from "./audit";
import type { MatterStatus, MatterType } from "./workflow";
import { COMPLIANCE_REQUIREMENTS, type ComplianceAuthority } from "./compliance-requirements";
import { LEGAL_SOURCES, type LegalSource, type LegalSourceKey } from "./legal-sources";
import type { Matter } from "./types";

export { isComplianceMatterType } from "./compliance-requirements";

const MATTER_COLUMNS = `
  m.id, m.workspace_id, m.company_id, m.type, m.title, m.status,
  m.due_date::text as due_date,
  m.created_at::text as created_at,
  m.updated_at::text as updated_at
`;

export type ComplianceItem = Matter & { company_name: string };

export type ComplianceHealth = "overdue" | "due_soon" | "upcoming" | "unscheduled" | "completed";

export const COMPLIANCE_HEALTH_LABEL: Record<ComplianceHealth, string> = {
  overdue: "Overdue",
  due_soon: "Due soon",
  upcoming: "Upcoming",
  unscheduled: "Verification required",
  completed: "Completed",
};

/** A matter counts as done for compliance purposes once it's been filed. */
export function computeComplianceHealth(status: MatterStatus, dueDate: string | null): ComplianceHealth {
  if (status === "filed" || status === "closed") return "completed";
  if (!dueDate) return "unscheduled";
  const today = todayISO();
  if (dueDate < today) return "overdue";
  const soonCutoff = addDaysISO(today, 7) ?? today;
  if (dueDate <= soonCutoff) return "due_soon";
  return "upcoming";
}

export type DerivedCompliance = {
  authority: ComplianceAuthority;
  requirement: string;
  health: ComplianceHealth;
  /** due_date minus today, in whole days; negative when overdue; null when there's no due date yet. */
  daysRemaining: number | null;
  source: LegalSource;
  sourceKey: LegalSourceKey;
};

/**
 * Everything a view needs to render one compliance item, derived purely from
 * the matter row and the COMPLIANCE_REQUIREMENTS / LEGAL_SOURCES registries —
 * no extra DB round trip, and no statutory rule invented here. Returns null
 * for a matter type that isn't tracked as a compliance requirement (e.g.
 * CONTRACT) — callers should filter those out upstream.
 */
export function deriveCompliance(
  item: Pick<ComplianceItem, "type" | "status" | "due_date" | "title">,
): DerivedCompliance | null {
  const def = COMPLIANCE_REQUIREMENTS[item.type as MatterType];
  if (!def) return null;
  return {
    authority: def.authority,
    requirement: item.title || def.defaultRequirement,
    health: computeComplianceHealth(item.status, item.due_date),
    daysRemaining: item.due_date ? diffDaysISO(todayISO(), item.due_date) : null,
    source: LEGAL_SOURCES[def.sourceKey],
    sourceKey: def.sourceKey,
  };
}

/** Every compliance-tracked matter (i.e. not CONTRACT) across the workspace. */
export const listComplianceItemsFn = createServerFn({ method: "GET" })
  .validator((workspaceId: string) => z.string().min(1).parse(workspaceId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: workspaceId }) => {
    await requireWorkspaceAccess(context.userId, workspaceId);
    const sql = await getSql();
    return sql.query<ComplianceItem>(
      `select ${MATTER_COLUMNS}, c.name as company_name
       from matter m
       join company c on c.id = m.company_id
       where m.workspace_id = $1 and m.type != 'CONTRACT'
       order by (m.due_date is null), m.due_date asc, m.created_at desc`,
      [workspaceId],
    );
  });

/**
 * Quick-action completion for a compliance item: jumps straight to `filed`
 * regardless of the current step, instead of walking the generic
 * draft→review→approved→signed→filed chain one status at a time
 * (canTransition in workflow.ts) — most SECP/FBR filings are done in one
 * shot from whatever stage they were left in. The matter detail page's own
 * status stepper still uses the strict chain for matters that do want it.
 */
export const markComplianceCompleteFn = createServerFn({ method: "POST" })
  .validator((matterId: string) => z.string().min(1).parse(matterId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: matterId }) => {
    const current = await requireMatterAccess(context.userId, matterId);
    if (current.status === "filed" || current.status === "closed") {
      throw new Error("Already marked complete");
    }
    const sql = await getSql();
    const rows = await sql.query<Matter>(
      `update matter as m set status = 'filed', updated_at = now() where m.id = $1 returning ${MATTER_COLUMNS}`,
      [matterId],
    );
    const matter = rows[0];
    logAudit({
      workspaceId: matter.workspace_id,
      companyId: matter.company_id,
      matterId: matter.id,
      userId: context.userId,
      action: "MATTER_MARKED_COMPLETE",
      entityType: "matter",
      entityId: matter.id,
      metadata: { from: current.status },
    }).catch(() => {});
    return matter;
  });

/** Reopens a completed (filed) compliance item back to review. `closed` matters are archival and stay closed. */
export const reopenComplianceItemFn = createServerFn({ method: "POST" })
  .validator((matterId: string) => z.string().min(1).parse(matterId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: matterId }) => {
    const current = await requireMatterAccess(context.userId, matterId);
    if (current.status !== "filed") {
      throw new Error("Only a completed item that hasn't been closed can be reopened");
    }
    const sql = await getSql();
    const rows = await sql.query<Matter>(
      `update matter as m set status = 'review', updated_at = now() where m.id = $1 returning ${MATTER_COLUMNS}`,
      [matterId],
    );
    const matter = rows[0];
    logAudit({
      workspaceId: matter.workspace_id,
      companyId: matter.company_id,
      matterId: matter.id,
      userId: context.userId,
      action: "MATTER_REOPENED",
      entityType: "matter",
      entityId: matter.id,
    }).catch(() => {});
    return matter;
  });

export type ComplianceNote = {
  id: string;
  matter_id: string;
  body: string;
  created_by: string;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
};

export const listComplianceNotesFn = createServerFn({ method: "GET" })
  .validator((matterId: string) => z.string().min(1).parse(matterId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: matterId }) => {
    await requireMatterAccess(context.userId, matterId);
    const sql = await getSql();
    return sql.query<ComplianceNote>(
      `select n.id, n.matter_id, n.body, n.created_by, n.created_at::text as created_at,
              u.name as user_name, u.email as user_email
       from compliance_note n
       left join "user" u on u.id = n.created_by
       where n.matter_id = $1
       order by n.created_at desc`,
      [matterId],
    );
  });

const addNoteSchema = z.object({ matterId: z.string().min(1), body: z.string().trim().min(1) });

export const addComplianceNoteFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof addNoteSchema>) => addNoteSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const matter = await requireMatterAccess(context.userId, input.matterId);
    const sql = await getSql();
    const id = createId("cnote");
    await sql.query(
      `insert into compliance_note (id, matter_id, workspace_id, body, created_by) values ($1,$2,$3,$4,$5)`,
      [id, input.matterId, matter.workspace_id, input.body, context.userId],
    );
    logAudit({
      workspaceId: matter.workspace_id,
      companyId: matter.company_id,
      matterId: matter.id,
      userId: context.userId,
      action: "COMPLIANCE_NOTE_ADDED",
      entityType: "compliance_note",
      entityId: id,
    }).catch(() => {});
    return null;
  });

export const deleteComplianceNoteFn = createServerFn({ method: "POST" })
  .validator((noteId: string) => z.string().min(1).parse(noteId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: noteId }) => {
    const sql = await getSql();
    const rows = await sql.query<{ matter_id: string }>(
      `select matter_id from compliance_note where id = $1`,
      [noteId],
    );
    const row = rows[0];
    if (!row) return null;
    await requireMatterAccess(context.userId, row.matter_id);
    await sql.query(`delete from compliance_note where id = $1`, [noteId]);
    return null;
  });

export type ComplianceReminder = {
  id: string;
  matter_id: string;
  remind_on: string;
  note: string | null;
  created_by: string;
  created_at: string;
};

export const listComplianceRemindersFn = createServerFn({ method: "GET" })
  .validator((matterId: string) => z.string().min(1).parse(matterId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: matterId }) => {
    await requireMatterAccess(context.userId, matterId);
    const sql = await getSql();
    return sql.query<ComplianceReminder>(
      `select id, matter_id, remind_on::text as remind_on, note, created_by, created_at::text as created_at
       from compliance_reminder where matter_id = $1 order by remind_on asc`,
      [matterId],
    );
  });

const addReminderSchema = z.object({
  matterId: z.string().min(1),
  remindOn: z.string().min(1),
  note: z.string().trim().optional(),
});

export const addComplianceReminderFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof addReminderSchema>) => addReminderSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const matter = await requireMatterAccess(context.userId, input.matterId);
    const sql = await getSql();
    const id = createId("crem");
    await sql.query(
      `insert into compliance_reminder (id, matter_id, workspace_id, remind_on, note, created_by) values ($1,$2,$3,$4,$5,$6)`,
      [id, input.matterId, matter.workspace_id, input.remindOn, input.note || null, context.userId],
    );
    logAudit({
      workspaceId: matter.workspace_id,
      companyId: matter.company_id,
      matterId: matter.id,
      userId: context.userId,
      action: "COMPLIANCE_REMINDER_SET",
      entityType: "compliance_reminder",
      entityId: id,
      metadata: { remindOn: input.remindOn },
    }).catch(() => {});
    return null;
  });

export const deleteComplianceReminderFn = createServerFn({ method: "POST" })
  .validator((reminderId: string) => z.string().min(1).parse(reminderId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: reminderId }) => {
    const sql = await getSql();
    const rows = await sql.query<{ matter_id: string }>(
      `select matter_id from compliance_reminder where id = $1`,
      [reminderId],
    );
    const row = rows[0];
    if (!row) return null;
    await requireMatterAccess(context.userId, row.matter_id);
    await sql.query(`delete from compliance_reminder where id = $1`, [reminderId]);
    return null;
  });
