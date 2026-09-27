import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import {
  addTaskStepFn,
  deleteTaskStepFn,
  listTaskStepsFn,
  toggleTaskStepFn,
  type TaskStepRow,
} from "@/lib/legalpak/tasks";

/** The ordered checklist for a task — e.g. "Gather financial information -> Prepare filing -> ... -> Mark completed". */
export function TaskSteps({ taskId }: { taskId: string }) {
  const [steps, setSteps] = useState<TaskStepRow[] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function refresh() {
    listTaskStepsFn({ data: taskId })
      .then(setSteps)
      .catch(() => setSteps([]));
  }
  useEffect(refresh, [taskId]);

  async function add() {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await addTaskStepFn({ data: { taskId, title: newTitle.trim() } });
      setNewTitle("");
      refresh();
    } catch {
      toast.error("Could not add step");
    } finally {
      setAdding(false);
    }
  }

  async function toggle(step: TaskStepRow) {
    setBusyId(step.id);
    try {
      await toggleTaskStepFn({ data: { stepId: step.id, done: !step.done } });
      refresh();
    } catch {
      toast.error("Could not update step");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(stepId: string) {
    setBusyId(stepId);
    try {
      await deleteTaskStepFn({ data: stepId });
      refresh();
    } catch {
      toast.error("Could not remove step");
    } finally {
      setBusyId(null);
    }
  }

  const total = steps?.length ?? 0;
  const done = steps?.filter((s) => s.done).length ?? 0;

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Checklist</h2>
        {total > 0 && (
          <span className="text-xs font-medium text-muted">
            {done}/{total} done
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bg">
          <div
            className="h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${total === 0 ? 0 : Math.round((done / total) * 100)}%` }}
          />
        </div>
      )}

      {steps === null ? (
        <p className="mt-4 text-sm text-muted">Loading…</p>
      ) : steps.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No steps yet — break this task into a workflow below.</p>
      ) : (
        <ul className="mt-4 space-y-1.5">
          {steps.map((step) => (
            <li
              key={step.id}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2"
            >
              <input
                type="checkbox"
                checked={step.done}
                disabled={busyId === step.id}
                onChange={() => toggle(step)}
                className="size-4 shrink-0 accent-[var(--color-accent)]"
                aria-label={`Mark "${step.title}" ${step.done ? "not done" : "done"}`}
              />
              <span className={`flex-1 text-sm ${step.done ? "text-muted line-through" : ""}`}>{step.title}</span>
              <button
                type="button"
                onClick={() => remove(step.id)}
                disabled={busyId === step.id}
                aria-label={`Remove step "${step.title}"`}
                className="text-muted hover:text-danger"
              >
                <Trash2 className="size-4" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="e.g. Director approval"
          aria-label="New step"
        />
        <Button type="button" variant="secondary" disabled={adding || !newTitle.trim()} onClick={add}>
          <Plus className="size-4" strokeWidth={1.75} />
          Add step
        </Button>
      </div>
    </section>
  );
}
