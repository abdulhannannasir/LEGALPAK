import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Archive, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getCompanyFn, type Company } from "@/lib/legalpak/companies";
import {
  deleteEmployeeFn,
  getEmployeeFn,
  setEmployeeStatusFn,
  type EmployeeWithContract,
} from "@/lib/legalpak/employees";
import {
  EMPLOYMENT_TYPE_LABEL,
  FIXED_TERM_BASIS_LABEL,
  GENDER_LABEL,
  WORK_PATTERN_LABEL,
  formatPKR,
  grossMonthly,
  isOnProbation,
  probationEndDate,
} from "@/lib/legal/punjab-employment-contract";
import { formatShort, localTodayISO } from "@/lib/legal/date";
import { Button } from "@/components/ui/button";
import { EmployeeForm } from "@/components/employees/employee-form";
import { EmployeeContractPanel } from "@/components/employees/employee-contract-panel";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/companies/$companyId_/employees_/$employeeId")({
  component: EmployeePage,
  head: () => ({
    meta: [{ title: "Employee — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function EmployeePage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <EmployeeBody />;
}

function Detail({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{children || "—"}</dd>
    </div>
  );
}

function EmployeeBody() {
  const { companyId, employeeId } = useParams({ from: "/companies/$companyId_/employees_/$employeeId" });
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [employee, setEmployee] = useState<EmployeeWithContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [c, e] = await Promise.all([getCompanyFn({ data: companyId }), getEmployeeFn({ data: employeeId })]);
      setCompany(c ?? null);
      setEmployee(e);
    } catch {
      toast.error("Could not load this employee");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, employeeId]);

  async function toggleStatus() {
    if (!employee) return;
    const leaving = employee.status === "active";
    if (leaving && !window.confirm(`Mark ${employee.full_name} as having left? Their record and contracts stay on file.`)) return;
    setBusy(true);
    try {
      const updated = await setEmployeeStatusFn({
        data: { employeeId, status: leaving ? "former" : "active", leftOn: leaving ? localTodayISO() : undefined },
      });
      setEmployee(updated);
      toast.success(leaving ? "Marked as left" : "Marked as active");
    } catch {
      toast.error("Could not update the employee");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!employee) return;
    if (!window.confirm(`Delete ${employee.full_name}? Their saved contracts are deleted too, and this can't be undone.`)) return;
    setBusy(true);
    try {
      await deleteEmployeeFn({ data: employeeId });
      toast.success("Employee deleted");
      navigate({ to: "/companies/$companyId/employees", params: { companyId } });
    } catch {
      toast.error("Could not delete the employee");
      setBusy(false);
    }
  }

  if (loading) return null;
  if (!company || !employee) return <p className="text-sm text-muted">Employee not found.</p>;

  const gross = grossMonthly({ basicSalary: employee.basic_salary, allowances: employee.allowances });
  const probationEnd = probationEndDate(employee.date_of_joining ?? "", employee.probation_months);
  const probation = employee.status === "active" && isOnProbation(employee.date_of_joining, employee.probation_months, localTodayISO());

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/companies/$companyId/employees"
          params={{ companyId }}
          className="text-xs font-medium uppercase tracking-widest text-muted underline"
        >
          ← Employees · {company.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl">{employee.full_name}</h1>
              {employee.status === "former" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-muted px-2.5 py-0.5 text-xs font-medium text-muted">
                  <Archive className="size-3" strokeWidth={1.75} />
                  Left{employee.left_on ? ` ${formatShort(employee.left_on)}` : ""}
                </span>
              )}
              {probation && (
                <span className="rounded-full border border-warn bg-flag-med px-2.5 py-0.5 text-xs font-medium">
                  On probation{probationEnd ? ` until ${formatShort(probationEnd)}` : ""}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              {employee.job_title}
              {employee.department ? ` · ${employee.department}` : ""} · {company.name}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {!editing && (
              <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
                <Pencil className="size-4" strokeWidth={1.75} />
                Edit
              </Button>
            )}
            <Button type="button" variant="ghost" disabled={busy} onClick={toggleStatus}>
              {employee.status === "active" ? (
                <>
                  <Archive className="size-4" strokeWidth={1.75} />
                  Mark as left
                </>
              ) : (
                <>
                  <RotateCcw className="size-4" strokeWidth={1.75} />
                  Mark as active
                </>
              )}
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={remove} className="hover:text-danger">
              <Trash2 className="size-4" strokeWidth={1.75} />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {editing ? (
        <EmployeeForm
          companyId={companyId}
          initial={employee}
          onCancel={() => setEditing(false)}
          onSaved={(saved) => {
            setEmployee(saved);
            setEditing(false);
          }}
        />
      ) : (
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Father's / husband's name">{employee.father_name}</Detail>
            <Detail label="Gender">{employee.gender ? GENDER_LABEL[employee.gender] : null}</Detail>
            <Detail label="Date of birth">{employee.date_of_birth ? formatShort(employee.date_of_birth) : null}</Detail>
            <Detail label="CNIC">{employee.cnic}</Detail>
            <Detail label="Passport no.">{employee.passport_no}</Detail>
            <Detail label="Phone">{employee.phone}</Detail>
            <Detail label="Email">{employee.email}</Detail>
            <Detail label="Address" className="sm:col-span-2">
              {employee.address}
            </Detail>
            <Detail label="Employment">
              {EMPLOYMENT_TYPE_LABEL[employee.employment_type]} · {WORK_PATTERN_LABEL[employee.work_pattern]}
            </Detail>
            <Detail label="Date of joining">{employee.date_of_joining ? formatShort(employee.date_of_joining) : null}</Detail>
            {employee.employment_type === "fixed_term" && (
              <Detail label="Fixed term">
                {employee.fixed_term_basis ? FIXED_TERM_BASIS_LABEL[employee.fixed_term_basis] : null}
                {employee.end_date ? ` · ends ${formatShort(employee.end_date)}` : ""}
              </Detail>
            )}
            <Detail label="Probation">
              {employee.probation_months > 0
                ? `${employee.probation_months} month${employee.probation_months === 1 ? "" : "s"}`
                : "None"}
            </Detail>
            <Detail label="Hours">
              {employee.weekly_hours} / week · rest day {employee.weekly_rest_day}
            </Detail>
            <Detail label="Gross remuneration">{gross > 0 ? `${formatPKR(gross)} / month` : null}</Detail>
            <Detail label="Basic salary">{employee.basic_salary > 0 ? formatPKR(employee.basic_salary) : null}</Detail>
            <Detail label="Allowances" className={cn(employee.allowances.length > 0 ? "sm:col-span-2" : "")}>
              {employee.allowances.length > 0
                ? employee.allowances.map((a) => `${a.name} ${formatPKR(a.amount)}`).join(" · ")
                : null}
            </Detail>
            <Detail label="Managerial / administrative">{employee.is_managerial ? "Yes" : "No"}</Detail>
            <Detail label="Social security no.">{employee.social_security_no}</Detail>
            <Detail label="EOBI no.">{employee.eobi_no}</Detail>
            <Detail label="Duties" className="sm:col-span-2 lg:col-span-3">
              {employee.job_description}
            </Detail>
          </dl>
        </section>
      )}

      {!editing && <EmployeeContractPanel employee={employee} company={company} onSaved={load} />}
    </div>
  );
}
