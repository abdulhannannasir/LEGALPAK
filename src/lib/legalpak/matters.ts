import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { createId } from "./id";
import { requireCompanyAccess, requireMatterAccess, requireWorkspaceAccess } from "./access";
import { canTransition, MATTER_STATUSES, type MatterStatus, type MatterType } from "./workflow";
import { createMatterSchema, type CreateMatterInput, type Json, type Matter, type MatterWithData } from "./types";
import { computeMatterDueDate } from "./due-date";
import { logAudit } from "./audit";

export type { Matter, MatterWithData, CreateMatterInput, Json } from "./types";

// Qualified with the `m.` alias throughout — getMatterFn joins workflow_data,
// which also has an `id` column, so an unqualified `id` here is ambiguous.
const MATTER_COLUMNS = `
  m.id, m.workspace_id, m.company_id, m.type, m.title, m.status,
  m.due_date::text as due_date,
  m.created_at::text as created_at,
  m.updated_at::text as updated_at
`;

export const listMattersFn = createServerFn({ method: "GET" })
  .validator((companyId: string) => z.string().min(1).parse(companyId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: companyId }) => {
    await requireCompanyAccess(context.userId, companyId);
    const sql = await getSql();
    return sql.query<Matter>(
      `select ${MATTER_COLUMNS} from matter m where m.company_id = $1 order by m.created_at desc`,
      [companyId],
    );
  });

export type MatterWithCompany = Matter & { company_name: string };

/** Every open matter across the workspace, newest-deadline-first, for the compliance calendar. */
export const listWorkspaceMattersFn = createServerFn({ method: "GET" })
  .validator((workspaceId: string) => z.string().min(1).parse(workspaceId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: workspaceId }) => {
    await requireWorkspaceAccess(context.userId, workspaceId);
    const sql = await getSql();
    return sql.query<MatterWithCompany>(
      `select ${MATTER_COLUMNS}, c.name as company_name
       from matter m
       join company c on c.id = m.company_id
       where m.workspace_id = $1
       order by (m.due_date is null), m.due_date asc, m.created_at desc`,
      [workspaceId],
    );
  });

export const getMatterFn = createServerFn({ method: "GET" })
  .validator((matterId: string) => z.string().min(1).parse(matterId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: matterId }) => {
    await requireMatterAccess(context.userId, matterId);
    const sql = await getSql();
    const rows = await sql.query<MatterWithData>(
      `select ${MATTER_COLUMNS}, coalesce(wd.data, '{}'::jsonb) as data
       from matter m
       left join workflow_data wd on wd.matter_id = m.id
       where m.id = $1`,
      [matterId],
    );
    if (!rows[0]) throw new Error("Matter not found");
    return rows[0];
  });

export const createMatterFn = createServerFn({ method: "POST" })
  .validator((input: CreateMatterInput) => createMatterSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const company = await requireCompanyAccess(context.userId, input.companyId);
    const sql = await getSql();
    const matterId = createId("matter");
    const workflowId = createId("workflow");
    const dueDate = input.dueDate || computeMatterDueDate(input.type, input.data ?? {});
    // Select straight from the new_matter CTE's own RETURNING output, not a
    // second SELECT against the base table filtered by its id — a plain SELECT
    // re-scanning `matter` within the same statement is not guaranteed to see
    // a row inserted by a sibling CTE (this returned zero rows in practice).
    const rows = await sql.query<Matter>(
      `with new_matter as (
        insert into matter (id, workspace_id, company_id, type, title, status, due_date, created_by)
        values ($1, $2, $3, $4, $5, 'draft', $6, $7)
        returning
          id, workspace_id, company_id, type, title, status,
          due_date::text as due_date,
          created_at::text as created_at,
          updated_at::text as updated_at
      ), new_workflow as (
        insert into workflow_data (id, matter_id, workflow_type, data)
        select $8, id, $4, $9::jsonb from new_matter
        returning matter_id
      )
      select * from new_matter`,
      [
        matterId,
        company.workspace_id,
        input.companyId,
        input.type,
        input.title,
        dueDate,
        context.userId,
        workflowId,
        JSON.stringify(input.data ?? {}),
      ],
    );
    const matter = rows[0];
    logAudit({
      workspaceId: matter.workspace_id,
      companyId: matter.company_id,
      matterId: matter.id,
      userId: context.userId,
      action: "MATTER_CREATED",
      entityType: "matter",
      entityId: matter.id,
      metadata: { type: matter.type, title: matter.title },
    }).catch(() => {});
    return matter;
  });

export const updateMatterDataFn = createServerFn({ method: "POST" })
  .validator((input: { matterId: string; data: Record<string, Json> }) =>
    z.object({ matterId: z.string().min(1), data: z.record(z.string(), z.unknown()) }).parse(input) as {
      matterId: string;
      data: Record<string, Json>;
    },
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const matter = await requireMatterAccess(context.userId, input.matterId);
    const sql = await getSql();
    const dueDate = computeMatterDueDate(matter.type as MatterType, input.data);
    await sql.query(`update workflow_data set data = $2::jsonb, updated_at = now() where matter_id = $1`, [
      input.matterId,
      JSON.stringify(input.data),
    ]);
    await sql.query(`update matter set due_date = $2, updated_at = now() where id = $1`, [
      input.matterId,
      dueDate,
    ]);
    logAudit({
      workspaceId: matter.workspace_id,
      companyId: matter.company_id,
      matterId: matter.id,
      userId: context.userId,
      action: "MATTER_DRAFT_SAVED",
      entityType: "matter",
      entityId: matter.id,
      metadata: dueDate ? { dueDate } : undefined,
    }).catch(() => {});
    return null;
  });

export const updateMatterStatusFn = createServerFn({ method: "POST" })
  .validator((input: { matterId: string; status: MatterStatus }) =>
    z.object({ matterId: z.string().min(1), status: z.enum(MATTER_STATUSES) }).parse(input),
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const current = await requireMatterAccess(context.userId, input.matterId);
    if (!canTransition(current.status as MatterStatus, input.status)) {
      throw new Error(`Cannot move a matter from "${current.status}" to "${input.status}"`);
    }
    const sql = await getSql();
    const rows = await sql.query<Matter>(
      `update matter as m set status = $2, updated_at = now() where m.id = $1 returning ${MATTER_COLUMNS}`,
      [input.matterId, input.status],
    );
    const matter = rows[0];
    logAudit({
      workspaceId: matter.workspace_id,
      companyId: matter.company_id,
      matterId: matter.id,
      userId: context.userId,
      action: "MATTER_STATUS_CHANGED",
      entityType: "matter",
      entityId: matter.id,
      metadata: { from: current.status, to: input.status },
    }).catch(() => {});
    return matter;
  });
