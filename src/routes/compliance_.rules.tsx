import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, ShieldCheck, ShieldQuestion } from "lucide-react";
import { RequireSubscription } from "@/components/billing/RequireSubscription";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  COMPLIANCE_CATEGORIES,
  COMPLIANCE_CATEGORY_LABEL,
  createComplianceRuleFn,
  deleteComplianceRuleFn,
  listComplianceRulesFn,
  updateComplianceRuleFn,
  type ApplicabilityConditions,
  type ComplianceRule,
  type RecurrenceConfig,
  type RecurrenceFrequency,
} from "@/lib/legalpak/compliance-rules";

export const Route = createFileRoute("/compliance_/rules")({
  component: () => (
    <RequireSubscription>
      <RulesPage />
    </RequireSubscription>
  ),
  head: () => ({
    meta: [{ title: "Compliance rules — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function RulesPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <RulesBody />;
}

type Draft = {
  name: string;
  authority: string;
  category: (typeof COMPLIANCE_CATEGORIES)[number];
  deadlineLogic: string;
  deadlineReady: boolean;
  active: boolean;
  sourceReference: string;
  sourceVerifiedOn: string;
  requiredDocuments: string;
  companyType: string;
  publicLinked: "" | "true" | "false";
  hasSubsidiary: "" | "true" | "false";
  minEmployees: string;
  minPaidUpCapital: string;
  minTurnover: string;
  frequency: "" | RecurrenceFrequency;
  anchor: "" | NonNullable<RecurrenceConfig["anchor"]>;
  offsetDays: string;
  fixedMonth: string;
  fixedDay: string;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  authority: "",
  category: "other",
  deadlineLogic: "",
  deadlineReady: false,
  active: false,
  sourceReference: "",
  sourceVerifiedOn: "",
  requiredDocuments: "",
  companyType: "",
  publicLinked: "",
  hasSubsidiary: "",
  minEmployees: "",
  minPaidUpCapital: "",
  minTurnover: "",
  frequency: "",
  anchor: "",
  offsetDays: "",
  fixedMonth: "",
  fixedDay: "",
};

function ruleToDraft(r: ComplianceRule): Draft {
  const c = r.applicability_conditions;
  const rec = r.recurrence;
  return {
    name: r.name,
    authority: r.authority,
    category: r.category,
    deadlineLogic: r.deadline_logic,
    deadlineReady: r.deadline_ready,
    active: r.active,
    sourceReference: r.source_reference,
    sourceVerifiedOn: r.source_verified_on ?? "",
    requiredDocuments: r.required_documents.join("\n"),
    companyType: c.companyType?.join(", ") ?? "",
    publicLinked: c.publicLinked === undefined ? "" : c.publicLinked ? "true" : "false",
    hasSubsidiary: c.hasSubsidiary === undefined ? "" : c.hasSubsidiary ? "true" : "false",
    minEmployees: c.minEmployees?.toString() ?? "",
    minPaidUpCapital: c.minPaidUpCapital?.toString() ?? "",
    minTurnover: c.minTurnover?.toString() ?? "",
    frequency: rec?.frequency ?? "",
    anchor: rec?.anchor ?? "",
    offsetDays: rec?.offsetDays?.toString() ?? "",
    fixedMonth: rec?.fixedMonth?.toString() ?? "",
    fixedDay: rec?.fixedDay?.toString() ?? "",
  };
}

function draftToApplicability(d: Draft): ApplicabilityConditions {
  const out: ApplicabilityConditions = {};
  if (d.companyType.trim()) out.companyType = d.companyType.split(",").map((s) => s.trim()).filter(Boolean);
  if (d.publicLinked) out.publicLinked = d.publicLinked === "true";
  if (d.hasSubsidiary) out.hasSubsidiary = d.hasSubsidiary === "true";
  if (d.minEmployees) out.minEmployees = Number(d.minEmployees);
  if (d.minPaidUpCapital) out.minPaidUpCapital = Number(d.minPaidUpCapital);
  if (d.minTurnover) out.minTurnover = Number(d.minTurnover);
  return out;
}

function draftToRecurrence(d: Draft): RecurrenceConfig | undefined {
  if (!d.frequency) return undefined;
  const rec: RecurrenceConfig = { frequency: d.frequency };
  if (d.anchor) rec.anchor = d.anchor;
  if (d.offsetDays) rec.offsetDays = Number(d.offsetDays);
  if (d.fixedMonth) rec.fixedMonth = Number(d.fixedMonth);
  if (d.fixedDay) rec.fixedDay = Number(d.fixedDay);
  return rec;
}

function RuleForm({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <Field label="Name">
        <Input value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} />
      </Field>
      <Field label="Authority">
        <Input value={draft.authority} onChange={(e) => onChange({ ...draft, authority: e.target.value })} />
      </Field>
      <Field label="Category">
        <Select value={draft.category} onChange={(e) => onChange({ ...draft, category: e.target.value as Draft["category"] })}>
          {COMPLIANCE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {COMPLIANCE_CATEGORY_LABEL[c]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Required documents (one per line)">
        <Textarea
          value={draft.requiredDocuments}
          onChange={(e) => onChange({ ...draft, requiredDocuments: e.target.value })}
          className="min-h-16"
        />
      </Field>

      <Field label="Deadline logic (human description)" className="sm:col-span-2">
        <Textarea
          value={draft.deadlineLogic}
          onChange={(e) => onChange({ ...draft, deadlineLogic: e.target.value })}
          placeholder="e.g. Due 30 days after the AGM, per Companies Act 2017 s.130"
          className="min-h-16"
        />
      </Field>
      <Field label="Source / citation">
        <Input
          value={draft.sourceReference}
          onChange={(e) => onChange({ ...draft, sourceReference: e.target.value })}
          placeholder="Statute, regulation or notification"
        />
      </Field>
      <Field label="Verified on">
        <Input type="date" value={draft.sourceVerifiedOn} onChange={(e) => onChange({ ...draft, sourceVerifiedOn: e.target.value })} />
      </Field>

      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.deadlineReady}
          onChange={(e) => onChange({ ...draft, deadlineReady: e.target.checked })}
        />
        Deadline logic verified — safe to auto-compute a due date
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={draft.active} onChange={(e) => onChange({ ...draft, active: e.target.checked })} />
        Active — generates obligations
      </label>

      <fieldset className="sm:col-span-2">
        <legend className="text-xs font-medium uppercase tracking-wide text-muted">Applies to companies where…</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Field label="Company type(s), comma-separated">
            <Input
              value={draft.companyType}
              onChange={(e) => onChange({ ...draft, companyType: e.target.value })}
              placeholder="private, smc"
            />
          </Field>
          <Field label="Public-linked">
            <Select value={draft.publicLinked} onChange={(e) => onChange({ ...draft, publicLinked: e.target.value as Draft["publicLinked"] })}>
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </Field>
          <Field label="Has subsidiary">
            <Select value={draft.hasSubsidiary} onChange={(e) => onChange({ ...draft, hasSubsidiary: e.target.value as Draft["hasSubsidiary"] })}>
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </Field>
          <Field label="Min. employees">
            <Input type="number" value={draft.minEmployees} onChange={(e) => onChange({ ...draft, minEmployees: e.target.value })} />
          </Field>
          <Field label="Min. paid-up capital (PKR)">
            <Input type="number" value={draft.minPaidUpCapital} onChange={(e) => onChange({ ...draft, minPaidUpCapital: e.target.value })} />
          </Field>
          <Field label="Min. turnover (PKR)">
            <Input type="number" value={draft.minTurnover} onChange={(e) => onChange({ ...draft, minTurnover: e.target.value })} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="sm:col-span-2">
        <legend className="text-xs font-medium uppercase tracking-wide text-muted">Recurrence</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Field label="Frequency">
            <Select value={draft.frequency} onChange={(e) => onChange({ ...draft, frequency: e.target.value as Draft["frequency"] })}>
              <option value="">Not computable yet</option>
              <option value="annual">Annual</option>
              <option value="quarterly">Quarterly</option>
              <option value="monthly">Monthly</option>
              <option value="once">One-off</option>
            </Select>
          </Field>
          <Field label="Anchored to">
            <Select value={draft.anchor} onChange={(e) => onChange({ ...draft, anchor: e.target.value as Draft["anchor"] })}>
              <option value="">Fixed calendar date</option>
              <option value="financial_year_end">Financial year end</option>
              <option value="incorporation_date">Incorporation date</option>
              <option value="agm_date">AGM date</option>
              <option value="period_end">End of the month/quarter</option>
            </Select>
          </Field>
          <Field label="Offset days after anchor">
            <Input type="number" value={draft.offsetDays} onChange={(e) => onChange({ ...draft, offsetDays: e.target.value })} />
          </Field>
          <Field label="Fixed month (annual, no anchor)">
            <Input type="number" min={1} max={12} value={draft.fixedMonth} onChange={(e) => onChange({ ...draft, fixedMonth: e.target.value })} />
          </Field>
          <Field label="Fixed day">
            <Input type="number" min={1} max={31} value={draft.fixedDay} onChange={(e) => onChange({ ...draft, fixedDay: e.target.value })} />
          </Field>
        </div>
      </fieldset>

      <div className="flex gap-2 sm:col-span-2">
        <Button type="button" disabled={saving} onClick={onSave}>
          {saving ? "Saving…" : "Save rule"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function RulesBody() {
  const [rules, setRules] = useState<ComplianceRule[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  function refresh() {
    listComplianceRulesFn()
      .then(setRules)
      .catch(() => toast.error("Could not load compliance rules"));
  }
  useEffect(refresh, []);

  async function createRule() {
    if (!newDraft.name.trim() || !newDraft.authority.trim()) {
      toast.error("Give the rule a name and an authority");
      return;
    }
    setSaving(true);
    try {
      await createComplianceRuleFn({
        data: {
          name: newDraft.name.trim(),
          authority: newDraft.authority.trim(),
          category: newDraft.category,
          applicabilityConditions: draftToApplicability(newDraft),
          recurrence: draftToRecurrence(newDraft),
          deadlineLogic: newDraft.deadlineLogic,
          deadlineReady: newDraft.deadlineReady,
          requiredDocuments: newDraft.requiredDocuments.split("\n").map((s) => s.trim()).filter(Boolean),
          active: newDraft.active,
          sourceReference: newDraft.sourceReference,
          sourceVerifiedOn: newDraft.sourceVerifiedOn || undefined,
        },
      });
      toast.success("Rule created");
      setCreating(false);
      setNewDraft(EMPTY_DRAFT);
      refresh();
    } catch (e) {
      handleError(e);
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(ruleId: string) {
    if (!editDraft) return;
    setSaving(true);
    try {
      await updateComplianceRuleFn({
        data: {
          ruleId,
          name: editDraft.name.trim(),
          authority: editDraft.authority.trim(),
          category: editDraft.category,
          applicabilityConditions: draftToApplicability(editDraft),
          recurrence: draftToRecurrence(editDraft) ?? null,
          deadlineLogic: editDraft.deadlineLogic,
          deadlineReady: editDraft.deadlineReady,
          requiredDocuments: editDraft.requiredDocuments.split("\n").map((s) => s.trim()).filter(Boolean),
          active: editDraft.active,
          sourceReference: editDraft.sourceReference,
          sourceVerifiedOn: editDraft.sourceVerifiedOn || undefined,
        },
      });
      toast.success("Rule updated");
      setEditingId(null);
      setEditDraft(null);
      refresh();
    } catch (e) {
      handleError(e);
    } finally {
      setSaving(false);
    }
  }

  async function remove(ruleId: string) {
    if (!window.confirm("Delete this rule? Obligations it already created stay put.")) return;
    try {
      await deleteComplianceRuleFn({ data: ruleId });
      toast.success("Rule deleted");
      refresh();
    } catch (e) {
      handleError(e);
    }
  }

  function handleError(e: unknown) {
    const message = e instanceof Error ? e.message : "Something went wrong";
    if (message.includes("Forbidden") || message.includes("Not authorized")) {
      setForbidden(true);
      toast.error("Only an admin can edit compliance rules");
    } else {
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/compliance" className="text-xs font-medium uppercase tracking-widest text-muted underline">
            <ArrowLeft className="mr-1 inline size-3" strokeWidth={1.75} />
            Compliance center
          </Link>
          <h1 className="mt-1 font-display text-3xl">Compliance rules</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Structured configuration for the rule engine — no deadline here is treated as authoritative law until a
            human sets "Deadline logic verified" and cites a source. An active-but-unverified rule still generates a
            placeholder obligation, flagged "Configuration required" instead of a guessed date.
          </p>
        </div>
        {!forbidden && (
          <Button type="button" onClick={() => setCreating((v) => !v)}>
            <Plus className="size-4" strokeWidth={1.75} />
            New rule
          </Button>
        )}
      </div>

      {forbidden && (
        <p className="rounded-[var(--radius-md)] border border-warn bg-flag-med px-4 py-3 text-sm">
          You can view configured rules, but only an admin can create, edit or delete them.
        </p>
      )}

      {creating && (
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h2 className="font-display text-xl">New rule</h2>
          <RuleForm draft={newDraft} onChange={setNewDraft} onSave={createRule} onCancel={() => setCreating(false)} saving={saving} />
        </section>
      )}

      {rules === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : rules.length === 0 ? (
        <p className="text-sm text-muted">No compliance rules configured yet.</p>
      ) : (
        <div className="space-y-3">
          {rules.map((r) => (
            <section key={r.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg">{r.name}</p>
                  <p className="text-xs text-muted">
                    {COMPLIANCE_CATEGORY_LABEL[r.category]} · {r.authority}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.deadline_ready ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-success bg-flag-low px-2.5 py-0.5 text-[11px] font-medium">
                      <ShieldCheck className="size-3.5" strokeWidth={1.75} />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-warn bg-flag-med px-2.5 py-0.5 text-[11px] font-medium">
                      <ShieldQuestion className="size-3.5" strokeWidth={1.75} />
                      Configuration required
                    </span>
                  )}
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                      r.active ? "border-accent text-accent" : "border-border text-muted"
                    }`}
                  >
                    {r.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {r.deadline_logic && <p className="mt-2 text-sm">{r.deadline_logic}</p>}
              {r.source_reference && (
                <p className="mt-1 text-xs text-muted">
                  Source: {r.source_reference}
                  {r.source_verified_on ? ` · verified ${r.source_verified_on}` : ""}
                </p>
              )}

              {editingId === r.id && editDraft ? (
                <RuleForm
                  draft={editDraft}
                  onChange={setEditDraft}
                  onSave={() => saveEdit(r.id)}
                  onCancel={() => {
                    setEditingId(null);
                    setEditDraft(null);
                  }}
                  saving={saving}
                />
              ) : (
                !forbidden && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(r.id);
                        setEditDraft(ruleToDraft(r));
                      }}
                    >
                      Edit
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => remove(r.id)}>
                      Delete
                    </Button>
                  </div>
                )
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
