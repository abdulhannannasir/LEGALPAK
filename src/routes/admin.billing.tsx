import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import {
  activateSubscriptionFn,
  listPendingSubscriptionsFn,
  listRecentDecisionsFn,
  rejectSubscriptionFn,
  type DecidedSubscription,
  type PendingSubscription,
} from "@/lib/legalpak/admin";

export const Route = createFileRoute("/admin/billing")({
  component: AdminBillingPage,
  head: () => ({
    meta: [{ title: "Billing admin — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function AdminBillingPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <AdminBillingBody />;
}

function AdminBillingBody() {
  const [pending, setPending] = useState<PendingSubscription[] | null>(null);
  const [recent, setRecent] = useState<DecidedSubscription[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [deciding, setDeciding] = useState<string | null>(null);

  async function refresh() {
    try {
      const [p, r] = await Promise.all([listPendingSubscriptionsFn(), listRecentDecisionsFn()]);
      setPending(p);
      setRecent(r);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Not authorized")) {
        setForbidden(true);
      } else {
        toast.error("Could not load billing admin data");
      }
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function activate(id: string) {
    setDeciding(id);
    try {
      await activateSubscriptionFn({ data: { subscriptionId: id } });
      toast.success("Activated — the workspace's paywall lifts immediately");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not activate");
    } finally {
      setDeciding(null);
    }
  }

  async function reject(id: string) {
    setDeciding(id);
    try {
      await rejectSubscriptionFn({ data: { subscriptionId: id } });
      toast.success("Rejected");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reject");
    } finally {
      setDeciding(null);
    }
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-lg space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center">
        <XCircle className="mx-auto size-8 text-danger" strokeWidth={1.5} />
        <h1 className="font-display text-2xl">Not authorized</h1>
        <p className="text-sm text-muted">This page is restricted to the site owner.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Admin</p>
        <h1 className="font-display text-3xl">Billing verification</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Check the transaction id and amount against your EasyPaisa app before activating — this
          page doesn't verify the transfer for you, it just replaces writing SQL by hand.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-display text-xl">
          <Clock className="size-5 text-accent" strokeWidth={1.75} />
          Pending ({pending?.length ?? 0})
        </h2>
        {pending === null ? null : pending.length === 0 ? (
          <p className="text-sm text-muted">Nothing waiting on verification.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <p className="font-medium">{p.workspace_name}</p>
                  <p className="text-muted">
                    PKR {p.amount_pkr.toLocaleString("en-PK")} · txn{" "}
                    <span className="font-mono">{p.payment_reference}</span> · from {p.payer_phone}
                  </p>
                  <p className="text-xs text-muted">
                    Submitted by {p.submitted_by_email ?? "unknown"} ·{" "}
                    {new Date(p.created_at).toLocaleString("en-GB")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={deciding === p.id}
                    onClick={() => reject(p.id)}
                  >
                    Reject
                  </Button>
                  <Button type="button" disabled={deciding === p.id} onClick={() => activate(p.id)}>
                    {deciding === p.id ? "Working…" : "Activate"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl">Recent decisions</h2>
        {recent === null || recent.length === 0 ? (
          <p className="text-sm text-muted">No decisions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4">Workspace</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Decided</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-2 pr-4">{r.workspace_name}</td>
                    <td className="py-2 pr-4">PKR {r.amount_pkr.toLocaleString("en-PK")}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          r.status === "active" ? "text-success" : "text-danger"
                        }`}
                      >
                        {r.status === "active" ? (
                          <CheckCircle2 className="size-3.5" strokeWidth={1.75} />
                        ) : (
                          <XCircle className="size-3.5" strokeWidth={1.75} />
                        )}
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {r.verified_at ? new Date(r.verified_at).toLocaleString("en-GB") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
