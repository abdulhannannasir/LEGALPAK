import { Link } from "@tanstack/react-router";
import { diffDaysISO, todayISO } from "@/lib/legal/date";
import { isTaskOverdue, type TaskWithDetails } from "@/lib/legalpak/tasks";
import { TaskDueDate, TaskPriorityBadge, TaskStatusBadge } from "./task-badge";

function formatDaysRemaining(dueDate: string | null): string {
  if (!dueDate) return "No due date";
  const days = diffDaysISO(todayISO(), dueDate);
  if (days === null) return "—";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

/** One row per task — used on the /tasks board and the dashboard's task widget. */
export function TaskList({ tasks, showCompany = true }: { tasks: TaskWithDetails[]; showCompany?: boolean }) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const overdue = isTaskOverdue(task);
        return (
          <Link
            key={task.id}
            to="/tasks/$taskId"
            params={{ taskId: task.id }}
            className="block rounded-[var(--radius-md)] border border-border bg-surface p-4 hover:border-accent"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{task.title}</p>
                <p className="text-xs text-muted">
                  {showCompany ? `${task.company_name} · ` : ""}
                  {task.assignee_name || task.assignee_email || "Unassigned"}
                  {task.step_total > 0 ? ` · ${task.step_done}/${task.step_total} steps` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <TaskPriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} overdue={overdue} />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">
              <TaskDueDate dueDate={task.due_date} overdue={overdue} /> · {formatDaysRemaining(task.due_date)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
