import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, PlayCircle, Trash2 } from "lucide-react";
import { RequireSubscription } from "@/components/billing/RequireSubscription";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ActivityTimeline } from "@/components/activity-timeline";
import { TaskSteps } from "@/components/tasks/task-steps";
import { TaskComments } from "@/components/tasks/task-comments";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/tasks/task-badge";
import { listWorkspaceMembersFn, type WorkspaceMember } from "@/lib/legalpak/workspaces";
import { listComplianceObligationsFn, type ComplianceObligationWithCompany } from "@/lib/legalpak/compliance-obligations";
import { listDocumentsFn, type DocumentWithLink } from "@/lib/legalpak/documents";
import {
  assignTaskFn,
  changeTaskDueDateFn,
  changeTaskStatusFn,
  deleteTaskFn,
  getTaskFn,
  isTaskOverdue,
  linkTaskFn,
  updateTaskFn,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABEL,
  TASK_STATUSES,
  TASK_STATUS_LABEL,
  type TaskWithDetails,
} from "@/lib/legalpak/tasks";

export const Route = createFileRoute("/tasks_/$taskId")({
  component: TaskPage,
  head: () => ({
    meta: [{ title: "Task — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function TaskPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return (
    <RequireSubscription>
      <TaskBody />
    </RequireSubscription>
  );
}

function TaskBody() {
  const { taskId } = useParams({ from: "/tasks_/$taskId" });
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{ title: string; description: string; priority: TaskWithDetails["priority"] } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dueDateDraft, setDueDateDraft] = useState("");

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [obligations, setObligations] = useState<ComplianceObligationWithCompany[]>([]);
  const [documents, setDocuments] = useState<DocumentWithLink[]>([]);

  async function refresh() {
    setLoading(true);
    try {
      const t = await getTaskFn({ data: taskId });
      setTask(t);
      setDueDateDraft(t.due_date ?? "");
      const [memberRows, obligationRows, documentRows] = await Promise.all([
        listWorkspaceMembersFn({ data: t.workspace_id }),
        listComplianceObligationsFn({ data: t.workspace_id }),
        listDocumentsFn({ data: { companyId: t.company_id } }),
      ]);
      setMembers(memberRows);
      setObligations(obligationRows.filter((o) => o.company_id === t.company_id));
      setDocuments(documentRows);
    } catch {
      toast.error("Could not load this task");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  function startEdit() {
    if (!task) return;
    setDraft({ title: task.title, description: task.description, priority: task.priority });
    setEditing(true);
  }

  async function saveEdit() {
    if (!task || !draft) return;
    setSavingEdit(true);
    try {
      const updated = await updateTaskFn({
        data: { taskId: task.id, title: draft.title, description: draft.description, priority: draft.priority },
      });
      setTask((t) => (t ? { ...t, ...updated } : t));
      setEditing(false);
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save changes");
    } finally {
      setSavingEdit(false);
    }
  }

  async function changeStatus(status: (typeof TASK_STATUSES)[number]) {
    if (!task) return;
    setBusy(true);
    try {
      const updated = await changeTaskStatusFn({ data: { taskId: task.id, status } });
      setTask((t) => (t ? { ...t, ...updated } : t));
      toast.success(`Marked ${TASK_STATUS_LABEL[status].toLowerCase()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change status");
    } finally {
      setBusy(false);
    }
  }

  async function saveDueDate() {
    if (!task) return;
    setBusy(true);
    try {
      const updated = await changeTaskDueDateFn({ data: { taskId: task.id, dueDate: dueDateDraft || null } });
      setTask((t) => (t ? { ...t, ...updated } : t));
      toast.success("Due date updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change the due date");
    } finally {
      setBusy(false);
    }
  }

  async function changeAssignee(assigneeId: string) {
    if (!task) return;
    setBusy(true);
    try {
      const updated = await assignTaskFn({ data: { taskId: task.id, assigneeId: assigneeId || null } });
      setTask((t) => (t ? { ...t, ...updated } : t));
      toast.success("Assignee updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change the assignee");
    } finally {
      setBusy(false);
    }
  }

  async function changeObligation(obligationId: string) {
    if (!task) return;
    setBusy(true);
    try {
      const updated = await linkTaskFn({ data: { taskId: task.id, obligationId: obligationId || null, documentId: task.document_id } });
      setTask((t) => (t ? { ...t, ...updated } : t));
      toast.success("Related compliance item updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the related compliance item");
    } finally {
      setBusy(false);
    }
  }

  async function changeDocument(documentId: string) {
    if (!task) return;
    setBusy(true);
    try {
      const updated = await linkTaskFn({ data: { taskId: task.id, obligationId: task.obligation_id, documentId: documentId || null } });
      setTask((t) => (t ? { ...t, ...updated } : t));
      toast.success("Related document updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the related document");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!task) return;
    if (!window.confirm("Delete this task? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deleteTaskFn({ data: task.id });
      toast.success("Task deleted");
      navigate({ to: "/tasks" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete this task");
      setDeleting(false);
    }
  }

  if (loading) return null;
  if (!task) return <p className="text-sm text-muted">Task not found.</p>;

  const overdue = isTaskOverdue(task);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/companies/$companyId"
          params={{ companyId: task.company_id }}
          className="text-xs font-medium uppercase tracking-widest text-muted underline"
        >
          ← {task.company_name}
        </Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-3xl">{task.title}</h1>
          <div className="flex items-center gap-2">
            <TaskPriorityBadge priority={task.priority} />
            <TaskStatusBadge status={task.status} overdue={overdue} />
          </div>
        </div>
        <p className="mt-1 text-sm text-muted">
          {task.assignee_name || task.assignee_email ? `Assigned to ${task.assignee_name ?? task.assignee_email}` : "Unassigned"}
          {task.obligation_title ? ` · Linked to ${task.obligation_title}` : ""}
        </p>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Details</h2>
          {!editing && (
            <Button type="button" variant="ghost" onClick={startEdit}>
              Edit
            </Button>
          )}
        </div>

        {editing && draft ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2">
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="Priority">
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as typeof draft.priority })}>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {TASK_PRIORITY_LABEL[p]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="button" disabled={savingEdit} onClick={saveEdit}>
                {savingEdit ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Description</dt>
              <dd className="mt-0.5 text-sm">{task.description || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Completed</dt>
              <dd className="mt-0.5 text-sm">{task.completed_at ? new Date(task.completed_at).toLocaleDateString("en-GB") : "—"}</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-xl">Assignment &amp; status</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Assignee">
            <Select value={task.assignee_id ?? ""} disabled={busy} onChange={(e) => changeAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name || m.email}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end gap-2">
            <Field label="Due date" className="flex-1">
              <Input type="date" value={dueDateDraft} onChange={(e) => setDueDateDraft(e.target.value)} />
            </Field>
            <Button type="button" variant="secondary" disabled={busy} onClick={saveDueDate}>
              Set
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Field label="Status">
            <Select value={task.status} disabled={busy} onChange={(e) => changeStatus(e.target.value as (typeof TASK_STATUSES)[number])}>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
          {task.status !== "in_progress" && task.status !== "done" && (
            <Button type="button" variant="secondary" disabled={busy} onClick={() => changeStatus("in_progress")}>
              <PlayCircle className="size-4" strokeWidth={1.75} />
              Start
            </Button>
          )}
          {task.status !== "blocked" && task.status !== "done" && (
            <Button type="button" variant="secondary" disabled={busy} onClick={() => changeStatus("blocked")}>
              <Ban className="size-4" strokeWidth={1.75} />
              Mark blocked
            </Button>
          )}
          {task.status !== "done" && (
            <Button type="button" disabled={busy} onClick={() => changeStatus("done")}>
              <CheckCircle2 className="size-4" strokeWidth={1.75} />
              Mark completed
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-xl">Related to</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Compliance item">
            <Select value={task.obligation_id ?? ""} disabled={busy} onChange={(e) => changeObligation(e.target.value)}>
              <option value="">None</option>
              {obligations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Document">
            <Select value={task.document_id ?? ""} disabled={busy} onChange={(e) => changeDocument(e.target.value)}>
              <option value="">None</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <TaskSteps taskId={task.id} />
      <TaskComments taskId={task.id} />
      <ActivityTimeline taskId={task.id} />

      <div className="flex justify-end">
        <Button type="button" variant="ghost" disabled={deleting} onClick={remove} className="text-danger">
          <Trash2 className="size-4" strokeWidth={1.75} />
          Delete task
        </Button>
      </div>
    </div>
  );
}
