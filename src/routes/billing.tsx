import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Copy, XCircle } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listWorkspacesFn, type Workspace } from "@/lib/legalpak/workspaces";
import {
  CORPORATE_PLAN_PRICE_PKR,
  EASYPAISA_NUMBER,
  getWorkspaceSubscriptionFn,
  submitPaymentFn,
  type Subscription,
} from "@/lib/legalpak/billing";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export const Route = createFileRoute("/billing")({
  component: BillingPage,
  head: () => ({
    meta: [
      { title: "Corporate Suite billing — LegalPak" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function BillingPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <BillingBody />;
}

const STATUS_META: Record<Subscription["status"], { label: string; icon: typeof CheckCircle2; className: string }> = {
  active: { label: "Active", icon: CheckCircle2, className: "text-success" },
  pending: { label: "Pending verification", icon: Clock, className: "text-accent" },
  rejected: { label: "Rejected — resubmit below", icon: XCircle, className: "text-danger" },
  expired: { label: "Expired — resubscribe below", icon: XCircle, className: "text-danger" },
};

function BillingBody() {
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [latest, setLatest] = useState<Subscription | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listWorkspacesFn()
      .then((rows: Workspace[]) => {
        setWorkspaces(rows);
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get("workspaceId");
        const initial = (fromQuery && rows.some((r) => r.id === fromQuery) ? fromQuery : rows[0]?.id) ?? "";
        setWorkspaceId(initial);
      })
      .catch(() => setWorkspaces([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    getWorkspaceSubscriptionFn({ data: workspaceId })
      .then(({ latest, isActive }) => {
        setLatest(latest);
        setIsActive(isActive);
      })
      .catch(() => {
        setLatest(null);
        setIsActive(false);
      });
  }, [workspaceId]);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(EASYPAISA_NUMBER.replace(/\s/g, ""));
      toast.success("EasyPaisa number copied");
    } catch {
      toast.error("Couldn't copy — select the number manually");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId) {
      toast.error("Create a workspace first");
      return;
    }
    setSubmitting(true);
    try {
      await submitPaymentFn({ data: { workspaceId, transactionId, payerPhone } });
      toast.success("Submitted — we'll verify the transfer and activate your subscription shortly");
      setTransactionId("");
      setPayerPhone("");
      const { latest, isActive } = await getWorkspaceSubscriptionFn({ data: workspaceId });
      setLatest(latest);
      setIsActive(isActive);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit — check the details and try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Billing</p>
        <h1 className="font-display text-3xl">Corporate Suite — PKR {CORPORATE_PLAN_PRICE_PKR.toLocaleString("en-PK")}/month</h1>
        <p className="mt-2 text-sm text-muted">
          Financial Statements, Form A, Form 9, Contracts, Incorporation, Form 21/45, Legal
          Notices, the Tax Assistant, and the Compliance Calendar — per workspace, per month.
          Citizen Legal Help and the Help Desk & Rights Navigator stay free, no subscription
          needed.
        </p>
      </div>

      {workspaces && workspaces.length > 1 && (
        <Field label="Workspace">
          <select
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            className="w-full min-h-11 rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-sm"
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {!workspaceId ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
          Create a workspace from the{" "}
          <Link to="/dashboard" className="text-accent underline">
            dashboard
          </Link>{" "}
          first, then come back here to subscribe.
        </div>
      ) : (
        <>
          {latest && (
            <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-sm">
              {(() => {
                const meta = STATUS_META[latest.status];
                const Icon = meta.icon;
                return (
                  <>
                    <Icon className={`size-4 ${meta.className}`} strokeWidth={1.75} />
                    <span>
                      Current status: <span className="font-medium">{meta.label}</span>
                      {latest.status === "pending" && " — usually verified within a business day."}
                    </span>
                  </>
                );
              })()}
            </div>
          )}

          {!isActive && (
            <>
              <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                <h2 className="font-display text-lg">1. Send payment via EasyPaisa</h2>
                <p className="text-sm text-muted">
                  Send PKR {CORPORATE_PLAN_PRICE_PKR.toLocaleString("en-PK")} to the EasyPaisa
                  account below from the EasyPaisa app or any mobile-wallet transfer.
                </p>
                <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-bg p-4">
                  <span className="font-display text-xl tracking-wide">{EASYPAISA_NUMBER}</span>
                  <Button type="button" variant="ghost" onClick={copyNumber}>
                    <Copy className="size-4" strokeWidth={1.75} />
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted">
                  This is a manual transfer, not an automated checkout — there's no card form and
                  we never ask for your EasyPaisa PIN. Only send money if you initiated the
                  transfer yourself from your own EasyPaisa app.
                </p>
              </section>

              <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                <h2 className="font-display text-lg">2. Submit your transaction id</h2>
                <form onSubmit={submit} className="space-y-4">
                  <Field label="EasyPaisa transaction id">
                    <Input
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. 8823491057"
                    />
                  </Field>
                  <Field label="Phone number the payment was sent from">
                    <Input
                      required
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                      placeholder="03XXXXXXXXX"
                    />
                  </Field>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit payment for verification"}
                  </Button>
                </form>
              </section>
            </>
          )}

          {isActive && (
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 text-sm">
              <p className="font-medium text-success">Your Corporate Suite subscription is active.</p>
              <p className="mt-1 text-muted">
                {latest?.period_end
                  ? `Renews on ${new Date(latest.period_end).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
                  : ""}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
