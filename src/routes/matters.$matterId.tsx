import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getCompanyFn, type Company } from "@/lib/legalpak/companies";
import {
  getMatterFn,
  updateMatterDataFn,
  updateMatterStatusFn,
  type MatterWithData,
  type Json,
} from "@/lib/legalpak/matters";
import {
  MATTER_TYPE_LABEL,
  STATUS_LABEL,
  nextStatuses,
  type MatterStatus,
} from "@/lib/legalpak/workflow";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Flags } from "@/components/flags";
import { PackOutput } from "@/components/pack-output";
import { SplitScreen } from "@/components/split-screen";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DocumentVault } from "@/components/document-vault";
import { ClientApproval } from "@/components/client-approval";
import { RequestAttorneyReview } from "@/components/request-attorney-review";
import { ComplianceSummaryCard } from "@/components/compliance/summary-card";
import { ComplianceNotes } from "@/components/compliance/notes";
import { ComplianceReminders } from "@/components/compliance/reminders";
import {
  isComplianceMatterType,
  markComplianceCompleteFn,
  reopenComplianceItemFn,
} from "@/lib/legalpak/compliance";
import {
  classifyAccounts,
  generateAccountsPack,
  type AccountsInput,
  type CompanyKind,
} from "@/lib/legal/accounts";
import { formAAdvice, type FormAInput } from "@/lib/legal/form-a";
import { form9Advice, type Form9Input } from "@/lib/legal/form9";
import { generateContract } from "@/lib/legal/contracts";
import {
  ContractWorkspace,
  normalizeContractDraft,
  type ContractDraftState,
} from "@/components/contracts/contract-workspace";
import { ContractStatusStepper, CONTRACT_STATUS_LABEL } from "@/components/contracts/contract-status-stepper";
import { ContractVersionHistory } from "@/components/contracts/contract-version-history";
import type { ContractVersion } from "@/lib/legalpak/contracts";
import {
  generateIncomeTaxMemo,
  summarizeIncomeTax,
  type IncomeTaxInput,
} from "@/lib/tax/income-tax";

export const Route = createFileRoute("/matters/$matterId")({
  component: MatterPage,
  head: () => ({
    meta: [{ title: "Matter — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function MatterPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <MatterBody />;
}

function toAccountsKind(companyType: string | null): CompanyKind {
  return companyType === "smc" ||
    companyType === "public" ||
    companyType === "listed" ||
    companyType === "s42"
    ? companyType
    : "private";
}
function toFormAKind(companyType: string | null): FormAInput["kind"] {
  if (companyType === "smc" || companyType === "public" || companyType === "listed")
    return companyType;
  return "private";
}
function toForm9Kind(companyType: string | null): Form9Input["kind"] {
  if (companyType === "smc" || companyType === "public") return companyType;
  return "private";
}

function MatterBody() {
  const { matterId } = useParams({ from: "/matters/$matterId" });
  const [matter, setMatter] = useState<MatterWithData | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [complianceBusy, setComplianceBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const m = await getMatterFn({ data: matterId });
      const c = await getCompanyFn({ data: m.company_id });
      setMatter(m);
      setCompany(c);
    } catch {
      toast.error("Could not load this matter");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterId]);

  async function transition(status: MatterStatus) {
    if (!matter) return;
    setTransitioning(true);
    try {
      const updated = await updateMatterStatusFn({ data: { matterId: matter.id, status } });
      setMatter((m) => (m ? { ...m, status: updated.status } : m));
      const label = matter.type === "CONTRACT" ? (CONTRACT_STATUS_LABEL[status] ?? STATUS_LABEL[status]) : STATUS_LABEL[status];
      toast.success(`Marked as ${label}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change status");
    } finally {
      setTransitioning(false);
    }
  }

  async function markComplete() {
    if (!matter) return;
    setComplianceBusy(true);
    try {
      const updated = await markComplianceCompleteFn({ data: matter.id });
      setMatter((m) => (m ? { ...m, status: updated.status } : m));
      toast.success("Marked complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not mark complete");
    } finally {
      setComplianceBusy(false);
    }
  }

  async function reopenCompliance() {
    if (!matter) return;
    setComplianceBusy(true);
    try {
      const updated = await reopenComplianceItemFn({ data: matter.id });
      setMatter((m) => (m ? { ...m, status: updated.status } : m));
      toast.success("Reopened");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reopen");
    } finally {
      setComplianceBusy(false);
    }
  }

  if (loading) return null;
  if (!matter || !company) return <p className="text-sm text-muted">Matter not found.</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/companies/$companyId"
          params={{ companyId: company.id }}
          className="text-xs font-medium uppercase tracking-widest text-muted underline"
        >
          ← {company.name}
        </Link>
        <h1 className="mt-1 font-display text-3xl">{matter.title}</h1>
        <p className="mt-1 text-sm text-muted">{MATTER_TYPE_LABEL[matter.type]}</p>
      </div>

      {isComplianceMatterType(matter.type) && (
        <ComplianceSummaryCard
          item={matter}
          onMarkComplete={markComplete}
          onReopen={reopenCompliance}
          busy={complianceBusy}
        />
      )}

      {matter.type !== "CONTRACT" && (
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Status</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-fg">
              {STATUS_LABEL[matter.status]}
            </span>
            {nextStatuses(matter.status).map((s) => (
              <Button
                key={s}
                type="button"
                variant="secondary"
                disabled={transitioning}
                onClick={() => transition(s)}
              >
                Mark {STATUS_LABEL[s]}
              </Button>
            ))}
          </div>
        </section>
      )}

      {matter.type === "FINANCIAL_STATEMENTS" && (
        <AccountsMatter matter={matter} company={company} />
      )}
      {matter.type === "FORM_A" && <FormAMatter matter={matter} company={company} />}
      {matter.type === "FORM_9" && <Form9Matter matter={matter} company={company} />}
      {matter.type === "CONTRACT" && (
        <ContractMatter matter={matter} onAdvance={transition} transitioning={transitioning} />
      )}
      {matter.type === "INCOME_TAX_RETURN" && <IncomeTaxMatter matter={matter} company={company} />}

      <DocumentVault scope={{ type: "company", companyId: company.id, matterId: matter.id }} />
      {isComplianceMatterType(matter.type) && (
        <>
          <ComplianceNotes matterId={matter.id} />
          <ComplianceReminders matterId={matter.id} />
        </>
      )}
      <ClientApproval matterId={matter.id} />
      <RequestAttorneyReview
        workspaceId={matter.workspace_id}
        companyId={company.id}
        matterId={matter.id}
        matterTitle={matter.title}
      />
      <ActivityTimeline matterId={matter.id} />
    </div>
  );
}

async function saveDraft(matterId: string, data: Record<string, unknown>) {
  try {
    await updateMatterDataFn({ data: { matterId, data: data as Record<string, Json> } });
    toast.success("Draft saved");
  } catch {
    toast.error("Could not save draft");
  }
}

function AccountsMatter({ matter, company }: { matter: MatterWithData; company: Company }) {
  const saved = matter.data as Partial<AccountsInput>;
  const [form, setForm] = useState<AccountsInput>({
    companyName: saved.companyName ?? company.name,
    cuin: saved.cuin ?? company.cuin ?? "",
    kind: saved.kind ?? toAccountsKind(company.company_type),
    paidUp: saved.paidUp ?? Number(company.paid_up_capital ?? 0),
    publicLinked: saved.publicLinked ?? company.public_linked,
    fyEnd: saved.fyEnd ?? company.financial_year_end ?? "",
    agmDate: saved.agmDate ?? company.agm_date ?? "",
    incorporationDate: saved.incorporationDate ?? company.incorporation_date ?? "",
    turnover: saved.turnover ?? Number(company.turnover ?? 0),
    employees: saved.employees ?? company.employees ?? 0,
    hasSubsidiary: saved.hasSubsidiary ?? company.has_subsidiary,
  });
  function set<K extends keyof AccountsInput>(k: K, v: AccountsInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  const advice = useMemo(() => classifyAccounts(form), [form]);
  const pack = useMemo(() => generateAccountsPack(form, advice), [form, advice]);
  return (
    <SplitScreen
      form={
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Financial year end">
              <Input
                type="date"
                value={form.fyEnd}
                onChange={(e) => set("fyEnd", e.target.value)}
              />
            </Field>
            <Field label="AGM date">
              <Input
                type="date"
                value={form.agmDate}
                onChange={(e) => set("agmDate", e.target.value)}
              />
            </Field>
            <Field label="Paid-up capital (PKR)">
              <Input
                type="number"
                value={form.paidUp || ""}
                onChange={(e) => set("paidUp", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Turnover (PKR)">
              <Input
                type="number"
                value={form.turnover || ""}
                onChange={(e) => set("turnover", Number(e.target.value) || 0)}
              />
            </Field>
          </div>
          <Button type="button" className="mt-4" onClick={() => saveDraft(matter.id, form)}>
            Save draft
          </Button>
        </section>
      }
      preview={
        <>
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <h2 className="font-display text-2xl">{advice.bucket}</h2>
          </section>
          <Flags flags={advice.flags} />
          <PackOutput text={pack} filename="secp-financial-statements-memo.txt" />
        </>
      }
    />
  );
}

function FormAMatter({ matter, company }: { matter: MatterWithData; company: Company }) {
  const saved = matter.data as Partial<FormAInput>;
  const [form, setForm] = useState<FormAInput>({
    companyName: saved.companyName ?? company.name,
    kind: saved.kind ?? toFormAKind(company.company_type),
    paidUp: saved.paidUp ?? Number(company.paid_up_capital ?? 0),
    changed: saved.changed ?? true,
    agmDate: saved.agmDate ?? company.agm_date ?? "",
    fyEnd: saved.fyEnd ?? company.financial_year_end ?? "",
  });
  function set<K extends keyof FormAInput>(k: K, v: FormAInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  const advice = useMemo(() => formAAdvice(form), [form]);
  return (
    <SplitScreen
      form={
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="AGM date">
              <Input
                type="date"
                value={form.agmDate}
                onChange={(e) => set("agmDate", e.target.value)}
              />
            </Field>
            <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.changed}
                onChange={(e) => set("changed", e.target.checked)}
              />
              Particulars changed since last return (officers, members, capital, address)
            </label>
          </div>
          <Button type="button" className="mt-4" onClick={() => saveDraft(matter.id, form)}>
            Save draft
          </Button>
        </section>
      }
      preview={
        <>
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-muted">File</p>
            <p className="font-display text-2xl">{advice.which}</p>
            <p className="mt-1 text-sm text-muted">Due {advice.due ?? "30 days after AGM"}</p>
          </div>
          <Flags flags={advice.flags} />
          <PackOutput text={advice.pack} filename="secp-form-a-memo.txt" />
        </>
      }
    />
  );
}

function Form9Matter({ matter, company }: { matter: MatterWithData; company: Company }) {
  const saved = matter.data as Partial<Form9Input>;
  const [form, setForm] = useState<Form9Input>({
    companyName: saved.companyName ?? company.name,
    cuin: saved.cuin ?? company.cuin ?? "",
    kind: saved.kind ?? toForm9Kind(company.company_type),
    currentDirectors: saved.currentDirectors ?? 2,
    event: saved.event ?? "replace",
    incomingName: saved.incomingName ?? "",
    incomingCnic: saved.incomingCnic ?? "",
    outgoingName: saved.outgoingName ?? "",
    outgoingCnic: saved.outgoingCnic ?? "",
    modeIn: saved.modeIn ?? "Appointed",
    modeOut: saved.modeOut ?? "Resigned",
    effectiveDate: saved.effectiveDate ?? "",
    designation: saved.designation ?? "Director",
  });
  function set<K extends keyof Form9Input>(k: K, v: Form9Input[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  const advice = useMemo(() => form9Advice(form), [form]);
  return (
    <SplitScreen
      form={
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Event">
              <Select
                value={form.event}
                onChange={(e) => set("event", e.target.value as Form9Input["event"])}
              >
                <option value="induct">Induct</option>
                <option value="cease">Cease</option>
                <option value="replace">Replace</option>
                <option value="particulars">Change particulars only</option>
              </Select>
            </Field>
            <Field label="Effective date">
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => set("effectiveDate", e.target.value)}
              />
            </Field>
            <Field label="Directors now">
              <Input
                type="number"
                value={form.currentDirectors}
                onChange={(e) => set("currentDirectors", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Designation">
              <Select value={form.designation} onChange={(e) => set("designation", e.target.value)}>
                <option>Director</option>
                <option>Chief Executive</option>
                <option>CFO</option>
                <option>Company Secretary</option>
              </Select>
            </Field>
            <Field label="Incoming name">
              <Input
                value={form.incomingName}
                onChange={(e) => set("incomingName", e.target.value)}
              />
            </Field>
            <Field label="Incoming CNIC">
              <Input
                value={form.incomingCnic}
                onChange={(e) => set("incomingCnic", e.target.value)}
              />
            </Field>
            <Field label="Outgoing name">
              <Input
                value={form.outgoingName}
                onChange={(e) => set("outgoingName", e.target.value)}
              />
            </Field>
            <Field label="Outgoing CNIC">
              <Input
                value={form.outgoingCnic}
                onChange={(e) => set("outgoingCnic", e.target.value)}
              />
            </Field>
          </div>
          <Button type="button" className="mt-4" onClick={() => saveDraft(matter.id, form)}>
            Save draft
          </Button>
        </section>
      }
      preview={
        <>
          <Flags flags={advice.flags} />
          <PackOutput text={advice.pack} filename="secp-form-9-director-change.txt" />
        </>
      }
    />
  );
}

function ContractMatter({
  matter,
  onAdvance,
  transitioning,
}: {
  matter: MatterWithData;
  onAdvance: (status: MatterStatus) => void;
  transitioning: boolean;
}) {
  // `contractTypeId` is the current field name; `id` is read for matters saved
  // by the earlier, pre-library version of this page.
  const saved = matter.data as Partial<ContractDraftState> & { contractTypeId?: string; id?: string };
  const typeId = saved.contractTypeId ?? saved.id ?? "service";
  const [state, setState] = useState<ContractDraftState>(() => normalizeContractDraft(saved));
  const [saving, setSaving] = useState(false);
  const readOnly = matter.status === "signed" || matter.status === "filed" || matter.status === "closed";

  function onChange(updater: (s: ContractDraftState) => ContractDraftState) {
    setState((s) => updater(s));
  }

  async function save() {
    setSaving(true);
    try {
      await updateMatterDataFn({
        data: { matterId: matter.id, data: { contractTypeId: typeId, ...state } as Record<string, Json> },
      });
      toast.success("Draft saved");
    } catch {
      toast.error("Could not save draft");
    } finally {
      setSaving(false);
    }
  }

  async function restoreVersion(version: ContractVersion) {
    const restored = normalizeContractDraft(version.data as Partial<ContractDraftState>);
    setState(restored);
    await updateMatterDataFn({
      data: { matterId: matter.id, data: { contractTypeId: typeId, ...restored } as Record<string, Json> },
    });
  }

  const draftText = useMemo(
    () => generateContract(typeId, state.a, state.b, state.city, state.extra, state.clauses),
    [typeId, state],
  );

  return (
    <>
      <ContractStatusStepper status={matter.status} onAdvance={onAdvance} busy={transitioning} />
      <ContractWorkspace
        typeId={typeId}
        state={state}
        onChange={onChange}
        readOnly={readOnly}
        actionsSlot={
          !readOnly ? (
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save draft"}
            </Button>
          ) : undefined
        }
        footerSlot={
          <ContractVersionHistory
            matterId={matter.id}
            contractType={typeId}
            currentData={{ contractTypeId: typeId, ...state }}
            draftText={draftText}
            onRestore={restoreVersion}
            readOnly={readOnly}
          />
        }
      />
    </>
  );
}

function IncomeTaxMatter({ matter, company }: { matter: MatterWithData; company: Company }) {
  const saved = matter.data as Partial<IncomeTaxInput>;
  const [form, setForm] = useState<IncomeTaxInput>({
    taxYear: saved.taxYear ?? String(new Date().getFullYear()),
    salaryIncome: saved.salaryIncome ?? 0,
    businessRevenue: saved.businessRevenue ?? 0,
    businessExpenses: saved.businessExpenses ?? 0,
    propertyIncome: saved.propertyIncome ?? 0,
    capitalGains: saved.capitalGains ?? 0,
    otherIncome: saved.otherIncome ?? 0,
    foreignIncome: saved.foreignIncome ?? 0,
    taxDeductedAtSource: saved.taxDeductedAtSource ?? 0,
    notes: saved.notes ?? "",
  });
  function set<K extends keyof IncomeTaxInput>(k: K, v: IncomeTaxInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  const summary = useMemo(() => summarizeIncomeTax(form), [form]);
  const memo = useMemo(
    () => generateIncomeTaxMemo({ name: company.name, ntn: company.ntn }, form),
    [company.name, company.ntn, form],
  );
  const numberField = (key: keyof IncomeTaxInput, label: string) => (
    <Field label={label}>
      <Input
        type="number"
        value={(form[key] as number) || ""}
        onChange={(e) => set(key, Number(e.target.value) || (0 as IncomeTaxInput[typeof key]))}
      />
    </Field>
  );
  return (
    <SplitScreen
      form={
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <p className="text-xs uppercase tracking-wide text-muted">
            What happened financially this year? Enter what applies — leave the rest at zero.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Tax year">
              <Input value={form.taxYear} onChange={(e) => set("taxYear", e.target.value)} />
            </Field>
            {numberField("salaryIncome", "Salary income (PKR)")}
            {numberField("businessRevenue", "Business revenue (PKR)")}
            {numberField("businessExpenses", "Business expenses (PKR)")}
            {numberField("propertyIncome", "Rent / property income (PKR)")}
            {numberField("capitalGains", "Capital gains (PKR)")}
            {numberField("otherIncome", "Other income (PKR)")}
            {numberField("foreignIncome", "Foreign-source income (PKR)")}
            {numberField("taxDeductedAtSource", "Tax already withheld/deducted (PKR)")}
            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
          </div>
          <Button type="button" className="mt-4" onClick={() => saveDraft(matter.id, form)}>
            Save draft
          </Button>
        </section>
      }
      preview={
        <>
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Total declared income</p>
            <p className="font-display text-2xl">
              PKR {Math.round(summary.totalDeclaredIncome).toLocaleString("en-PK")}
            </p>
            <p className="mt-1 text-xs text-muted">
              Data only — not a tax computation. Rates and credits depend on the current Finance
              Act.
            </p>
          </div>
          <PackOutput text={memo} filename="income-tax-return-memo.txt" />
        </>
      }
    />
  );
}
