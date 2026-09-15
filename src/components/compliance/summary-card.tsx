import type { ReactNode } from "react";
import { CheckCircle2, RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deriveCompliance, type ComplianceItem } from "@/lib/legalpak/compliance";
import { STATUS_LABEL } from "@/lib/legalpak/workflow";
import { formatShort } from "@/lib/legal/date";
import { ComplianceHealthBadge } from "./health-badge";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

function formatDaysRemaining(days: number | null): string {
  if (days === null) return "—";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

/**
 * The compliance task detail summary: Requirement, Authority, Due Date,
 * Status, Days Remaining, Source and Last Verified, plus the mark
 * complete / reopen action. Rendered on the matter detail page
 * (src/routes/matters.$matterId.tsx) for any compliance-tracked matter type.
 */
export function ComplianceSummaryCard({
  item,
  onMarkComplete,
  onReopen,
  busy,
}: {
  item: Pick<ComplianceItem, "type" | "status" | "due_date" | "title">;
  onMarkComplete: () => void;
  onReopen: () => void;
  busy: boolean;
}) {
  const derived = deriveCompliance(item);
  if (!derived) return null;
  const isComplete = item.status === "filed" || item.status === "closed";

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Compliance requirement</p>
          <h2 className="mt-1 font-display text-xl">{derived.requirement}</h2>
        </div>
        <ComplianceHealthBadge health={derived.health} dueDate={item.due_date} />
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <Row label="Authority" value={derived.authority} />
        <Row label="Due date" value={item.due_date ? formatShort(item.due_date) : "Not yet computed"} />
        <Row label="Status" value={STATUS_LABEL[item.status]} />
        <Row label="Days remaining" value={formatDaysRemaining(derived.daysRemaining)} />
        <Row
          label="Source"
          value={
            <>
              {derived.source.basis}
              {derived.source.sourceUrl && (
                <>
                  {" · "}
                  <a href={derived.source.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                    View source
                  </a>
                </>
              )}
            </>
          }
        />
        <Row
          label="Last verified"
          value={
            derived.source.lastVerified ? (
              <span className="inline-flex items-center gap-1 text-success">
                <ShieldCheck className="size-3.5" strokeWidth={1.75} />
                {derived.source.lastVerified}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-warn">
                <ShieldAlert className="size-3.5" strokeWidth={1.75} />
                Verification required
              </span>
            )
          }
        />
      </dl>

      <div className="mt-4">
        {isComplete ? (
          <Button type="button" variant="secondary" disabled={busy || item.status === "closed"} onClick={onReopen}>
            <RotateCcw className="size-4" strokeWidth={1.75} />
            Reopen
          </Button>
        ) : (
          <Button type="button" disabled={busy} onClick={onMarkComplete}>
            <CheckCircle2 className="size-4" strokeWidth={1.75} />
            Mark complete
          </Button>
        )}
      </div>
    </section>
  );
}
