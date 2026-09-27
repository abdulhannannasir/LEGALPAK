import { AlertTriangle, CheckCircle2, Circle, Clock, PlayCircle } from "lucide-react";
import type { ComponentType } from "react";
import {
  COMPLIANCE_OBLIGATION_STATUS_LABEL,
  COMPLIANCE_PRIORITY_LABEL,
  type ComplianceObligationStatus,
  type CompliancePriority,
} from "@/lib/legalpak/compliance-obligations";
import { formatShort } from "@/lib/legal/date";

export const OBLIGATION_STATUS_STYLE: Record<
  ComplianceObligationStatus,
  { badge: string; icon: ComponentType<{ className?: string; strokeWidth?: number }> }
> = {
  overdue: { badge: "border-danger bg-flag-high text-fg", icon: AlertTriangle },
  due_soon: { badge: "border-warn bg-flag-med text-fg", icon: Clock },
  upcoming: { badge: "border-border bg-surface text-muted", icon: Circle },
  in_progress: { badge: "border-accent bg-surface text-accent", icon: PlayCircle },
  completed: { badge: "border-success bg-flag-low text-fg", icon: CheckCircle2 },
};

/** The obligation's effective status pill — pass an already-computed effective status (see computeObligationEffectiveStatus). */
export function ObligationStatusBadge({
  status,
  dueDate,
  configurationRequired,
}: {
  status: ComplianceObligationStatus;
  dueDate: string | null;
  configurationRequired?: boolean;
}) {
  const style = OBLIGATION_STATUS_STYLE[status];
  const Icon = style.icon;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${style.badge}`}
    >
      <Icon className="size-3.5" strokeWidth={2} />
      {configurationRequired
        ? "Configuration required"
        : dueDate && status !== "completed"
          ? `${COMPLIANCE_OBLIGATION_STATUS_LABEL[status]} · ${formatShort(dueDate)}`
          : COMPLIANCE_OBLIGATION_STATUS_LABEL[status]}
    </span>
  );
}

const PRIORITY_STYLE: Record<CompliancePriority, string> = {
  low: "border-border bg-surface text-muted",
  medium: "border-border bg-surface text-fg",
  high: "border-warn bg-flag-med text-fg",
  critical: "border-danger bg-flag-high text-fg",
};

export function ObligationPriorityBadge({ priority }: { priority: CompliancePriority }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${PRIORITY_STYLE[priority]}`}
    >
      {COMPLIANCE_PRIORITY_LABEL[priority]}
    </span>
  );
}
