import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import {
  createApprovalRequestFn,
  listApprovalsForMatterFn,
  type ApprovalRequest,
} from "@/lib/legalpak/approvals";

const STATUS_STYLE: Record<ApprovalRequest["status"], string> = {
  pending: "border-warn bg-flag-med",
  approved: "border-success bg-flag-low",
  rejected: "border-danger bg-flag-high",
  expired: "border-border bg-bg text-muted",
};

export function ClientApproval({ matterId }: { matterId: string }) {
  const [requests, setRequests] = useState<ApprovalRequest[] | null>(null);
  const [email, setEmail] = useState("");
  const [generating, setGenerating] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  function refresh() {
    listApprovalsForMatterFn({ data: matterId })
      .then(setRequests)
      .catch(() => setRequests([]));
  }

  useEffect(refresh, [matterId]);

  async function generate() {
    setGenerating(true);
    try {
      const { token } = await createApprovalRequestFn({
        data: { matterId, clientEmail: email.trim() || undefined },
      });
      const url = `${window.location.origin}/approve/${token}`;
      setLink(url);
      toast.success("Approval link generated — share it with your client");
      refresh();
    } catch {
      toast.error("Could not generate an approval link");
    } finally {
      setGenerating(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy — select the link manually");
    }
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="font-display text-xl">Client approval</h2>
      <p className="mt-1 text-sm text-muted">
        Generate a secure link your client can open — no account needed — to approve or reject this matter.
        Sending it is manual for now; copy it into an email or message yourself.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <Field label="Client email (optional, for your reference)" className="min-w-[220px] flex-1">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" />
        </Field>
        <Button type="button" disabled={generating} onClick={generate}>
          <Send className="size-4" strokeWidth={1.75} />
          {generating ? "Generating…" : "Generate link"}
        </Button>
      </div>
      {link && (
        <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2">
          <code className="min-w-0 flex-1 truncate text-xs">{link}</code>
          <Button type="button" variant="ghost" onClick={copyLink}>
            <Copy className="size-4" strokeWidth={1.75} />
            Copy
          </Button>
        </div>
      )}
      {requests && requests.length > 0 && (
        <div className="mt-4 space-y-2">
          {requests.map((r) => (
            <div
              key={r.id}
              className={`flex items-center justify-between rounded-[var(--radius-md)] border-l-4 px-3 py-2 text-sm ${STATUS_STYLE[r.status]}`}
            >
              <span>{r.client_email ?? "No email on file"}</span>
              <span className="font-medium capitalize">{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
