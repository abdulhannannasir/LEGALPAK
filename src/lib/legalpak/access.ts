import { getSql } from "@/lib/db";

/**
 * Every LegalPak table hangs off a workspace, and every workspace has members.
 * These never trust a client-supplied workspace/company/matter id on its own —
 * each one re-derives ownership from `workspace_member` for the CALLING user,
 * server-side. Call only from inside a `createServerFn().handler()` (same rule
 * as `@/lib/db`'s `getSql` — this file is plain-named, not `*.server.*`,
 * because that pattern is reserved for `createMiddleware()`'s dedicated
 * `.server()` phase; a generic `.handler()` cannot import from a `.server.ts`
 * module, dynamically or otherwise — TanStack Start's import-protection plugin
 * mocks it out in the client dev bundle even then).
 */

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireWorkspaceAccess(userId: string, workspaceId: string) {
  const sql = await getSql();
  const rows = await sql<{ id: string; role: string }>`
    select id, role from workspace_member
    where workspace_id = ${workspaceId} and user_id = ${userId}
  `;
  if (!rows[0]) throw new ForbiddenError();
  return rows[0];
}

export async function requireCompanyAccess(userId: string, companyId: string) {
  const sql = await getSql();
  const rows = await sql<{ id: string; workspace_id: string; name: string }>`
    select c.id, c.workspace_id, c.name
    from company c
    join workspace_member wm on wm.workspace_id = c.workspace_id
    where c.id = ${companyId} and wm.user_id = ${userId}
  `;
  if (!rows[0]) throw new ForbiddenError();
  return rows[0];
}

export async function requireMatterAccess(userId: string, matterId: string) {
  const sql = await getSql();
  const rows = await sql<{ id: string; workspace_id: string; company_id: string; status: string; type: string }>`
    select m.id, m.workspace_id, m.company_id, m.status, m.type
    from matter m
    join workspace_member wm on wm.workspace_id = m.workspace_id
    where m.id = ${matterId} and wm.user_id = ${userId}
  `;
  if (!rows[0]) throw new ForbiddenError();
  return rows[0];
}

export async function requireObligationAccess(userId: string, obligationId: string) {
  const sql = await getSql();
  const rows = await sql<{ id: string; workspace_id: string; company_id: string; status: string }>`
    select o.id, o.workspace_id, o.company_id, o.status
    from compliance_obligation o
    join workspace_member wm on wm.workspace_id = o.workspace_id
    where o.id = ${obligationId} and wm.user_id = ${userId}
  `;
  if (!rows[0]) throw new ForbiddenError();
  return rows[0];
}
