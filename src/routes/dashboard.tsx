import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CalendarClock,
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
import { useCompanyContext } from "@/lib/legalpak/company-context";
import { CompanyHealthDashboard } from "@/components/compliance/company-health-dashboard";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

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
  const [workspaceName, setWorkspaceName] = useState("");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  // Dashboard always focuses on one company's health — default to the first
  // one when the header switcher is set to "All companies" (selectedCompanyId
  // === null) rather than rendering an aggregate view this page isn't built for.
  const primaryCompany = selectedCompany ?? companies[0] ?? null;

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
          {/* Company Health — score, next actions, breakdown, recent activity */}
          {primaryCompany && (
            <CompanyHealthDashboard
              workspaceId={workspace.id}
              company={primaryCompany}
              companies={companies}
              onSelectCompany={setSelectedCompanyId}
            />
          )}


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
