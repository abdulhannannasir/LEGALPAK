import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApprovalByTokenFn, respondApprovalFn, type ApprovalView } from "@/lib/legalpak/approvals";
import { MATTER_TYPE_LABEL, type MatterType } from "@/lib/legalpak/workflow";

export const Route = createFileRoute("/approve/$token")({
  component: ApprovalPage,
  head: () => ({
    meta: [{ title: "Approval request — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function ApprovalPage() {
  const { token } = useParams({ from: "/approve/$token" });
  const [view, setView] = useState<ApprovalView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    getApprovalByTokenFn({ data: token })
      .then(setView)
      .catch((e) => setError(e instanceof Error ? e.message : "This link is invalid."));
  }

  useEffect(refresh, [token]);

  async function respond(decision: "approved" | "rejected") {
    setSubmitting(true);
    try {
      await respondApprovalFn({ data: { token, decision } });
      toast.success(decision === "approved" ? "Approved" : "Rejected");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit your response");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-2 text-center">
        <h1 className="font-display text-2xl">Link not valid</h1>
        <p className="text-sm text-muted">{error}</p>
      </div>
    );
  }

  if (!view) return null;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">LegalPak</p>
        <h1 className="mt-1 font-display text-3xl">Review request</h1>
      </div>
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-center">
        <p className="text-xs uppercase tracking-wide text-muted">{view.companyName}</p>
        <p className="mt-1 font-display text-xl">{view.matterTitle}</p>
        <p className="mt-1 text-sm text-muted">{MATTER_TYPE_LABEL[view.matterType as MatterType] ?? view.matterType}</p>

        {view.status === "pending" && (
          <>
            <p className="mt-4 text-sm text-muted">
              Your legal team is requesting your approval for this filing.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button type="button" variant="ghost" disabled={submitting} onClick={() => respond("rejected")}>
                <XCircle className="size-4" strokeWidth={1.75} />
                Reject
              </Button>
              <Button type="button" disabled={submitting} onClick={() => respond("approved")}>
                <CheckCircle2 className="size-4" strokeWidth={1.75} />
                Approve
              </Button>
            </div>
          </>
        )}
        {view.status === "approved" && (
          <p className="mt-4 text-sm font-medium text-success">You approved this on behalf of {view.companyName}.</p>
        )}
        {view.status === "rejected" && (
          <p className="mt-4 text-sm font-medium text-danger">You rejected this request.</p>
        )}
        {view.status === "expired" && <p className="mt-4 text-sm text-muted">This link has expired.</p>}
      </div>
    </div>
  );
}
