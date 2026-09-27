import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  createEmployeeFn,
  updateEmployeeFn,
  type Employee,
  type EmployeeFields,
  type EmployeeWithContract,
} from "@/lib/legalpak/employees";
import {
  EMPLOYMENT_TYPE_LABEL,
  FIXED_TERM_BASIS_LABEL,
  GENDER_LABEL,
  WEEKDAYS,
  WORK_PATTERN_LABEL,
  type EmploymentType,
  type FixedTermBasis,
  type Gender,
  type WorkPattern,
} from "@/lib/legal/punjab-employment-contract";

type FormState = {
  fullName: string;
  fatherName: string;
  gender: Gender | "";
  dateOfBirth: string;
  cnic: string;
  passportNo: string;
  address: string;
  phone: string;
  email: string;
  employeeCode: string;
  jobTitle: string;
  department: string;
  reportsTo: string;
  jobDescription: string;
  placeOfWork: string;
  isManagerial: boolean;
  employmentType: EmploymentType;
  fixedTermBasis: FixedTermBasis | "";
  fixedTermReason: string;
  workPattern: WorkPattern;
  dateOfJoining: string;
  endDate: string;
  probationMonths: string;
  weeklyHours: string;
  workingSchedule: string;
  weeklyRestDay: string;
  basicSalary: string;
  allowances: { name: string; amount: string }[];
  socialSecurityNo: string;
  eobiNo: string;
};

const ALLOWANCE_SUGGESTIONS = ["House rent allowance", "Medical allowance", "Conveyance allowance", "Utilities allowance"];

function toFormState(e?: Employee): FormState {
  return {
    fullName: e?.full_name ?? "",
    fatherName: e?.father_name ?? "",
    gender: e?.gender ?? "",
    dateOfBirth: e?.date_of_birth ?? "",
    cnic: e?.cnic ?? "",
    passportNo: e?.passport_no ?? "",
    address: e?.address ?? "",
    phone: e?.phone ?? "",
    email: e?.email ?? "",
    employeeCode: e?.employee_code ?? "",
    jobTitle: e?.job_title ?? "",
    department: e?.department ?? "",
    reportsTo: e?.reports_to ?? "",
    jobDescription: e?.job_description ?? "",
    placeOfWork: e?.place_of_work ?? "",
    isManagerial: e?.is_managerial ?? false,
    employmentType: e?.employment_type ?? "permanent",
    fixedTermBasis: e?.fixed_term_basis ?? "",
    fixedTermReason: e?.fixed_term_reason ?? "",
    workPattern: e?.work_pattern ?? "full_time",
    dateOfJoining: e?.date_of_joining ?? "",
    endDate: e?.end_date ?? "",
    probationMonths: String(e?.probation_months ?? 0),
    weeklyHours: String(e?.weekly_hours ?? 48),
    workingSchedule: e?.working_schedule ?? "",
    weeklyRestDay: e?.weekly_rest_day ?? "Sunday",
    basicSalary: e ? String(e.basic_salary) : "",
    allowances: (e?.allowances ?? []).map((a) => ({ name: a.name, amount: String(a.amount) })),
    socialSecurityNo: e?.social_security_no ?? "",
    eobiNo: e?.eobi_no ?? "",
  };
}

function toFields(s: FormState): EmployeeFields {
  return {
    fullName: s.fullName,
    fatherName: s.fatherName,
    gender: s.gender || undefined,
    dateOfBirth: s.dateOfBirth,
    cnic: s.cnic,
    passportNo: s.passportNo,
    address: s.address,
    phone: s.phone,
    email: s.email,
    employeeCode: s.employeeCode,
    jobTitle: s.jobTitle,
    department: s.department,
    reportsTo: s.reportsTo,
    jobDescription: s.jobDescription,
    placeOfWork: s.placeOfWork,
    isManagerial: s.isManagerial,
    employmentType: s.employmentType,
    fixedTermBasis: s.fixedTermBasis || undefined,
    fixedTermReason: s.fixedTermReason,
    workPattern: s.workPattern,
    dateOfJoining: s.dateOfJoining,
    endDate: s.endDate,
    probationMonths: Number(s.probationMonths) || 0,
    weeklyHours: Number(s.weeklyHours) || 48,
    workingSchedule: s.workingSchedule,
    weeklyRestDay: s.weeklyRestDay,
    basicSalary: Number(s.basicSalary) || 0,
    allowances: s.allowances
      .filter((a) => a.name.trim() || a.amount.trim())
      .map((a) => ({ name: a.name.trim(), amount: Number(a.amount) || 0 })),
    socialSecurityNo: s.socialSecurityNo,
    eobiNo: s.eobiNo,
  };
}

/** Server-side zod failures arrive as a JSON string of issues — show the first one's message. */
function errorMessage(e: unknown): string {
  if (e instanceof Error) {
    try {
      const parsed = JSON.parse(e.message);
      if (Array.isArray(parsed) && typeof parsed[0]?.message === "string") return parsed[0].message;
    } catch {
      // not JSON — fall through to the plain message
    }
    return e.message;
  }
  return "Could not save the employee";
}

function Hint({ children }: { children: ReactNode }) {
  return <span className="text-xs normal-case tracking-normal text-muted">{children}</span>;
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-[var(--radius-md)] border border-border bg-bg/40 p-4">
      <legend className="px-1 font-display text-base">{title}</legend>
      {description && <p className="mb-3 text-xs text-muted">{description}</p>}
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function EmployeeForm({
  companyId,
  initial,
  onSaved,
  onCancel,
}: {
  companyId: string;
  initial?: Employee;
  onSaved: (employee: EmployeeWithContract) => void;
  onCancel: () => void;
}) {
  const [s, setS] = useState<FormState>(() => toFormState(initial));
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setS((prev) => ({ ...prev, [key]: value }));
  const fixed = s.employmentType === "fixed_term";

  function setAllowance(index: number, patch: Partial<{ name: string; amount: string }>) {
    setS((prev) => ({ ...prev, allowances: prev.allowances.map((a, i) => (i === index ? { ...a, ...patch } : a)) }));
  }

  async function submit() {
    if (!s.fullName.trim()) return toast.error("Enter the employee's full name");
    if (!s.jobTitle.trim()) return toast.error("Enter the job title");
    if (!s.dateOfJoining) return toast.error("Enter the date of joining");
    if (fixed && !s.fixedTermBasis) return toast.error("Choose the objective reason for the fixed term");
    setSaving(true);
    try {
      const fields = toFields(s);
      const saved = initial
        ? await updateEmployeeFn({ data: { ...fields, employeeId: initial.id } })
        : await createEmployeeFn({ data: { ...fields, companyId } });
      toast.success(initial ? "Employee updated" : "Employee added");
      onSaved(saved);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="font-display text-xl">{initial ? `Edit ${initial.full_name}` : "Add an employee"}</h2>
      <p className="mt-1 text-sm text-muted">
        These are the particulars the Punjab Labour Code 2026 requires an employment agreement to state (s.142). Anything
        you leave blank shows as a placeholder in the generated contract.
      </p>

      <div className="mt-4 space-y-4">
        <Section title="Personal details">
          <Field label="Full name *">
            <Input value={s.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Father's / husband's name">
            <Input value={s.fatherName} onChange={(e) => set("fatherName", e.target.value)} />
          </Field>
          <Field label="Gender">
            <Select value={s.gender} onChange={(e) => set("gender", e.target.value as Gender | "")}>
              <option value="">Not stated</option>
              {(Object.keys(GENDER_LABEL) as Gender[]).map((g) => (
                <option key={g} value={g}>
                  {GENDER_LABEL[g]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date of birth">
            <Input type="date" value={s.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
          </Field>
          <Field label="CNIC">
            <Input
              value={s.cnic}
              onChange={(e) => set("cnic", e.target.value)}
              placeholder="35202-1234567-1"
              inputMode="numeric"
            />
          </Field>
          <Field label="Passport no. (if no CNIC)">
            <Input value={s.passportNo} onChange={(e) => set("passportNo", e.target.value)} />
          </Field>
          <Field label="Residential address" className="sm:col-span-2">
            <Input value={s.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input type="tel" value={s.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={s.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
        </Section>

        <Section title="Role">
          <Field label="Job title *">
            <Input value={s.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} placeholder="e.g. Senior Accountant" />
          </Field>
          <Field label="Department">
            <Input value={s.department} onChange={(e) => set("department", e.target.value)} />
          </Field>
          <Field label="Reports to">
            <Input value={s.reportsTo} onChange={(e) => set("reportsTo", e.target.value)} />
          </Field>
          <Field label="Personnel / employee no.">
            <Input value={s.employeeCode} onChange={(e) => set("employeeCode", e.target.value)} />
          </Field>
          <Field label="Place of work" className="sm:col-span-2">
            <Input
              value={s.placeOfWork}
              onChange={(e) => set("placeOfWork", e.target.value)}
              placeholder="Leave blank to use the company's registered address"
            />
          </Field>
          <Field label="Description of duties" className="sm:col-span-2">
            <Textarea
              value={s.jobDescription}
              onChange={(e) => set("jobDescription", e.target.value)}
              placeholder="A detailed description of the tasks the employee will perform"
            />
            <Hint>The Code requires a detailed description of the tasks (s.142(1)(d)).</Hint>
          </Field>
          <label className="flex items-start gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-[var(--color-accent)]"
              checked={s.isManagerial}
              onChange={(e) => set("isManagerial", e.target.checked)}
            />
            <span>
              Managerial or administrative employee
              <span className="block text-xs text-muted">
                Can hire, transfer, promote, suspend, dismiss or discipline other employees (s.5(2)). Only such staff earning
                over five times the minimum wage can be bound by a post-employment non-compete (s.163).
              </span>
            </span>
          </label>
        </Section>

        <Section title="Employment terms">
          <Field label="Type of employment">
            <Select value={s.employmentType} onChange={(e) => set("employmentType", e.target.value as EmploymentType)}>
              {(Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[]).map((t) => (
                <option key={t} value={t}>
                  {EMPLOYMENT_TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Work pattern">
            <Select value={s.workPattern} onChange={(e) => set("workPattern", e.target.value as WorkPattern)}>
              {(Object.keys(WORK_PATTERN_LABEL) as WorkPattern[]).map((t) => (
                <option key={t} value={t}>
                  {WORK_PATTERN_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date of joining *">
            <Input type="date" value={s.dateOfJoining} onChange={(e) => set("dateOfJoining", e.target.value)} />
          </Field>
          <Field label="Probation">
            <Select value={s.probationMonths} onChange={(e) => set("probationMonths", e.target.value)}>
              <option value="0">No probation</option>
              <option value="1">1 month</option>
              <option value="2">2 months</option>
              <option value="3">3 months (maximum)</option>
            </Select>
            <Hint>Probation cannot exceed three months (s.144).</Hint>
          </Field>
          {fixed && (
            <>
              <Field label="Reason for the fixed term *">
                <Select value={s.fixedTermBasis} onChange={(e) => set("fixedTermBasis", e.target.value as FixedTermBasis | "")}>
                  <option value="">Choose…</option>
                  {(Object.keys(FIXED_TERM_BASIS_LABEL) as FixedTermBasis[]).map((b) => (
                    <option key={b} value={b}>
                      {FIXED_TERM_BASIS_LABEL[b]}
                    </option>
                  ))}
                </Select>
                <Hint>A fixed term needs an objective reason stated in the agreement (s.138).</Hint>
              </Field>
              <Field label="End date">
                <Input type="date" value={s.endDate} onChange={(e) => set("endDate", e.target.value)} />
                <Hint>Leave blank only when covering an absent employee.</Hint>
              </Field>
              <Field label="Details of the reason" className="sm:col-span-2">
                <Input
                  value={s.fixedTermReason}
                  onChange={(e) => set("fixedTermReason", e.target.value)}
                  placeholder="e.g. covering maternity leave of Ms. Sana Malik / commissioning the new ERP"
                />
              </Field>
            </>
          )}
          <Field label="Normal hours per week">
            <Input
              type="number"
              min={1}
              max={72}
              value={s.weeklyHours}
              onChange={(e) => set("weeklyHours", e.target.value)}
            />
            <Hint>Up to 8 hours a day and 48 a week (s.176).</Hint>
          </Field>
          <Field label="Weekly rest day">
            <Select value={s.weeklyRestDay} onChange={(e) => set("weeklyRestDay", e.target.value)}>
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Working schedule" className="sm:col-span-2">
            <Input
              value={s.workingSchedule}
              onChange={(e) => set("workingSchedule", e.target.value)}
              placeholder="e.g. Monday to Saturday, 9:00 am to 6:00 pm"
            />
          </Field>
        </Section>

        <Section title="Remuneration" description="The basic wage must not be below the notified minimum wage (s.165). Allowances are listed separately (s.142(1)(k)).">
          <Field label="Basic salary (PKR / month)">
            <Input
              type="number"
              min={0}
              step={500}
              value={s.basicSalary}
              onChange={(e) => set("basicSalary", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Allowances</p>
            {s.allowances.length > 0 && (
              <ul className="mt-2 space-y-2">
                {s.allowances.map((a, i) => (
                  <li key={i} className="grid grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[1fr_9rem_auto]">
                    <Input
                      value={a.name}
                      onChange={(e) => setAllowance(i, { name: e.target.value })}
                      placeholder="Allowance name"
                      aria-label={`Allowance ${i + 1} name`}
                      className="col-span-2 sm:col-span-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={a.amount}
                      onChange={(e) => setAllowance(i, { amount: e.target.value })}
                      placeholder="PKR"
                      aria-label={`Allowance ${i + 1} amount`}
                    />
                    <button
                      type="button"
                      onClick={() => set("allowances", s.allowances.filter((_, idx) => idx !== i))}
                      aria-label={`Remove allowance ${i + 1}`}
                      className="inline-flex min-h-11 items-center px-2 text-muted hover:text-danger"
                    >
                      <Trash2 className="size-4" strokeWidth={1.75} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {ALLOWANCE_SUGGESTIONS.filter((n) => !s.allowances.some((a) => a.name === n)).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => set("allowances", [...s.allowances, { name, amount: "" }])}
                  className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border px-3 text-xs text-muted hover:border-accent hover:text-fg"
                >
                  <Plus className="size-3" strokeWidth={2} />
                  {name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => set("allowances", [...s.allowances, { name: "", amount: "" }])}
                className="inline-flex min-h-9 items-center gap-1 rounded-full border border-dashed border-border px-3 text-xs text-muted hover:border-accent hover:text-fg"
              >
                <Plus className="size-3" strokeWidth={2} />
                Other
              </button>
            </div>
          </div>
        </Section>

        <Section title="Registrations" description="If the employee is already registered, the agreement records the numbers (s.142(1)(l)).">
          <Field label="Social security no.">
            <Input value={s.socialSecurityNo} onChange={(e) => set("socialSecurityNo", e.target.value)} />
          </Field>
          <Field label="EOBI (old-age benefits) no.">
            <Input value={s.eobiNo} onChange={(e) => set("eobiNo", e.target.value)} />
          </Field>
        </Section>
      </div>

      <div className="mt-5 flex gap-2">
        <Button type="button" disabled={saving} onClick={submit}>
          {saving ? "Saving…" : initial ? "Save changes" : "Add employee"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
