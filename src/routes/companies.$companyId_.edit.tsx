import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getCompanyFn,
  updateCompanyFn,
  COMPANY_TYPES,
  COMPANY_TYPE_LABEL,
  type Company,
} from "@/lib/legalpak/companies";
import { useCompanyContext } from "@/lib/legalpak/company-context";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

export const Route = createFileRoute("/companies/$companyId_/edit")({
  component: EditCompanyPage,
  head: () => ({
    meta: [{ title: "Edit company — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

type FormState = {
  name: string;
  cuin: string;
  ntn: string;
  companyType: string;
  paidUpCapital: string;
  turnover: string;
  employees: string;
  incorporationDate: string;
  financialYearEnd: string;
  agmDate: string;
  publicLinked: boolean;
  hasSubsidiary: boolean;
  registeredAddress: string;
  businessActivity: string;
  province: string;
  city: string;
};

function fromCompany(c: Company): FormState {
  return {
    name: c.name,
    cuin: c.cuin ?? "",
    ntn: c.ntn ?? "",
    companyType: c.company_type ?? "private",
    paidUpCapital: c.paid_up_capital ?? "",
    turnover: c.turnover ?? "",
    employees: c.employees != null ? String(c.employees) : "",
    incorporationDate: c.incorporation_date ?? "",
    financialYearEnd: c.financial_year_end ?? "",
    agmDate: c.agm_date ?? "",
    publicLinked: c.public_linked,
    hasSubsidiary: c.has_subsidiary,
    registeredAddress: c.registered_address ?? "",
    businessActivity: c.business_activity ?? "",
    province: c.province ?? "",
    city: c.city ?? "",
  };
}

function EditCompanyPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <EditCompanyForm />;
}

function EditCompanyForm() {
  const { companyId } = useParams({ from: "/companies/$companyId_/edit" });
  const navigate = useNavigate();
  const { refresh: refreshSwitcher } = useCompanyContext();
  const [form, setForm] = useState<FormState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCompanyFn({ data: companyId })
      .then((c) => setForm(fromCompany(c)))
      .catch(() => toast.error("Could not load this company"));
  }, [companyId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);
    try {
      await updateCompanyFn({
        data: {
          companyId,
          name: form.name.trim(),
          cuin: form.cuin.trim() || undefined,
          ntn: form.ntn.trim() || undefined,
          companyType: form.companyType,
          paidUpCapital: form.paidUpCapital ? Number(form.paidUpCapital) : undefined,
          turnover: form.turnover ? Number(form.turnover) : undefined,
          employees: form.employees ? Number(form.employees) : undefined,
          incorporationDate: form.incorporationDate || undefined,
          financialYearEnd: form.financialYearEnd || undefined,
          agmDate: form.agmDate || undefined,
          publicLinked: form.publicLinked,
          hasSubsidiary: form.hasSubsidiary,
          registeredAddress: form.registeredAddress.trim() || undefined,
          businessActivity: form.businessActivity.trim() || undefined,
          province: form.province.trim() || undefined,
          city: form.city.trim() || undefined,
        },
      });
      toast.success("Company updated");
      refreshSwitcher();
      navigate({ to: "/companies/$companyId", params: { companyId } });
    } catch {
      toast.error("Could not update company");
    } finally {
      setSubmitting(false);
    }
  }

  if (!form) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to="/companies/$companyId"
          params={{ companyId }}
          className="text-xs font-medium uppercase tracking-widest text-muted underline"
        >
          ← Back
        </Link>
        <h1 className="mt-1 font-display text-3xl">Edit company</h1>
        <p className="mt-2 text-sm text-muted">
          Update once here — every matter for this company reads the current profile.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name">
            <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="CUIN">
            <Input value={form.cuin} onChange={(e) => set("cuin", e.target.value)} />
          </Field>
          <Field label="NTN (FBR)">
            <Input value={form.ntn} onChange={(e) => set("ntn", e.target.value)} />
          </Field>
          <Field label="Company type">
            <Select value={form.companyType} onChange={(e) => set("companyType", e.target.value)}>
              {COMPANY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {COMPANY_TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Paid-up capital (PKR)">
            <Input
              type="number"
              min={0}
              value={form.paidUpCapital}
              onChange={(e) => set("paidUpCapital", e.target.value)}
            />
          </Field>
          <Field label="Financial year end">
            <Input
              type="date"
              value={form.financialYearEnd}
              onChange={(e) => set("financialYearEnd", e.target.value)}
            />
          </Field>
          <Field label="AGM date">
            <Input type="date" value={form.agmDate} onChange={(e) => set("agmDate", e.target.value)} />
          </Field>
          <Field label="Incorporation date">
            <Input
              type="date"
              value={form.incorporationDate}
              onChange={(e) => set("incorporationDate", e.target.value)}
            />
          </Field>
          <Field label="Turnover (PKR, last year)">
            <Input type="number" min={0} value={form.turnover} onChange={(e) => set("turnover", e.target.value)} />
          </Field>
          <Field label="Employees (average)">
            <Input
              type="number"
              min={0}
              value={form.employees}
              onChange={(e) => set("employees", e.target.value)}
            />
          </Field>
          <Field label="Registered address" className="sm:col-span-2">
            <Input value={form.registeredAddress} onChange={(e) => set("registeredAddress", e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Province">
            <Input value={form.province} onChange={(e) => set("province", e.target.value)} />
          </Field>
          <Field label="Business activity" className="sm:col-span-2">
            <Input value={form.businessActivity} onChange={(e) => set("businessActivity", e.target.value)} />
          </Field>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.publicLinked}
              onChange={(e) => set("publicLinked", e.target.checked)}
            />
            Public-linked (PIC, public subsidiary, or holding of a public company)
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.hasSubsidiary}
              onChange={(e) => set("hasSubsidiary", e.target.checked)}
            />
            Has a subsidiary (consolidation)
          </label>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
