import { Link } from "@tanstack/react-router";
import { COMPLIANCE_CATEGORY_LABEL } from "@/lib/legalpak/compliance-rules";
import { diffDaysISO, todayISO } from "@/lib/legal/date";
import type { UnifiedComplianceItem } from "@/lib/legalpak/compliance-unified";
import { ObligationPriorityBadge, ObligationStatusBadge } from "./obligation-badge";

function formatDaysRemaining(dueDate: string | null): string {
  if (!dueDate) return "—";
  const days = diffDaysISO(todayISO(), dueDate);
  if (days === null) return "—";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

/** One card per compliance item, matter-derived or a general obligation — same shape either way. */
export function UnifiedComplianceList({ items }: { items: UnifiedComplianceItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link
          key={`${item.kind}:${item.id}`}
          to={item.href}
          className="block rounded-[var(--radius-md)] border border-border bg-surface p-4 hover:border-accent"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted">
                {item.companyName} · {COMPLIANCE_CATEGORY_LABEL[item.category]}
                {item.authority ? ` · ${item.authority}` : ""}
                {item.recurring ? " · Recurring" : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ObligationPriorityBadge priority={item.priority} />
              <ObligationStatusBadge
                status={item.status}
                dueDate={item.dueDate}
                configurationRequired={item.configurationRequired}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">Days remaining: {formatDaysRemaining(item.dueDate)}</p>
        </Link>
      ))}
    </div>
  );
}
