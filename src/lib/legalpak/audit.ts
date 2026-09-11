import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { createId } from "./id";
import { requireMatterAccess } from "./access";
import type { Json } from "./types";

export type AuditEntry = {
  workspaceId: string;
  companyId?: string;
  matterId?: string;
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, Json>;
};

/**
 * Append one row to the audit trail. Called from within another domain's
 * server-function handler right after its mutation succeeds — never awaited
 * by the caller's own success path (a logging failure must not roll back or
 * mask the real mutation), so callers fire-and-forget with `.catch(() => {})`.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `insert into audit_log (id, workspace_id, company_id, matter_id, user_id, action, entity_type, entity_id, metadata)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
    [
      createId("audit"),
      entry.workspaceId,
      entry.companyId ?? null,
      entry.matterId ?? null,
      entry.userId,
      entry.action,
      entry.entityType ?? null,
      entry.entityId ?? null,
      JSON.stringify(entry.metadata ?? {}),
    ],
  );
}

export type AuditLogRow = {
  id: string;
  action: string;
  entity_type: string | null;
  metadata: Record<string, Json>;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
};

export const listMatterActivityFn = createServerFn({ method: "GET" })
  .validator((matterId: string) => z.string().min(1).parse(matterId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: matterId }) => {
    await requireMatterAccess(context.userId, matterId);
    const sql = await getSql();
    return sql.query<AuditLogRow>(
      `select
        a.id, a.action, a.entity_type, a.metadata,
        a.created_at::text as created_at,
        u.name as user_name, u.email as user_email
      from audit_log a
      left join "user" u on u.id = a.user_id
      where a.matter_id = $1
      order by a.created_at desc`,
      [matterId],
    );
  });
