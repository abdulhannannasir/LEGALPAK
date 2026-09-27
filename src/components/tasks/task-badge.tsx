import { AlertTriangle, CheckCircle2, Circle, PauseCircle, PlayCircle } from "lucide-react";
import type { ComponentType } from "react";
import { TASK_STATUS_LABEL, TASK_PRIORITY_LABEL, type TaskStatus, type TaskPriority } from "@/lib/legalpak/tasks";
import { formatShort } from "@/lib/legal/date";

const TASK_STATUS_STYLE: Record<TaskStatus, { badge: string; icon: ComponentType<{ className?: string; strokeWidth?: number }> }> = {
  todo: { badge: "border-border bg-surface text-muted", icon: Circle },
  in_progress: { badge: "border-accent bg-surface text-accent", icon: PlayCircle },
  blocked: { badge: "border-warn bg-flag-med text-fg", icon: PauseCircle },
  done: { badge: "border-success bg-flag-low text-fg", icon: CheckCircle2 },
};

export function TaskStatusBadge({ status, overdue }: { status: TaskStatus; overdue?: boolean }) {
  if (overdue) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-danger bg-flag-high px-3 py-1 text-xs font-medium text-fg">
        <AlertTriangle className="size-3.5" strokeWidth={2} />
        Overdue
      </span>
    );
  }
  const style = TASK_STATUS_STYLE[status];
  const Icon = style.icon;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${style.badge}`}>
      <Icon className="size-3.5" strokeWidth={2} />
      {TASK_STATUS_LABEL[status]}
    </span>
  );
}

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  low: "border-border bg-surface text-muted",
  medium: "border-border bg-surface text-fg",
  high: "border-warn bg-flag-med text-fg",
  critical: "border-danger bg-flag-high text-fg",
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${PRIORITY_STYLE[priority]}`}>
      {TASK_PRIORITY_LABEL[priority]}
    </span>
  );
}

export function TaskDueDate({ dueDate, overdue }: { dueDate: string | null; overdue?: boolean }) {
  if (!dueDate) return <span className="text-muted">No due date</span>;
  return <span className={overdue ? "font-medium text-danger" : undefined}>{formatShort(dueDate)}</span>;
}
