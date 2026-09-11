import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Plus } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listWorkspacesFn, createWorkspaceFn, type Workspace } from "@/lib/legalpak/workspaces";
import { listCompaniesFn, type Company } from "@/lib/legalpak/companies";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: "Dashboard — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function DashboardPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <DashboardBody />;
}

function DashboardBody() {
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [workspaceName, setWorkspaceName] = useState("");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  async function refreshWorkspaces() {
    const rows = await listWorkspacesFn();
    setWorkspaces(rows);
    return rows;
  }

  useEffect(() => {
    refreshWorkspaces().catch(() => setWorkspaces([]));
  }, []);

  const workspace = workspaces?.[0] ?? null;

  useEffect(() => {
    if (!workspace) return;
    setLoadingCompanies(true);
    listCompaniesFn({ data: workspace.id })
      .then(setCompanies)
      .catch(() => toast.error("Could not load companies"))
      .finally(() => setLoadingCompanies(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the workspace id changes, not on every refetch of the workspaces list
  }, [workspace?.id]);

  if (workspaces === null) return null;

  if (!workspace) {
    async function createWorkspace(e: React.FormEvent) {
      e.preventDefault();
      if (!workspaceName.trim()) return;
      setCreatingWorkspace(true);
      try {
        await createWorkspaceFn({ data: workspaceName.trim() });
        await refreshWorkspaces();
        toast.success("Workspace created");
      } catch {
        toast.error("Could not create workspace");
      } finally {
        setCreatingWorkspace(false);
      }
    }
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">Welcome to LegalPak</p>
          <h1 className="font-display text-3xl">Create your workspace</h1>
          <p className="mt-2 text-sm text-muted">
            A workspace holds your companies, matters, and compliance records — you can invite colleagues to
            it later.
          </p>
        </div>
        <form
          onSubmit={createWorkspace}
          className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5"
        >
          <Field label="Firm / company name">
            <Input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g. Horizon Legal Advisors"
              required
            />
          </Field>
          <Button type="submit" disabled={creatingWorkspace} className="w-full">
            {creatingWorkspace ? "Creating…" : "Create workspace"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">{workspace.name}</p>
          <h1 className="font-display text-3xl">Companies</h1>
        </div>
        <Link
          to="/companies/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-accent"
        >
          <Plus className="size-4" strokeWidth={1.75} />
          New company
        </Link>
      </div>

      {loadingCompanies ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : companies.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center">
          <Building2 className="mx-auto size-6 text-muted" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-muted">
            No companies yet. Add one to start creating matters — Financial Statements, Form A, Form 9, or a
            contract.
          </p>
          <Link
            to="/companies/new"
            className="mt-4 inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-primary px-4 text-sm font-medium text-primary-fg"
          >
            Add your first company
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {companies.map((c) => (
            <Link
              key={c.id}
              to="/companies/$companyId"
              params={{ companyId: c.id }}
              className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-colors hover:border-accent"
            >
              <Building2 className="size-5 text-accent" strokeWidth={1.75} />
              <h2 className="mt-3 font-display text-xl">{c.name}</h2>
              <p className="mt-1 text-sm text-muted">{c.cuin ? `CUIN ${c.cuin}` : "No CUIN on file"}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
