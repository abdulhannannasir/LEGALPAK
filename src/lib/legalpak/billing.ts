import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireWorkspaceAccess } from "./access";
import { createId } from "./id";
import { logAudit } from "./audit";

export const CORPORATE_PLAN_PRICE_PKR = 3000;
export const EASYPAISA_NUMBER = "0307 9670000";

export type Subscription = {
  id: string;
  workspace_id: string;
  plan: string;
  amount_pkr: number;
  payment_method: string;
  payment_reference: string | null;
  status: "pending" | "active" | "rejected" | "expired";
  period_start: string | null;
  period_end: string | null;
  created_at: string;
};

const SUBSCRIPTION_COLUMNS = `
  id, workspace_id, plan, amount_pkr, payment_method, payment_reference, status,
  period_start::text as period_start, period_end::text as period_end,
  created_at::text as created_at
`;

/** The latest subscription row for a workspace, plus whether it's currently active. */
export const getWorkspaceSubscriptionFn = createServerFn({ method: "GET" })
  .validator((workspaceId: string) => z.string().min(1).parse(workspaceId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: workspaceId }) => {
    await requireWorkspaceAccess(context.userId, workspaceId);
    const sql = await getSql();
    const rows = await sql.query<Subscription>(
      `select ${SUBSCRIPTION_COLUMNS} from subscription
       where workspace_id = $1 order by created_at desc limit 1`,
      [workspaceId],
    );
    const latest = rows[0] ?? null;
    const isActive =
      latest?.status === "active" &&
      (!latest.period_end || new Date(latest.period_end) > new Date());
    return { latest, isActive };
  });

const submitPaymentSchema = z.object({
  workspaceId: z.string().min(1),
  transactionId: z.string().trim().min(4, "Enter the EasyPaisa transaction id"),
  payerPhone: z.string().trim().min(7, "Enter the phone number the payment was sent from"),
});

/**
 * Records a claimed EasyPaisa payment as 'pending'. This does NOT verify the
 * transaction actually cleared — there is no payment-gateway callback to
 * check against. Verify manually (confirm the transfer landed in the
 * EasyPaisa account) and then run:
 *
 *   update subscription set status = 'active', verified_at = now(),
 *     period_start = now(), period_end = now() + interval '30 days'
 *   where id = '<subscription id>';
 */
export const submitPaymentFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof submitPaymentSchema>) => submitPaymentSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireWorkspaceAccess(context.userId, input.workspaceId);
    const sql = await getSql();
    const id = createId("sub");
    await sql.query(
      `insert into subscription
         (id, workspace_id, amount_pkr, payment_method, payment_reference, payer_phone, status, submitted_by)
       values ($1, $2, $3, 'easypaisa', $4, $5, 'pending', $6)`,
      [id, input.workspaceId, CORPORATE_PLAN_PRICE_PKR, input.transactionId, input.payerPhone, context.userId],
    );
    logAudit({
      workspaceId: input.workspaceId,
      userId: context.userId,
      action: "PAYMENT_SUBMITTED",
      metadata: { transactionId: input.transactionId, amount: CORPORATE_PLAN_PRICE_PKR },
    }).catch(() => {});
    return { id };
  });
