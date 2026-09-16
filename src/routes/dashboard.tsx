import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  FileSignature,
  FolderOpen,
  FolderUp,
  Landmark,
  MessageCircle,
  Plus,
  Rocket,
  Scale,
  Send,
} from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { createWorkspaceFn } from "@/lib/legalpak/workspaces";
import { registrationStatus } from "@/lib/legalpak/companies";
import { useCompanyContext } from "@/lib/legalpak/company-context";
import { listWorkspaceMattersFn, type MatterWithCompany } from "@/lib/legalpak/matters";
import { listWorkspaceActivityFn, type WorkspaceAuditLogRow } from "@/lib/legalpak/audit";
import { describeAuditRow, formatAuditTimestamp } from "@/components/activity-timeline";
import { MATTER_TYPE_LABEL } from "@/lib/legalpak/workflow";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { formatDateLong } from "@/lib/legal/accounts";
import { cn } from "@/lib/cn";
import { EmptyState, ScoreRing, SkeletonRows, StatTile } from "@/components/company-health-widgets";

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
  { to: "/companies/$companyId", label: "Company", icon: Building2, description: "Profile, matters & filings" },
  { to: "/secp", label: "SECP", icon: FileSignature, description: "Incorporation, filings & share changes" },
  { to: "/contracts", label: "Contracts", icon: Scale, description: "Draft binding agreements" },
  { to: "/compliance", label: "Compliance", icon: CalendarClock, description: "Full deadline calendar" },
  { to: "/tax", label: "Tax", icon: Landmark, description: "FBR income tax assistant" },
  { to: "/documents", label: "Documents", icon: FolderOpen, description: "Workspace document vault" },
  { to: "/ai-counsel", label: "AI Counsel", icon: MessageCircle, description: "Compliance guidance & chat" },
] as const;

function DashboardPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <DashboardBody displayName={user.displayName} />;
}

function DashboardBody({ displayName }: { displayName: string | null }) {
  const {
    workspace,
    companies,
    loading: loadingCompanies,
    selectedCompany,
    setSelectedCompanyId,
    refreshWorkspace,
  } = useCompanyContext();
  const [matters, setMatters] = useState<MatterWithCompany[] | null>(null);
  const [activity, setActivity] = useState<WorkspaceAuditLogRow[] | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    listWorkspaceMattersFn({ data: workspace.id })
      .then(setMatters)
      .catch(() => setMatters([]));
    listWorkspaceActivityFn({ data: workspace.id })
      .then(setActivity)
      .catch(() => setActivity([]));
  }, [workspace]);

  // Dashboard always focuses on one company's health — default to the first
  // one when the header switcher is set to "All companies" (selectedCompanyId
  // === null) rather than rendering an aggregate view this page isn't built for.
  const primaryCompany = selectedCompany ?? companies[0] ?? null;

  const companyMatters = useMemo(() => {
    if (!matters || !primaryCompany) return [];
    return matters.filter((m) => m.company_id === primaryCompany.id);
  }, [matters, primaryCompany]);

  const health = useMemo(() => {
    const total = companyMatters.length;
    const completed = companyMatters.filter((m) => m.status === "closed").length;
    const overdue = companyMatters.filter((m) => urgencyOf(m) === "overdue").length;
    const upcoming = companyMatters.filter((m) => {
      const u = urgencyOf(m);
      return u === "soon" || u === "upcoming";
    }).length;
    const score = total === 0 ? null : Math.round(((total - overdue) / total) * 100);
    return { total, completed, overdue, upcoming, score };
  }, [companyMatters]);

  const attention = useMemo(() => {
    const rank: Record<Urgency, number> = { overdue: 0, soon: 1, upcoming: 2, none: 3, done: 4 };
    return [...companyMatters]
      .filter((m) => m.status !== "closed")
      .sort((a, b) => rank[urgencyOf(a)] - rank[urgencyOf(b)])
      .slice(0, 3);
  }, [companyMatters]);

  if (workspace === undefined) return null;

  if (!workspace) {
    async function createWorkspace(e: React.FormEvent) {
      e.preventDefault();
      if (!workspaceName.trim()) return;
      setCreatingWorkspace(true);
      try {
        await createWorkspaceFn({ data: workspaceName.trim() });
        refreshWorkspace();
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

  const firstName = displayName?.split(" ")[0];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">{workspace.name}</p>
          <h1 className="font-display text-3xl sm:text-4xl">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted">Here's where things stand across your companies today.</p>
        </div>
        <Link
          to="/companies/new"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-accent"
        >
          <Plus className="size-4" strokeWidth={1.75} />
          New company
        </Link>
      </div>

      {loadingCompanies ? (
        <DashboardSkeleton />
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
          {/* Company selector */}
          {companies.length > 1 && (
            <div className="-mx-1 flex flex-wrap gap-2 px-1">
              {companies.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCompanyId(c.id)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    c.id === primaryCompany?.id
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border bg-surface text-muted hover:text-fg",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Company summary */}
          {primaryCompany && (
            <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted">Company summary</p>
                  <h2 className="mt-1 truncate font-display text-2xl">{primaryCompany.name}</h2>
                </div>
                <Link
                  to="/companies/$companyId"
                  params={{ companyId: primaryCompany.id }}
                  className="inline-flex min-h-9 shrink-0 items-center rounded-[var(--radius-sm)] border border-border px-3 text-sm font-medium text-muted hover:border-accent hover:text-fg"
                >
                  View company →
                </Link>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
                <SummaryField label="Company name" value={primaryCompany.name} />
                <SummaryField label="CUIN" value={primaryCompany.cuin || "Not on file"} muted={!primaryCompany.cuin} />
                <SummaryField label="NTN" value={primaryCompany.ntn || "Not on file"} muted={!primaryCompany.ntn} />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Status</dt>
                  <dd className="mt-0.5">
                    <StatusPill {...registrationStatus(primaryCompany)} />
                  </dd>
                </div>
              </dl>
            </section>
          )}

          {/* Compliance Health */}
          <section>
            <SectionHeading
              title="Compliance Health"
              action={{ to: "/compliance", label: "View full compliance calendar" }}
            />
            {health.total === 0 ? (
              <EmptyState
                className="mt-3"
                text="No compliance matters tracked for this company yet. Start one from the company page."
              />
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                  <ScoreRing score={health.score ?? 0} />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">Score</p>
                    <p className="font-display text-2xl">{health.score}</p>
                  </div>
                </div>
                <StatTile label="Overdue" value={health.overdue} tone="danger" icon={AlertTriangle} />
                <StatTile label="Upcoming" value={health.upcoming} tone="warn" icon={Clock} />
                <StatTile label="Completed" value={health.completed} tone="success" icon={CheckCircle2} />
              </div>
            )}
          </section>

          {/* Attention Required */}
          <section>
            <SectionHeading title="Attention Required" />
            {matters === null ? (
              <SkeletonRows className="mt-3" count={2} />
            ) : attention.length === 0 ? (
              <EmptyState className="mt-3" text="Nothing urgent — everything open for this company is on track." />
            ) : (
              <div className="mt-3 space-y-2">
                {attention.map((m) => {
                  const u = urgencyOf(m);
                  return (
                    <Link
                      key={m.id}
                      to="/matters/$matterId"
                      params={{ matterId: m.id }}
                      className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 hover:border-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{m.title}</p>
                        <p className="text-xs text-muted">
                          {m.company_name} · {MATTER_TYPE_LABEL[m.type]}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                          u === "overdue"
                            ? "border-danger text-danger"
                            : u === "soon"
                              ? "border-warn text-warn"
                              : "border-border text-muted",
                        )}
                      >
                        {m.due_date ? formatDateLong(m.due_date) : "No due date"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section>
            <SectionHeading title="Quick Actions" />
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.to}
                    to={a.to}
                    className="flex flex-col items-start gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-4 transition-colors hover:border-accent hover:shadow-sm"
                  >
                    <Icon className="size-5 text-accent" strokeWidth={1.75} />
                    <span className="text-sm font-medium">{a.label}</span>
                  </Link>
                );
              })}
              {primaryCompany ? (
                <Link
                  to="/companies/$companyId"
                  params={{ companyId: primaryCompany.id }}
                  className="flex flex-col items-start gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-4 transition-colors hover:border-accent hover:shadow-sm"
                >
                  <FolderUp className="size-5 text-accent" strokeWidth={1.75} />
                  <span className="text-sm font-medium">Upload Document</span>
                </Link>
              ) : (
                <Link
                  to="/companies/new"
                  className="flex flex-col items-start gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-4 transition-colors hover:border-accent hover:shadow-sm"
                >
                  <FolderUp className="size-5 text-accent" strokeWidth={1.75} />
                  <span className="text-sm font-medium">Upload Document</span>
                </Link>
              )}
            </div>
          </section>
        </>
      )}

      {/* Tool Cards */}
      <section>
        <SectionHeading title="Tools" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const body = (
              <>
                <Icon className="size-5 text-accent" strokeWidth={1.75} />
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs text-muted">{t.description}</span>
              </>
            );
            const cardClass =
              "flex flex-col items-start gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-4 transition-colors hover:border-accent hover:shadow-sm";
            if (t.to === "/companies/$companyId") {
              return primaryCompany ? (
                <Link key={t.label} to="/companies/$companyId" params={{ companyId: primaryCompany.id }} className={cardClass}>
                  {body}
                </Link>
              ) : (
                <Link key={t.label} to="/companies/new" className={cardClass}>
                  {body}
                </Link>
              );
            }
            return (
              <Link key={t.label} to={t.to} className={cardClass}>
                {body}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <SectionHeading title="Recent Activity" />
        {activity === null ? (
          <SkeletonRows className="mt-3" count={4} />
        ) : activity.length === 0 ? (
          <EmptyState className="mt-3" text="No activity recorded yet — actions across your workspace will show up here." />
        ) : (
          <ol className="mt-3 space-y-3 border-l border-border pl-4">
            {activity.map((row) => (
              <li key={row.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-accent" />
                <p className="text-sm font-medium">{describeAuditRow(row)}</p>
                <p className="text-xs text-muted">
                  {formatAuditTimestamp(row.created_at)}
                  {row.company_name ? ` · ${row.company_name}` : ""}
                  {row.user_name || row.user_email ? ` · ${row.user_name ?? row.user_email}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: { to: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 className="font-display text-xl">{title}</h2>
      {action && (
        <Link to={action.to} className="text-sm text-accent underline underline-offset-2">
          {action.label}
        </Link>
      )}
    </div>
  );
}

function SummaryField({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className={cn("mt-0.5 truncate text-sm font-medium", muted && "text-muted")}>{value}</dd>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "success" | "warn" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tone === "success" ? "border-success text-success" : "border-warn text-warn",
      )}
    >
      <Circle className="size-1.5 fill-current" strokeWidth={0} />
      {label}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-24 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}
