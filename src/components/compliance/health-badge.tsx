import { AlertTriangle, CheckCircle2, Circle, Clock, ShieldQuestion } from "lucide-react";
import type { ComponentType } from "react";
import type { ComplianceHealth } from "@/lib/legalpak/compliance";
import { formatShort } from "@/lib/legal/date";

export const HEALTH_STYLE: Record<
  ComplianceHealth,
  { label: string; badge: string; icon: ComponentType<{ className?: string; strokeWidth?: number }> }
> = {
  overdue: { label: "Overdue", badge: "border-danger bg-flag-high text-fg", icon: AlertTriangle },
  due_soon: { label: "Due soon", badge: "border-warn bg-flag-med text-fg", icon: Clock },
  upcoming: { label: "Upcoming", badge: "border-border bg-surface text-muted", icon: Circle },
  unscheduled: { label: "Verification required", badge: "border-border bg-surface text-muted", icon: ShieldQuestion },
  completed: { label: "Completed", badge: "border-success bg-flag-low text-fg", icon: CheckCircle2 },
};

/** Shared pill used by the list view, calendar view and task detail — one place to change how a health bucket reads. */
export function ComplianceHealthBadge({ health, dueDate }: { health: ComplianceHealth; dueDate: string | null }) {
  const style = HEALTH_STYLE[health];
  const Icon = style.icon;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${style.badge}`}
    >
      <Icon className="size-3.5" strokeWidth={2} />
      {dueDate && health !== "completed" ? `${style.label} · ${formatShort(dueDate)}` : style.label}
    </span>
  );
}
