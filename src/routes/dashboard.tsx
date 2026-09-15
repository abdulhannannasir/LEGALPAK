import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  FolderOpen,
  Landmark,
  MessageCircle,
  Plus,
  Rocket,
  Scale,
  Send,
} from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listWorkspacesFn, createWorkspaceFn, type Workspace } from "@/lib/legalpak/workspaces";
import { listCompaniesFn, type Company } from "@/lib/legalpak/companies";
import { listWorkspaceMattersFn, type MatterWithCompany } from "@/lib/legalpak/matters";
import { MATTER_TYPE_LABEL } from "@/lib/legalpak/workflow";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { formatDateLong } from "@/lib/legal/accounts";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: "Dashboard — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

type Urgency = "overdue" | "soon" | "upcoming" | "none" | "done";

function urgencyOf(m: MatterWithCompany): Urgency {
  if (m.status === "closed") return "done";
  if (!m.due_date) return "none";
  const today = new Date().toISOString().slice(0, 10);
  const soonCutoff = new Date();
  soonCutoff.setDate(soonCutoff.getDate() + 7);
  const soon = soonCutoff.toISOString().slice(0, 10);
  if (m.due_date < today) return "overdue";
  if (m.due_date <= soon) return "soon";
  return "upcoming";
}

const QUICK_ACTIONS = [
  { to: "/contracts", label: "Create Contract", icon: Scale },
  { to: "/incorporation", label: "SECP Filing", icon: Rocket },
  { to: "/notices", label: "Legal Notice", icon: Send },
  { to: "/compliance", label: "Compliance Task", icon: CalendarClock },
] as const;

const TOOLS = [
  { to: "/incorporation", label: "Incorporation", icon: Rocket },
  { to: "/corporate-filings", label: "SECP Filings", icon: FileText },
  { to: "/contracts", label: "Contracts", icon: Scale },
  { to: "/tax-assistant", label: "Tax", icon: Landmark },
  { to: "/compliance", label: "Compliance", icon: CalendarClock },
  { to: "/documents", label: "Documents", icon: FolderOpen },
  { to: "/notices", label: "Legal Notices", icon: Send },
  { to: "/guide", label: "Filing Guide", icon: BookOpen },
  { to: "/citizen", label: "LegalPak Intelligence", icon: MessageCircle },
] as const;

function DashboardPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <DashboardBody displayName={user.displayName} />;
}

function DashboardBody({ displayName }: { displayName: string | null }) {
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [matters, setMatters] = useState<MatterWithCompany[] | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
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
      .then((rows) => {
        setCompanies(rows);
        setSelectedCompanyId((prev) => prev ?? rows[0]?.id ?? null);
      })
      .catch(() => toast.error("Could not load companies"))
      .finally(() => setLoadingCompanies(false));
    listWorkspaceMattersFn({ data: workspace.id })
      .then(setMatters)
      .catch(() => setMatters([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the workspace id changes
  }, [workspace?.id]);

  const counts = useMemo(() => {
    const c = { compliant: 0, soon: 0, overdue: 0 };
    for (const m of matters ?? []) {
      const u = urgencyOf(m);
      if (u === "overdue") c.overdue += 1;
      else if (u === "soon") c.soon += 1;
      else c.compliant += 1;
    }
    return c;
  }, [matters]);

  const attention = useMemo(() => {
    if (!matters) return [];
    const rank: Record<Urgency, number> = { overdue: 0, soon: 1, upcoming: 2, none: 3, done: 4 };
    return [...matters]
      .filter((m) => m.status !== "closed")
      .sort((a, b) => rank[urgencyOf(a)] - rank[urgencyOf(b)])
      .slice(0, 3);
  }, [matters]);

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

  const primaryCompany = companies.find((c) => c.id === selectedCompanyId) ?? companies[0] ?? null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">{workspace.name}</p>
          <h1 className="font-display text-3xl">
            {greeting()}
            {displayName ? `, ${displayName.split(" ")[0]}` : ""}
          </h1>
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
        <>
          {companies.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {companies.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCompanyId(c.id)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                    c.id === primaryCompany?.id
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border bg-surface text-muted hover:text-fg"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {primaryCompany && (
            <Link
              to="/companies/$companyId"
              params={{ companyId: primaryCompany.id }}
              className="block rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-colors hover:border-accent"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl">{primaryCompany.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {primaryCompany.cuin ? `CUIN ${primaryCompany.cuin}` : "No CUIN on file"}
                    {primaryCompany.ntn ? ` · NTN ${primaryCompany.ntn}` : ""}
                    {primaryCompany.company_type ? ` · ${primaryCompany.company_type}` : ""}
                  </p>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
                  {primaryCompany.incorporation_date
                    ? `Incorporated ${formatDateLong(primaryCompany.incorporation_date)}`
                    : "Setup in progress"}
                </span>
              </div>
            </Link>
          )}

          <section>
            <h2 className="font-display text-xl">Compliance Health</h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <StatTile label="Compliant" value={counts.compliant} tone="success" icon={CheckCircle2} />
              <StatTile label="Due soon" value={counts.soon} tone="warn" icon={Clock} />
              <StatTile label="Overdue" value={counts.overdue} tone="danger" icon={AlertTriangle} />
            </div>
            <Link to="/compliance" className="mt-2 inline-block text-sm text-accent underline">
              View full compliance calendar
            </Link>
          </section>

          <section>
            <h2 className="font-display text-xl">Attention Required</h2>
            {matters === null ? (
              <p className="mt-3 text-sm text-muted">Loading…</p>
            ) : attention.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Nothing urgent — everything open is on track.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {attention.map((m) => {
                  const u = urgencyOf(m);
                  return (
                    <Link
                      key={m.id}
                      to="/matters/$matterId"
                      params={{ matterId: m.id }}
                      className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 hover:border-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{m.title}</p>
                        <p className="text-xs text-muted">
                          {m.company_name} · {MATTER_TYPE_LABEL[m.type]}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
                          u === "overdue"
                            ? "border-danger text-danger"
                            : u === "soon"
                              ? "border-warn text-warn"
                              : "border-border text-muted"
                        }`}
                      >
                        {m.due_date ? formatDateLong(m.due_date) : "No due date"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-xl">Quick Actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.to}
                    to={a.to}
                    className="flex flex-col items-start gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-4 hover:border-accent"
                  >
                    <Icon className="size-5 text-accent" strokeWidth={1.75} />
                    <span className="text-sm font-medium">{a.label}</span>
                  </Link>
                );
              })}
              {primaryCompany && (
                <Link
                  to="/companies/$companyId"
                  params={{ companyId: primaryCompany.id }}
                  className="flex flex-col items-start gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-4 hover:border-accent"
                >
                  <FolderOpen className="size-5 text-accent" strokeWidth={1.75} />
                  <span className="text-sm font-medium">Upload Document</span>
                </Link>
              )}
            </div>
          </section>
        </>
      )}

      <section>
        <h2 className="font-display text-xl">Tools</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="flex flex-col items-start gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-4 hover:border-accent"
              >
                <Icon className="size-5 text-accent" strokeWidth={1.75} />
                <span className="text-sm font-medium">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: "danger" | "warn" | "success";
  icon: typeof AlertTriangle;
}) {
  const toneClass = { danger: "text-danger", warn: "text-warn", success: "text-success" }[tone];
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <Icon className={`size-4 ${toneClass}`} strokeWidth={1.75} />
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-0.5 font-display text-2xl ${toneClass}`}>{value}</p>
    </div>
  );
}
