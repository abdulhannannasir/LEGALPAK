import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AlertTriangle, Clock, FileSignature, Plus, Search, Users } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getCompanyFn, type Company } from "@/lib/legalpak/companies";
import { listEmployeesFn, type EmployeeWithContract } from "@/lib/legalpak/employees";
import {
  EMPLOYMENT_TYPE_LABEL,
  formatPKR,
  grossMonthly,
  isOnProbation,
} from "@/lib/legal/punjab-employment-contract";
import { formatShort, localTodayISO } from "@/lib/legal/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { EmptyState, SkeletonRows, StatTile } from "@/components/company-health-widgets";
import { EmployeeForm } from "@/components/employees/employee-form";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/companies/$companyId_/employees")({
  component: EmployeesPage,
  head: () => ({
    meta: [
      { title: "Employees — LegalPak" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content:
          "Your company's staff register — add employees with their particulars and generate a custom employment contract under the Punjab Labour Code 2026.",
      },
    ],
  }),
});

type Filter = "active" | "former" | "all";

/** True while an active employee is still inside their probationary period. */
function onProbation(e: Pick<EmployeeWithContract, "status" | "date_of_joining" | "probation_months">): boolean {
  return e.status === "active" && isOnProbation(e.date_of_joining, e.probation_months, localTodayISO());
}

function EmployeesPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <EmployeesBody />;
}

function EmployeesBody() {
  const { companyId } = useParams({ from: "/companies/$companyId_/employees" });
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<EmployeeWithContract[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");

  async function load() {
    try {
      const [c, list] = await Promise.all([getCompanyFn({ data: companyId }), listEmployeesFn({ data: companyId })]);
      setCompany(c ?? null);
      setEmployees(list);
    } catch {
      toast.error("Could not load employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const stats = useMemo(() => {
    const active = (employees ?? []).filter((e) => e.status === "active");
    return {
      active: active.length,
      probation: active.filter(onProbation).length,
      fixedTerm: active.filter((e) => e.employment_type === "fixed_term").length,
      noContract: active.filter((e) => e.contract_version === null).length,
    };
  }, [employees]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (employees ?? []).filter((e) => {
      if (filter !== "all" && e.status !== filter) return false;
      if (!q) return true;
      return [e.full_name, e.job_title, e.department, e.employee_code, e.cnic].some((v) => v?.toLowerCase().includes(q));
    });
  }, [employees, filter, query]);

  if (loading) return null;
  if (!company) return <p className="text-sm text-muted">Company not found.</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/companies/$companyId"
          params={{ companyId }}
          className="text-xs font-medium uppercase tracking-widest text-muted underline"
        >
          ← {company.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl">Employees</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Everyone employed by {company.name}. Add an employee with their particulars, then generate a custom
              employment contract drafted under the Punjab Labour Code 2026.
            </p>
          </div>
          {!showForm && (
            <Button type="button" onClick={() => setShowForm(true)}>
              <Plus className="size-4" strokeWidth={1.75} />
              Add employee
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <EmployeeForm
          companyId={companyId}
          onCancel={() => setShowForm(false)}
          onSaved={(saved) => {
            setShowForm(false);
            navigate({
              to: "/companies/$companyId/employees/$employeeId",
              params: { companyId, employeeId: saved.id },
            });
          }}
        />
      )}

      {employees && employees.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Active employees" value={stats.active} tone="success" icon={Users} />
          <StatTile label="On probation" value={stats.probation} tone="warn" icon={Clock} />
          <StatTile label="Fixed-term" value={stats.fixedTerm} tone="warn" icon={Clock} />
          <StatTile
            label="Without a contract"
            value={stats.noContract}
            tone={stats.noContract > 0 ? "danger" : "success"}
            icon={stats.noContract > 0 ? AlertTriangle : FileSignature}
          />
        </div>
      )}

      {employees === null ? (
        <SkeletonRows count={4} />
      ) : employees.length === 0 ? (
        !showForm && (
          <EmptyState
            text="No employees yet. Add your first employee to keep a staff register and generate a Punjab Labour Code 2026 employment contract for them."
            cta={
              <Button type="button" onClick={() => setShowForm(true)}>
                <Plus className="size-4" strokeWidth={1.75} />
                Add employee
              </Button>
            }
          />
        )
      ) : (
        <section>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-[var(--radius-sm)] border border-border bg-surface p-0.5" role="tablist" aria-label="Filter employees">
              {(["active", "former", "all"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "min-h-9 rounded-[6px] px-3 text-sm font-medium capitalize",
                    filter === f ? "bg-primary text-primary-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {f === "former" ? "Former" : f === "active" ? "Active" : "All"}
                </button>
              ))}
            </div>
            <div className="relative min-w-52 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" strokeWidth={1.75} />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search employees…"
                aria-label="Search employees"
                className="pl-9"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState className="mt-3" text="No employees match this view." />
          ) : (
            <ul className="mt-3 space-y-2">
              {visible.map((e) => {
                const probation = onProbation(e);
                return (
                  <li key={e.id}>
                    <Link
                      to="/companies/$companyId/employees/$employeeId"
                      params={{ companyId, employeeId: e.id }}
                      className={cn(
                        "block rounded-[var(--radius-md)] border border-border bg-surface p-4 hover:border-accent",
                        e.status === "former" && "opacity-70",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{e.full_name}</p>
                          <p className="text-xs text-muted">
                            {e.job_title}
                            {e.department ? ` · ${e.department}` : ""}
                            {e.employee_code ? ` · ${e.employee_code}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{EMPLOYMENT_TYPE_LABEL[e.employment_type]}</Badge>
                          {probation && <Badge tone="warn">On probation</Badge>}
                          {e.status === "former" && <Badge>Left{e.left_on ? ` ${formatShort(e.left_on)}` : ""}</Badge>}
                          {e.contract_version !== null ? (
                            <Badge tone="success">Contract v{e.contract_version}</Badge>
                          ) : (
                            <Badge tone="warn">No contract</Badge>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted">
                        {e.date_of_joining
                          ? `${e.date_of_joining > localTodayISO() ? "Joins" : "Joined"} ${formatShort(e.date_of_joining)}`
                          : "No joining date"}{" "}
                        ·{" "}
                        {grossMonthly({ basicSalary: e.basic_salary, allowances: e.allowances }) > 0
                          ? `${formatPKR(grossMonthly({ basicSalary: e.basic_salary, allowances: e.allowances }))} / month`
                          : "No salary set"}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone?: "success" | "warn" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tone === "success"
          ? "border-success bg-flag-low text-fg"
          : tone === "warn"
            ? "border-warn bg-flag-med text-fg"
            : "border-border bg-surface text-muted",
      )}
    >
      {children}
    </span>
  );
}
