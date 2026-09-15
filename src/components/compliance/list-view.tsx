import { Link } from "@tanstack/react-router";
import { deriveCompliance, type ComplianceItem } from "@/lib/legalpak/compliance";
import { MATTER_TYPE_LABEL, STATUS_LABEL } from "@/lib/legalpak/workflow";
import { ComplianceHealthBadge } from "./health-badge";

function formatDaysRemaining(days: number | null): string {
  if (days === null) return "—";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

/**
 * One row per compliance item with every field the Compliance Center
 * promises: requirement, authority, due date, status, days remaining,
 * source and last verified. Card rows (not a literal <table>) so the same
 * markup reflows cleanly on a phone width.
 */
export function ComplianceListView({ items }: { items: ComplianceItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const derived = deriveCompliance(item);
        if (!derived) return null;
        return (
          <Link
            key={item.id}
            to="/matters/$matterId"
            params={{ matterId: item.id }}
            className="block rounded-[var(--radius-md)] border border-border bg-surface p-4 hover:border-accent"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{derived.requirement}</p>
                <p className="text-xs text-muted">
                  {item.company_name} · {MATTER_TYPE_LABEL[item.type]} · {derived.authority}
                </p>
              </div>
              <ComplianceHealthBadge health={derived.health} dueDate={item.due_date} />
            </div>
            <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-muted sm:grid-cols-2">
              <div>
                <dt className="inline font-medium text-fg">Status: </dt>
                <dd className="inline">{STATUS_LABEL[item.status]}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-fg">Days remaining: </dt>
                <dd className="inline">{formatDaysRemaining(derived.daysRemaining)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="inline font-medium text-fg">Source: </dt>
                <dd className="inline">{derived.source.basis}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-fg">Last verified: </dt>
                <dd className="inline">
                  {derived.source.lastVerified ?? <span className="font-medium text-warn">Verification required</span>}
                </dd>
              </div>
            </dl>
          </Link>
        );
      })}
    </div>
  );
}
