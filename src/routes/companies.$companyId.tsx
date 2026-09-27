import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Landmark,
  Pencil,
  Plus,
  Scale,
  Settings as SettingsIcon,
  Users,
} from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getCompanyFn, registrationStatus, COMPANY_TYPE_LABEL, type Company } from "@/lib/legalpak/companies";
import { listMattersFn, createMatterFn, type Matter } from "@/lib/legalpak/matters";
import { MATTER_TYPE_LABEL, STATUS_LABEL, type MatterType } from "@/lib/legalpak/workflow";
import { deriveCompliance, listComplianceItemsFn, type ComplianceItem } from "@/lib/legalpak/compliance";
import { listDocumentsFn, type Document } from "@/lib/legalpak/documents";
import { listEmployeesFn, type EmployeeWithContract } from "@/lib/legalpak/employees";
import { EMPLOYMENT_TYPE_LABEL } from "@/lib/legal/punjab-employment-contract";
import { listCompanyActivityFn, type AuditLogRow } from "@/lib/legalpak/audit";
import { describeAuditRow, formatAuditTimestamp } from "@/components/activity-timeline";
import { Button } from "@/components/ui/button";
import { EmptyState, SkeletonRows, StatTile } from "@/components/company-health-widgets";
import { formatDateLong, pkr } from "@/lib/legal/accounts";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/companies/$companyId")({
  component: CompanyPage,
  head: () => ({
    meta: [{ title: "Company — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

const MATTER_KINDS: { type: MatterType; icon: typeof FileSpreadsheet }[] = [
  { type: "FINANCIAL_STATEMENTS", icon: FileSpreadsheet },
  { type: "FORM_A", icon: FileText },
  { type: "FORM_9", icon: Users },
  { type: "CONTRACT", icon: Scale },
  { type: "INCOME_TAX_RETURN", icon: Landmark },
];

function CompanyPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <CompanyBody />;
}

function CompanyBody() {
  const { companyId } = useParams({ from: "/companies/$companyId" });
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [documents, setDocuments] = useState<Document[] | null>(null);
  const [employees, setEmployees] = useState<EmployeeWithContract[] | null>(null);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[] | null>(null);
  const [activity, setActivity] = useState<AuditLogRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<MatterType | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const c = await getCompanyFn({ data: companyId });
      setCompany(c);
      const [m, docs, act, compliance, staff] = await Promise.all([
        listMattersFn({ data: companyId }),
        listDocumentsFn({ data: { companyId } }).catch(() => []),
        listCompanyActivityFn({ data: companyId }).catch(() => []),
        listComplianceItemsFn({ data: c.workspace_id }).catch(() => []),
        listEmployeesFn({ data: companyId }).catch(() => []),
      ]);
      setMatters(m);
      setDocuments(docs);
      setEmployees(staff);
      setActivity(act);
      setComplianceItems(compliance.filter((i) => i.company_id === companyId));
    } catch {
      toast.error("Could not load this company");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  async function newMatter(type: MatterType) {
    setCreating(type);
    try {
      const matter = await createMatterFn({
        data: { companyId, type, title: `${MATTER_TYPE_LABEL[type]} — ${company?.name ?? ""}` },
      });
      navigate({ to: "/matters/$matterId", params: { matterId: matter.id } });
    } catch {
      toast.error("Could not create matter");
    } finally {
      setCreating(null);
    }
  }

  const derived = useMemo(
    () => (complianceItems ?? []).map((item) => ({ item, health: deriveCompliance(item) })).filter((r) => r.health),
    [complianceItems],
  );

  const complianceHealth = useMemo(() => {
    const overdue = derived.filter((r) => r.health!.health === "overdue").length;
    const dueSoon = derived.filter((r) => r.health!.health === "due_soon").length;
    const upcoming = derived.filter((r) => r.health!.health === "upcoming").length;
    const completed = derived.filter((r) => r.health!.health === "completed").length;
    const unscheduled = derived.filter((r) => r.health!.health === "unscheduled").length;
    const tracked = overdue + dueSoon + upcoming + completed;
    const summary: { label: string; tone: "success" | "warn" | "danger" } =
      overdue > 0
        ? { label: "Overdue", tone: "danger" }
        : dueSoon > 0
          ? { label: "Needs attention", tone: "warn" }
          : tracked === 0
            ? { label: "Not set up", tone: "warn" }
            : { label: "Good", tone: "success" };
    return { overdue, dueSoon, upcoming, completed, unscheduled, summary, total: derived.length, tracked };
  }, [derived]);

  const upcomingDeadlines = useMemo(
    () =>
      derived
        .filter((r) => r.health!.health === "due_soon" || r.health!.health === "upcoming")
        .sort((a, b) => (a.health!.daysRemaining ?? 0) - (b.health!.daysRemaining ?? 0))
        .slice(0, 5),
    [derived],
  );

  const outstandingActions = useMemo(
    () => derived.filter((r) => r.health!.health === "overdue").slice(0, 5),
    [derived],
  );

  if (loading) return null;
  if (!company) return <p className="text-sm text-muted">Company not found.</p>;

  const reg = registrationStatus(company);
  const typeLabel =
    (company.company_type && COMPANY_TYPE_LABEL[company.company_type as keyof typeof COMPANY_TYPE_LABEL]) ||
    company.company_type;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/companies" className="text-xs font-medium uppercase tracking-widest text-muted underline">
          ← Companies
        </Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl">{company.name}</h1>
              {company.status === "archived" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-muted px-2.5 py-0.5 text-xs font-medium text-muted">
                  <Archive className="size-3" strokeWidth={1.75} />
                  Archived
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              {typeLabel ? `${typeLabel} · ` : ""}
              {company.cuin ? `CUIN ${company.cuin}` : "No CUIN on file"}
              {company.ntn ? ` · NTN ${company.ntn}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/companies/$companyId/employees"
              params={{ companyId }}
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm font-medium hover:border-accent"
            >
              <Users className="size-4" strokeWidth={1.75} />
              Employees
            </Link>
            <Link
              to="/companies/$companyId/edit"
              params={{ companyId }}
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm font-medium hover:border-accent"
            >
              <Pencil className="size-4" strokeWidth={1.75} />
              Edit
            </Link>
            <Link
              to="/companies/$companyId/settings"
              params={{ companyId }}
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm font-medium hover:border-accent"
            >
              <SettingsIcon className="size-4" strokeWidth={1.75} />
              Settings
            </Link>
          </div>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Registration status</dt>
            <dd className="mt-0.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  reg.tone === "success" ? "border-success text-success" : "border-warn text-warn",
                )}
              >
                {reg.label}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Paid-up capital</dt>
            <dd className="text-sm font-medium">
              {company.paid_up_capital ? pkr(Number(company.paid_up_capital)) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Financial year end</dt>
            <dd className="text-sm font-medium">
              {company.financial_year_end ? formatDateLong(company.financial_year_end) : "—"}
            </dd>
          </div>
          {company.registered_address && (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-muted">Registered address</dt>
              <dd className="text-sm font-medium">
                {company.registered_address}
                {company.city ? `, ${company.city}` : ""}
                {company.province ? `, ${company.province}` : ""}
              </dd>
            </div>
          )}
          {company.business_activity && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Business activity</dt>
              <dd className="text-sm font-medium">{company.business_activity}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Compliance Health */}
      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl">Compliance Health</h2>
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
              complianceHealth.summary.tone === "danger"
                ? "border-danger text-danger"
                : complianceHealth.summary.tone === "warn"
                  ? "border-warn text-warn"
                  : "border-success text-success",
            )}
          >
            {complianceHealth.summary.label}
          </span>
        </div>
        {complianceHealth.total === 0 ? (
          <EmptyState
            className="mt-3"
            text="No compliance obligations yet — start a Financial Statements, Form A, Form 9 or Income Tax matter below to track one."
          />
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Action Required" value={complianceHealth.overdue} tone="danger" icon={AlertTriangle} />
              <StatTile label="Due soon" value={complianceHealth.dueSoon} tone="warn" icon={Clock} />
              <StatTile label="Upcoming" value={complianceHealth.upcoming} tone="warn" icon={Clock} />
              <StatTile label="Completed" value={complianceHealth.completed} tone="success" icon={CheckCircle2} />
            </div>
            {complianceHealth.unscheduled > 0 && (
              <p className="mt-2 text-xs text-muted">
                + {complianceHealth.unscheduled} matter{complianceHealth.unscheduled === 1 ? "" : "s"} without a
                computed due date yet — fill in its draft to schedule it.
              </p>
            )}
          </>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Outstanding Actions */}
        <section>
          <h2 className="font-display text-xl">Outstanding Actions</h2>
          {outstandingActions.length === 0 ? (
            <EmptyState className="mt-3" text="Nothing overdue — this company is on track." />
          ) : (
            <div className="mt-3 space-y-2">
              {outstandingActions.map(({ item, health }) => (
                <Link
                  key={item.id}
                  to="/matters/$matterId"
                  params={{ matterId: item.id }}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-danger/40 bg-flag-high px-4 py-3 hover:border-danger"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted">{health!.requirement}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-danger">
                    {item.due_date ? formatDateLong(item.due_date) : "Overdue"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Deadlines */}
        <section>
          <h2 className="font-display text-xl">Upcoming Deadlines</h2>
          {upcomingDeadlines.length === 0 ? (
            <EmptyState className="mt-3" text="No upcoming deadlines on the calendar for this company." />
          ) : (
            <div className="mt-3 space-y-2">
              {upcomingDeadlines.map(({ item, health }) => (
                <Link
                  key={item.id}
                  to="/matters/$matterId"
                  params={{ matterId: item.id }}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 hover:border-accent"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted">{health!.requirement}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted">
                    {item.due_date ? formatDateLong(item.due_date) : "—"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl">Employees</h2>
          <Link
            to="/companies/$companyId/employees"
            params={{ companyId }}
            className="text-sm text-accent underline underline-offset-2"
          >
            {employees && employees.length > 0 ? "Manage employees →" : "Add employees →"}
          </Link>
        </div>
        {employees === null ? (
          <SkeletonRows className="mt-3" count={2} />
        ) : employees.length === 0 ? (
          <EmptyState
            className="mt-3"
            text="No employees on file. Add an employee to keep a staff register and generate a custom employment contract under the Punjab Labour Code 2026."
            cta={
              <Link
                to="/companies/$companyId/employees"
                params={{ companyId }}
                className="inline-flex min-h-9 items-center rounded-[var(--radius-sm)] border border-border px-3 text-sm font-medium hover:border-accent"
              >
                Add an employee
              </Link>
            }
          />
        ) : (
          <div className="mt-3 space-y-2">
            {employees
              .filter((e) => e.status === "active")
              .slice(0, 5)
              .map((e) => (
                <Link
                  key={e.id}
                  to="/companies/$companyId/employees/$employeeId"
                  params={{ companyId, employeeId: e.id }}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 hover:border-accent"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.full_name}</p>
                    <p className="text-xs text-muted">
                      {e.job_title} · {EMPLOYMENT_TYPE_LABEL[e.employment_type]}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                      e.contract_version !== null ? "border-success text-success" : "border-warn text-warn",
                    )}
                  >
                    {e.contract_version !== null ? `Contract v${e.contract_version}` : "No contract"}
                  </span>
                </Link>
              ))}
            <p className="text-xs text-muted">
              {employees.filter((e) => e.status === "active").length} active employee
              {employees.filter((e) => e.status === "active").length === 1 ? "" : "s"}
              {employees.some((e) => e.status === "active" && e.contract_version === null)
                ? ` · ${employees.filter((e) => e.status === "active" && e.contract_version === null).length} without a written contract`
                : ""}
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl">Start a matter</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MATTER_KINDS.map(({ type, icon: Icon }) => (
            <Button
              key={type}
              type="button"
              variant="secondary"
              disabled={creating !== null}
              onClick={() => newMatter(type)}
              className="h-auto flex-col items-start gap-2 whitespace-normal p-4 text-left"
            >
              <Icon className="size-5 text-accent" strokeWidth={1.75} />
              <span className="font-medium">
                {creating === type ? "Creating…" : MATTER_TYPE_LABEL[type]}
              </span>
              <Plus className="size-4 self-end text-muted" strokeWidth={1.75} />
            </Button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          Registered office changed, or need to declare beneficial owners?{" "}
          <Link to="/corporate-filings" className="text-accent underline">
            Form 21 & Form 45
          </Link>
          . Chasing a dishonoured cheque or overdue invoice?{" "}
          <Link to="/notices" className="text-accent underline">
            Legal Notices
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl">Matters</h2>
        {matters.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No matters yet — start one above.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {matters.map((m) => (
              <Link
                key={m.id}
                to="/matters/$matterId"
                params={{ matterId: m.id }}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 hover:border-accent"
              >
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted">
                    {MATTER_TYPE_LABEL[m.type]}
                    {m.due_date ? ` · due ${m.due_date}` : ""}
                  </p>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
                  {STATUS_LABEL[m.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Documents */}
        <section>
          <h2 className="font-display text-xl">Recent Documents</h2>
          {documents === null ? (
            <SkeletonRows className="mt-3" count={3} />
          ) : documents.length === 0 ? (
            <EmptyState
              className="mt-3"
              text="No documents yet."
              cta={
                <Link
                  to="/companies/$companyId/documents"
                  params={{ companyId }}
                  className="inline-flex min-h-9 items-center rounded-[var(--radius-sm)] border border-border px-3 text-sm font-medium hover:border-accent"
                >
                  Set up documents
                </Link>
              }
            />
          ) : (
            <div className="mt-3 space-y-2">
              {documents.slice(0, 5).map((d) => (
                <Link
                  key={d.id}
                  to="/companies/$companyId/documents"
                  params={{ companyId }}
                  className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 hover:border-accent"
                >
                  <FolderOpen className="size-4 shrink-0 text-accent" strokeWidth={1.75} />
                  <span className="truncate text-sm font-medium">{d.name}</span>
                </Link>
              ))}
              <Link
                to="/companies/$companyId/documents"
                params={{ companyId }}
                className="inline-block text-sm text-accent underline underline-offset-2"
              >
                View all {documents.length} document{documents.length === 1 ? "" : "s"} →
              </Link>
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="font-display text-xl">Recent Activity</h2>
          {activity === null ? (
            <SkeletonRows className="mt-3" count={3} />
          ) : activity.length === 0 ? (
            <EmptyState className="mt-3" text="No activity recorded yet for this company." />
          ) : (
            <ol className="mt-3 space-y-3 border-l border-border pl-4">
              {activity.slice(0, 6).map((row) => (
                <li key={row.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-accent" />
                  <p className="text-sm font-medium">{describeAuditRow(row)}</p>
                  <p className="text-xs text-muted">
                    {formatAuditTimestamp(row.created_at)}
                    {row.user_name || row.user_email ? ` · ${row.user_name ?? row.user_email}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
