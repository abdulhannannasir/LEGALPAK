import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { ForbiddenError } from "./access";
import { logAudit } from "./audit";

/**
 * Single-founder app, no roles table yet — admin is whoever signs in with
 * this email. Good enough until there's more than one person doing
 * verification; if that changes, promote this to a real `is_admin` column
 * on `workspace_member` or a dedicated `admin` table instead of a bigger
 * hardcoded list.
 */
const ADMIN_EMAILS = ["hannan262002@gmail.com"];

async function requireAdmin(userId: string): Promise<void> {
  const sql = await getSql();
  const rows = await sql<{ email: string }>`select email from "user" where id = ${userId}`;
  const email = rows[0]?.email;
  if (!email || !ADMIN_EMAILS.includes(email.toLowerCase())) {
    throw new ForbiddenError("Not authorized");
  }
}

export type PendingSubscription = {
  id: string;
  workspace_id: string;
  workspace_name: string;
  amount_pkr: number;
  payment_reference: string | null;
  payer_phone: string | null;
  submitted_by_email: string | null;
  created_at: string;
};

export type DecidedSubscription = PendingSubscription & {
  status: "active" | "rejected" | "expired";
  verified_at: string | null;
};

export const listPendingSubscriptionsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    return sql.query<PendingSubscription>(
      `select s.id, s.workspace_id, w.name as workspace_name, s.amount_pkr,
              s.payment_reference, s.payer_phone, u.email as submitted_by_email,
              s.created_at::text as created_at
       from subscription s
       join workspace w on w.id = s.workspace_id
       left join "user" u on u.id = s.submitted_by
       where s.status = 'pending'
       order by s.created_at asc`,
    );
  });

export const listRecentDecisionsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    return sql.query<DecidedSubscription>(
      `select s.id, s.workspace_id, w.name as workspace_name, s.amount_pkr,
              s.payment_reference, s.payer_phone, u.email as submitted_by_email,
              s.status, s.verified_at::text as verified_at, s.created_at::text as created_at
       from subscription s
       join workspace w on w.id = s.workspace_id
       left join "user" u on u.id = s.submitted_by
       where s.status in ('active', 'rejected', 'expired')
       order by s.verified_at desc nulls last, s.created_at desc
       limit 20`,
    );
  });

const decideSchema = z.object({ subscriptionId: z.string().min(1) });

export const activateSubscriptionFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof decideSchema>) => decideSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql.query<{ workspace_id: string }>(
      `update subscription
       set status = 'active', verified_at = now(),
           period_start = now(), period_end = now() + interval '30 days'
       where id = $1 and status = 'pending'
       returning workspace_id`,
      [input.subscriptionId],
    );
    if (!rows[0]) throw new Error("That payment is no longer pending — someone may have already decided it.");
    logAudit({
      workspaceId: rows[0].workspace_id,
      userId: context.userId,
      action: "SUBSCRIPTION_ACTIVATED",
      metadata: { subscriptionId: input.subscriptionId },
    }).catch(() => {});
    return { ok: true };
  });

export const rejectSubscriptionFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof decideSchema>) => decideSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql.query<{ workspace_id: string }>(
      `update subscription
       set status = 'rejected', verified_at = now()
       where id = $1 and status = 'pending'
       returning workspace_id`,
      [input.subscriptionId],
    );
    if (!rows[0]) throw new Error("That payment is no longer pending — someone may have already decided it.");
    logAudit({
      workspaceId: rows[0].workspace_id,
      userId: context.userId,
      action: "SUBSCRIPTION_REJECTED",
      metadata: { subscriptionId: input.subscriptionId },
    }).catch(() => {});
    return { ok: true };
  });
