import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listWorkspacesFn, type Workspace } from "@/lib/legalpak/workspaces";
import { createCompanyFn, COMPANY_TYPES, COMPANY_TYPE_LABEL, type CompanyInput } from "@/lib/legalpak/companies";
import { useCompanyContext } from "@/lib/legalpak/company-context";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

export const Route = createFileRoute("/companies/new")({
  component: NewCompanyPage,
  head: () => ({
    meta: [{ title: "Add company — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

const empty = {
  name: "",
  cuin: "",
  ntn: "",
  companyType: "private",
  paidUpCapital: "",
  turnover: "",
  employees: "",
  incorporationDate: "",
  financialYearEnd: "",
  agmDate: "",
  publicLinked: false,
  hasSubsidiary: false,
  registeredAddress: "",
  businessActivity: "",
  province: "",
  city: "",
};

function NewCompanyPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <NewCompanyForm />;
}

function NewCompanyForm() {
  const navigate = useNavigate();
  const { refresh: refreshSwitcher, setSelectedCompanyId } = useCompanyContext();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listWorkspacesFn()
      .then((rows: Workspace[]) => setWorkspace(rows[0] ?? null))
      .catch(() => setWorkspace(null));
  }, []);

  function set<K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace) {
      toast.error("Create a workspace first");
      return;
    }
    const input: CompanyInput = {
      workspaceId: workspace.id,
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
    };
    setSubmitting(true);
    try {
      const company = await createCompanyFn({ data: input });
      toast.success("Company created");
      setSelectedCompanyId(company.id);
      refreshSwitcher();
      navigate({ to: "/companies/$companyId", params: { companyId: company.id } });
    } catch {
      toast.error("Could not create company");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">New company</p>
        <h1 className="font-display text-3xl">Company profile</h1>
        <p className="mt-2 text-sm text-muted">
          Saved once here, then reused across every matter — Financial Statements, Form A, Form 9, and
          contracts.
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
            <Input
              value={form.businessActivity}
              onChange={(e) => set("businessActivity", e.target.value)}
              placeholder="e.g. Software development and IT consulting"
            />
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
          {submitting ? "Saving…" : "Save company"}
        </Button>
      </form>
    </div>
  );
}
