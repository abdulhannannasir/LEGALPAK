import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ListTodo, Plus } from "lucide-react";
import { RequireSubscription } from "@/components/billing/RequireSubscription";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listWorkspacesFn, type Workspace } from "@/lib/legalpak/workspaces";
import { listCompaniesFn, type Company } from "@/lib/legalpak/companies";
import { useCompanyContext } from "@/lib/legalpak/company-context";
import { listWorkspaceTasksFn, isTaskOverdue, TASK_STATUSES, TASK_STATUS_LABEL, type TaskWithDetails } from "@/lib/legalpak/tasks";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { NewTaskForm } from "@/components/tasks/new-task-form";
import { TaskList } from "@/components/tasks/task-list";
import { StatTile } from "@/components/company-health-widgets";

export const Route = createFileRoute("/tasks")({
  component: () => (
    <RequireSubscription>
      <TasksPage />
    </RequireSubscription>
  ),
  head: () => ({
    meta: [
      { title: "Tasks — LegalPak" },
      {
        name: "description",
        content: "Every filing and compliance task across your companies as an assignable, trackable workflow — assignee, due date, priority, checklist, comments and activity history.",
      },
    ],
  }),
});

type StatusFilter = "all" | (typeof TASK_STATUSES)[number] | "overdue";

function TasksPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <TasksBody userId={user.id} />;
}

function TasksBody({ userId }: { userId: string }) {
  const { selectedCompanyId } = useCompanyContext();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tasks, setTasks] = useState<TaskWithDetails[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "mine">("all");
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    setCompanyFilter(selectedCompanyId ?? "all");
  }, [selectedCompanyId]);

  useEffect(() => {
    listWorkspacesFn()
      .then((rows) => setWorkspace(rows[0] ?? null))
      .catch(() => setWorkspace(null));
  }, []);

  function loadTasks() {
    if (!workspace) return;
    setLoadError(false);
    Promise.all([listWorkspaceTasksFn({ data: workspace.id }), listCompaniesFn({ data: workspace.id })])
      .then(([taskRows, companyRows]) => {
        setTasks(taskRows);
        setCompanies(companyRows);
      })
      .catch(() => {
        setLoadError(true);
        toast.error("Could not load tasks");
      });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the workspace id changes
  useEffect(loadTasks, [workspace?.id]);

  const companyOptions = useMemo<[string, string][]>(() => companies.map((c) => [c.id, c.name]), [companies]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { overdue: 0, todo: 0, in_progress: 0, blocked: 0, done: 0 };
    for (const t of tasks ?? []) {
      if (isTaskOverdue(t)) c.overdue += 1;
      c[t.status] += 1;
    }
    return c;
  }, [tasks]);

  const filtered = useMemo(() => {
    let rows = tasks ?? [];
    if (companyFilter !== "all") rows = rows.filter((t) => t.company_id === companyFilter);
    if (assigneeFilter === "mine") rows = rows.filter((t) => t.assignee_id === userId);
    if (statusFilter === "overdue") rows = rows.filter((t) => isTaskOverdue(t));
    else if (statusFilter !== "all") rows = rows.filter((t) => t.status === statusFilter);
    return rows;
  }, [tasks, companyFilter, assigneeFilter, statusFilter, userId]);

  if (workspace === null && tasks === null) return null;

  if (!workspace) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-3xl">Tasks</h1>
        <p className="text-sm text-muted">
          Create a workspace on the{" "}
          <Link to="/dashboard" className="underline">
            dashboard
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">{workspace.name}</p>
          <h1 className="font-display text-3xl">Tasks</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Turn a filing or compliance obligation into a workflow — assignee, due date, priority, a checklist, comments
            and a full activity history, instead of just a static record.
          </p>
        </div>
        <Button type="button" onClick={() => setShowNewForm((v) => !v)}>
          <Plus className="size-4" strokeWidth={1.75} />
          New task
        </Button>
      </div>

      {showNewForm && (
        <NewTaskForm
          workspaceId={workspace.id}
          companies={companyOptions}
          defaultCompanyId={selectedCompanyId}
          onCreated={() => {
            setShowNewForm(false);
            loadTasks();
          }}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile label="Overdue" value={counts.overdue} tone="danger" icon={ListTodo} />
        <StatTile label="To do" value={counts.todo} tone="warn" icon={ListTodo} />
        <StatTile label="In progress" value={counts.in_progress} tone="warn" icon={ListTodo} />
        <StatTile label="Blocked" value={counts.blocked} tone="warn" icon={ListTodo} />
        <StatTile label="Done" value={counts.done} tone="success" icon={ListTodo} />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Company">
          <Select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
            <option value="all">All companies</option>
            {companyOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
            <option value="all">All statuses</option>
            <option value="overdue">Overdue</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Assignee">
          <Select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value as "all" | "mine")}>
            <option value="all">Everyone</option>
            <option value="mine">Assigned to me</option>
          </Select>
        </Field>
      </div>

      {tasks === null && loadError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-danger bg-flag-high px-4 py-3 text-sm text-danger">
          <span>Could not load tasks.</span>
          <button type="button" onClick={loadTasks} className="font-medium underline">
            Try again
          </button>
        </div>
      ) : tasks === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-border py-10 text-center">
          <ListTodo className="size-8 text-muted" strokeWidth={1.5} />
          <p className="text-sm font-medium">No tasks yet</p>
          <p className="max-w-sm text-xs text-muted">
            Create one from a template — Gather info → Prepare filing → Approval → Upload → Submit — or start blank.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">Nothing matches these filters.</p>
      ) : (
        <TaskList tasks={filtered} />
      )}
    </div>
  );
}
