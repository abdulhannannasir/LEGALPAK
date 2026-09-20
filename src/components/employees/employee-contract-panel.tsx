import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, FileSignature, Info, Save, XCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { PackOutput } from "@/components/pack-output";
import { localTodayISO, formatShort } from "@/lib/legal/date";
import {
  COMMENCEMENT_NOTE,
  DEFAULT_MINIMUM_WAGE,
  checkEmploymentContract,
  generateEmploymentContract,
  type EmploymentContractInput,
} from "@/lib/legal/punjab-employment-contract";
import type { Company } from "@/lib/legalpak/companies";
import {
  listEmployeeContractsFn,
  saveEmployeeContractFn,
  type EmployeeContract,
  type EmployeeWithContract,
} from "@/lib/legalpak/employees";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function toInt(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

export function EmployeeContractPanel({
  employee,
  company,
  onSaved,
}: {
  employee: EmployeeWithContract;
  company: Company;
  onSaved: () => void;
}) {
  const [contractDate, setContractDate] = useState(localTodayISO());
  const [city, setCity] = useState(company.city ?? "");
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryTitle, setSignatoryTitle] = useState("");
  const [headcount, setHeadcount] = useState(company.employees != null ? String(company.employees) : "");
  const [minimumWage, setMinimumWage] = useState(String(DEFAULT_MINIMUM_WAGE));
  const [providentFund, setProvidentFund] = useState(false);
  const [nonSolicitMonths, setNonSolicitMonths] = useState("12");
  const [nonCompete, setNonCompete] = useState(false);
  const [nonCompeteMonths, setNonCompeteMonths] = useState("6");
  const [nonCompeteScope, setNonCompeteScope] = useState("");
  const [additionalTerms, setAdditionalTerms] = useState("");
  const [note, setNote] = useState("");

  const [contracts, setContracts] = useState<EmployeeContract[] | null>(null);
  const [viewing, setViewing] = useState<EmployeeContract | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadContracts(applyLatest: boolean) {
    try {
      const rows = await listEmployeeContractsFn({ data: employee.id });
      setContracts(rows);
      // Carry the last issued contract's drafting choices forward so the next version starts from them.
      const snap = applyLatest ? rows[0]?.snapshot : undefined;
      if (snap) {
        setSignatoryName(str(snap.signatoryName) ?? "");
        setSignatoryTitle(str(snap.signatoryTitle) ?? "");
        setCity((c) => str(snap.city) ?? c);
        // The company profile is the source of truth for headcount; only fall back to the last figure used when it has none.
        if (company.employees == null && typeof snap.headcount === "number") setHeadcount(String(snap.headcount));
        setProvidentFund(snap.providentFund === true);
        if (typeof snap.nonSolicitMonths === "number") setNonSolicitMonths(String(snap.nonSolicitMonths));
        setNonCompete(snap.nonCompete === true);
        if (typeof snap.nonCompeteMonths === "number") setNonCompeteMonths(String(snap.nonCompeteMonths));
        setNonCompeteScope(str(snap.nonCompeteScope) ?? "");
        setAdditionalTerms(str(snap.additionalTerms) ?? "");
      }
    } catch {
      setContracts([]);
    }
  }

  useEffect(() => {
    void loadContracts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee.id]);

  const input: EmploymentContractInput = useMemo(
    () => ({
      employerName: company.name,
      employerAddress: [company.registered_address, company.city, company.province].filter(Boolean).join(", "),
      employerCuin: company.cuin ?? "",
      signatoryName,
      signatoryTitle,
      headcount: toInt(headcount),
      fullName: employee.full_name,
      fatherName: employee.father_name ?? "",
      gender: employee.gender ?? "",
      dateOfBirth: employee.date_of_birth ?? "",
      cnic: employee.cnic ?? "",
      passportNo: employee.passport_no ?? "",
      address: employee.address ?? "",
      phone: employee.phone ?? "",
      email: employee.email ?? "",
      employeeCode: employee.employee_code ?? "",
      jobTitle: employee.job_title,
      department: employee.department ?? "",
      reportsTo: employee.reports_to ?? "",
      jobDescription: employee.job_description ?? "",
      placeOfWork: employee.place_of_work ?? "",
      isManagerial: employee.is_managerial,
      employmentType: employee.employment_type,
      fixedTermBasis: employee.fixed_term_basis ?? "",
      fixedTermReason: employee.fixed_term_reason ?? "",
      workPattern: employee.work_pattern,
      dateOfJoining: employee.date_of_joining ?? "",
      endDate: employee.end_date ?? "",
      probationMonths: employee.probation_months,
      weeklyHours: employee.weekly_hours,
      workingSchedule: employee.working_schedule ?? "",
      weeklyRestDay: employee.weekly_rest_day,
      basicSalary: employee.basic_salary,
      allowances: employee.allowances,
      socialSecurityNo: employee.social_security_no ?? "",
      eobiNo: employee.eobi_no ?? "",
      contractDate,
      city,
      minimumWage: Number(minimumWage) > 0 ? Number(minimumWage) : DEFAULT_MINIMUM_WAGE,
      providentFund,
      nonSolicitMonths: toInt(nonSolicitMonths) ?? 0,
      nonCompete,
      nonCompeteMonths: toInt(nonCompeteMonths) ?? 0,
      nonCompeteScope,
      additionalTerms,
    }),
    [
      company,
      employee,
      signatoryName,
      signatoryTitle,
      headcount,
      contractDate,
      city,
      minimumWage,
      providentFund,
      nonSolicitMonths,
      nonCompete,
      nonCompeteMonths,
      nonCompeteScope,
      additionalTerms,
    ],
  );

  const issues = useMemo(() => checkEmploymentContract(input), [input]);
  const text = useMemo(() => generateEmploymentContract(input), [input]);
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  const infos = issues.filter((i) => i.level === "info");
  const title = `Employment Agreement — ${employee.full_name}`;
  const filename = `employment-agreement-${slug(employee.full_name) || "employee"}.txt`;

  async function save() {
    setSaving(true);
    try {
      const saved = await saveEmployeeContractFn({
        data: { employeeId: employee.id, title, body: text, snapshot: input as unknown as Record<string, unknown>, note: note || undefined },
      });
      toast.success(`Saved as version ${saved.version}`);
      setNote("");
      await loadContracts(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the contract");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div>
        <h2 className="flex items-center gap-2 font-display text-xl">
          <FileSignature className="size-5 text-accent" strokeWidth={1.75} />
          Employment contract
        </h2>
        <p className="mt-1 text-sm text-muted">
          Built from {employee.full_name}'s record and {company.name}'s profile, tailored to the Punjab Labour Code 2026 —
          probation, notice, gratuity, leave and restraints all follow the rules that apply to this hire. It updates live
          as you change the options.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-border bg-bg px-3 py-2 text-xs text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
        <p>{COMMENCEMENT_NOTE}</p>
      </div>

      <details open className="rounded-[var(--radius-md)] border border-border bg-bg/40 p-4">
        <summary className="cursor-pointer font-display text-base">Contract options</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Date of agreement">
            <Input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} />
          </Field>
          <Field label="Place of signing">
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lahore" />
          </Field>
          <Field label="Signing for the company — name">
            <Input value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} placeholder="e.g. Ayesha Khan" />
          </Field>
          <Field label="Signing for the company — position">
            <Input
              value={signatoryTitle}
              onChange={(e) => setSignatoryTitle(e.target.value)}
              placeholder="e.g. Chief Executive Officer"
            />
          </Field>
          <Field label="Total workers the company employs">
            <Input type="number" min={0} value={headcount} onChange={(e) => setHeadcount(e.target.value)} />
            <span className="text-xs normal-case tracking-normal text-muted">
              {company.employees != null ? (
                "From the company profile — change it here to override for this contract."
              ) : (
                <>
                  Not on the company profile.{" "}
                  <Link to="/companies/$companyId/edit" params={{ companyId: company.id }} className="text-accent underline">
                    Add it
                  </Link>{" "}
                  or enter it here. It sets notice (14 vs 30 days), gratuity (20+), profit bonus (20+) and insurance (50+).
                </>
              )}
            </span>
          </Field>
          <Field label="Notified monthly minimum wage (PKR)">
            <Input type="number" min={0} value={minimumWage} onChange={(e) => setMinimumWage(e.target.value)} />
            <span className="text-xs normal-case tracking-normal text-muted">
              Punjab notified PKR {DEFAULT_MINIMUM_WAGE.toLocaleString("en-PK")} on 8 Sep 2025 — update if it has changed.
              Used for the pay floor, gratuity category and the non-compete test.
            </span>
          </Field>
          <Field label="Client non-solicitation (months, 0 = none)">
            <Input type="number" min={0} value={nonSolicitMonths} onChange={(e) => setNonSolicitMonths(e.target.value)} />
          </Field>
          <label className="flex items-start gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-[var(--color-accent)]"
              checked={providentFund}
              onChange={(e) => setProvidentFund(e.target.checked)}
            />
            <span>
              Employer provident fund applies
              <span className="block text-xs text-muted">Adds the s.161 contribution and gratuity-offset terms.</span>
            </span>
          </label>
          <div className="sm:col-span-2">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[var(--color-accent)]"
                checked={nonCompete}
                onChange={(e) => setNonCompete(e.target.checked)}
              />
              <span>
                Include a post-employment non-compete
                <span className="block text-xs text-muted">
                  Void under s.163 unless the employee is managerial/administrative and earns over five times the minimum
                  wage — otherwise it is left out automatically.
                </span>
              </span>
            </label>
            {nonCompete && (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Duration (months)">
                  <Input type="number" min={0} value={nonCompeteMonths} onChange={(e) => setNonCompeteMonths(e.target.value)} />
                </Field>
                <Field label="Scope">
                  <Input
                    value={nonCompeteScope}
                    onChange={(e) => setNonCompeteScope(e.target.value)}
                    placeholder="e.g. within Punjab, in the same line of business"
                  />
                </Field>
              </div>
            )}
          </div>
          <Field label="Additional terms" className="sm:col-span-2">
            <Textarea
              value={additionalTerms}
              onChange={(e) => setAdditionalTerms(e.target.value)}
              placeholder="Anything specific to this hire (e.g. relocation, training bond, company car). Must be consistent with the Code."
            />
          </Field>
        </div>
      </details>

      {(errors.length > 0 || warnings.length > 0) && (
        <div className="space-y-2" role="status">
          {errors.map((i, idx) => (
            <div key={`e${idx}`} className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-danger bg-flag-high px-3 py-2 text-sm">
              <XCircle className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.75} />
              <p>
                {i.message}
                {i.ref && <span className="ml-1 text-xs text-muted">({i.ref})</span>}
              </p>
            </div>
          ))}
          {warnings.map((i, idx) => (
            <div key={`w${idx}`} className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-warn bg-flag-med px-3 py-2 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" strokeWidth={1.75} />
              <p>
                {i.message}
                {i.ref && <span className="ml-1 text-xs text-muted">({i.ref})</span>}
              </p>
            </div>
          ))}
        </div>
      )}
      {errors.length === 0 && warnings.length === 0 && (
        <p className="rounded-[var(--radius-sm)] border border-success bg-flag-low px-3 py-2 text-sm">
          No compliance problems found — every particular section 142 requires is filled in.
        </p>
      )}
      {infos.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted">How this draft was tailored ({infos.length})</summary>
          <ul className="mt-2 space-y-1.5 text-xs text-muted">
            {infos.map((i, idx) => (
              <li key={idx}>
                {i.message}
                {i.ref && <span className="ml-1">({i.ref})</span>}
              </li>
            ))}
          </ul>
        </details>
      )}

      <PackOutput text={text} filename={filename} title={title} />

      <div className="flex flex-wrap items-end gap-3 rounded-[var(--radius-md)] border border-border bg-bg/40 p-4">
        <Field label="Version note (optional)" className="min-w-56 flex-1">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Issued with offer letter" />
        </Field>
        <Button type="button" disabled={saving || errors.length > 0} onClick={save}>
          <Save className="size-4" strokeWidth={1.75} />
          {saving ? "Saving…" : `Save as version ${(contracts?.[0]?.version ?? 0) + 1}`}
        </Button>
        {errors.length > 0 && <p className="w-full text-xs text-danger">Resolve the problems above before saving this version.</p>}
      </div>

      <div>
        <h3 className="font-display text-lg">Saved versions</h3>
        {contracts === null ? (
          <p className="mt-2 text-sm text-muted">Loading…</p>
        ) : contracts.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Nothing saved yet. Saving keeps the exact text you reviewed, so later edits to this employee never rewrite a
            contract that was already issued.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {contracts.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border bg-bg px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    Version {c.version}
                    {c.note ? <span className="font-normal text-muted"> — {c.note}</span> : null}
                  </p>
                  <p className="text-xs text-muted">
                    {formatShort(c.created_at.slice(0, 10))}
                    {c.created_by_name ? ` · ${c.created_by_name}` : ""}
                  </p>
                </div>
                <Button type="button" variant="ghost" onClick={() => setViewing(viewing?.id === c.id ? null : c)}>
                  {viewing?.id === c.id ? "Hide" : "View"}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {viewing && (
          <div className="mt-3">
            <PackOutput
              text={viewing.body}
              filename={`employment-agreement-${slug(employee.full_name) || "employee"}-v${viewing.version}.txt`}
              title={`${viewing.title} (v${viewing.version})`}
            />
          </div>
        )}
      </div>
    </section>
  );
}
