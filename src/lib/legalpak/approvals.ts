import { createServerFn } from "@tanstack/react-start";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { createId } from "./id";
import { requireMatterAccess } from "./access";
import { logAudit } from "./audit";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const APPROVAL_TTL_DAYS = 14;

export type ApprovalRequest = {
  id: string;
  matter_id: string;
  client_email: string | null;
  status: "pending" | "approved" | "rejected" | "expired";
  expires_at: string;
  responded_at: string | null;
  created_at: string;
};

/** Lawyer-side: generate a link for the matter. The raw token is returned ONCE — only its hash is stored. */
export const createApprovalRequestFn = createServerFn({ method: "POST" })
  .validator((input: { matterId: string; clientEmail?: string }) =>
    z.object({ matterId: z.string().min(1), clientEmail: z.string().email().optional() }).parse(input),
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const matter = await requireMatterAccess(context.userId, input.matterId);
    const token = randomBytes(32).toString("hex");
    const id = createId("approval");
    const expiresAt = new Date(Date.now() + APPROVAL_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const sql = await getSql();
    await sql.query(
      `insert into approval_request (id, workspace_id, matter_id, requested_by, client_email, token_hash, expires_at)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [id, matter.workspace_id, input.matterId, context.userId, input.clientEmail ?? null, hashToken(token), expiresAt],
    );

    logAudit({
      workspaceId: matter.workspace_id,
      companyId: matter.company_id,
      matterId: matter.id,
      userId: context.userId,
      action: "APPROVAL_REQUESTED",
      entityType: "approval_request",
      entityId: id,
      metadata: input.clientEmail ? { clientEmail: input.clientEmail } : undefined,
    }).catch(() => {});

    // The raw token is only ever returned here — share this link with the
    // client manually (copy it) until email sending is wired up.
    return { id, token };
  });

export const listApprovalsForMatterFn = createServerFn({ method: "GET" })
  .validator((matterId: string) => z.string().min(1).parse(matterId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: matterId }) => {
    await requireMatterAccess(context.userId, matterId);
    const sql = await getSql();
    return sql.query<ApprovalRequest>(
      `select id, matter_id, client_email, status, expires_at::text as expires_at,
              responded_at::text as responded_at, created_at::text as created_at
       from approval_request where matter_id = $1 order by created_at desc`,
      [matterId],
    );
  });

export type ApprovalView = {
  status: "pending" | "approved" | "rejected" | "expired";
  companyName: string;
  matterTitle: string;
  matterType: string;
  expiresAt: string;
};

/** Public — no session. Access is gated purely by possession of the raw token. */
export const getApprovalByTokenFn = createServerFn({ method: "GET" })
  .validator((token: string) => z.string().min(1).parse(token))
  .handler(async ({ data: token }) => {
    const sql = await getSql();
    const rows = await sql.query<{
      status: "pending" | "approved" | "rejected" | "expired";
      expires_at: string;
      matter_title: string;
      matter_type: string;
      company_name: string;
    }>(
      `select ar.status, ar.expires_at::text as expires_at,
              m.title as matter_title, m.type as matter_type, c.name as company_name
       from approval_request ar
       join matter m on m.id = ar.matter_id
       join company c on c.id = m.company_id
       where ar.token_hash = $1`,
      [hashToken(token)],
    );
    const row = rows[0];
    if (!row) throw new Error("This link is invalid.");
    const expired = row.status === "pending" && new Date(row.expires_at) < new Date();
    return {
      status: expired ? "expired" : row.status,
      companyName: row.company_name,
      matterTitle: row.matter_title,
      matterType: row.matter_type,
      expiresAt: row.expires_at,
    } satisfies ApprovalView;
  });

/** Public — no session. The client's decision, gated by the same token. */
export const respondApprovalFn = createServerFn({ method: "POST" })
  .validator((input: { token: string; decision: "approved" | "rejected" }) =>
    z.object({ token: z.string().min(1), decision: z.enum(["approved", "rejected"]) }).parse(input),
  )
  .handler(async ({ data: input }) => {
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      matter_id: string;
      status: string;
      expires_at: string;
      workspace_id: string;
    }>(`select id, matter_id, status, expires_at::text as expires_at, workspace_id from approval_request where token_hash = $1`, [
      hashToken(input.token),
    ]);
    const approval = rows[0];
    if (!approval) throw new Error("This link is invalid.");
    if (approval.status !== "pending") throw new Error("This request has already been responded to.");
    if (new Date(approval.expires_at) < new Date()) throw new Error("This link has expired.");

    await sql.query(`update approval_request set status = $2, responded_at = now() where id = $1`, [
      approval.id,
      input.decision,
    ]);

    // Get matter's company for the audit entry (approval flow has no signed-in user).
    const matterRows = await sql.query<{ company_id: string }>(`select company_id from matter where id = $1`, [
      approval.matter_id,
    ]);

    logAudit({
      workspaceId: approval.workspace_id,
      companyId: matterRows[0]?.company_id,
      matterId: approval.matter_id,
      userId: "client",
      action: input.decision === "approved" ? "CLIENT_APPROVED" : "CLIENT_REJECTED",
      entityType: "approval_request",
      entityId: approval.id,
    }).catch(() => {});

    return { status: input.decision };
  });
