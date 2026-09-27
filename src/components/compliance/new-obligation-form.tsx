import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { COMPLIANCE_CATEGORIES, COMPLIANCE_CATEGORY_LABEL } from "@/lib/legalpak/compliance-rules";
import {
  COMPLIANCE_PRIORITIES,
  COMPLIANCE_PRIORITY_LABEL,
  OBLIGATION_RECURRENCE_OPTIONS,
  createComplianceObligationFn,
  type CreateComplianceObligationInput,
} from "@/lib/legalpak/compliance-obligations";

/** The manual side of "Create compliance obligations" — for anything a rule hasn't generated yet. */
export function NewObligationForm({
  companies,
  onCreated,
  onCancel,
}: {
  companies: [string, string][];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [companyId, setCompanyId] = useState(companies[0]?.[0] ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CreateComplianceObligationInput["category"]>("other");
  const [authority, setAuthority] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<CreateComplianceObligationInput["priority"]>("medium");
  const [recurring, setRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<CreateComplianceObligationInput["recurrenceRule"]>("annual");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!companyId || !title.trim()) {
      toast.error("Pick a company and give the obligation a title");
      return;
    }
    setSaving(true);
    try {
      await createComplianceObligationFn({
        data: {
          companyId,
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          authority: authority.trim() || undefined,
          dueDate: dueDate || undefined,
          priority,
          recurring,
          recurrenceRule: recurring ? recurrenceRule : undefined,
        },
      });
      toast.success("Obligation created");
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create obligation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="font-display text-xl">New compliance obligation</h2>
      <p className="mt-1 text-sm text-muted">
        For anything that doesn't yet have a verified rule generating it automatically.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Company">
          <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            {companies.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Renew trade license" />
        </Field>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
            {COMPLIANCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {COMPLIANCE_CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Authority">
          <Input value={authority} onChange={(e) => setAuthority(e.target.value)} placeholder="e.g. Excise & Taxation Department" />
        </Field>
        <Field label="Due date">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
            {COMPLIANCE_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {COMPLIANCE_PRIORITY_LABEL[p]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
          Recurring
        </label>
        {recurring && (
          <Field label="Recurs">
            <Select value={recurrenceRule} onChange={(e) => setRecurrenceRule(e.target.value as typeof recurrenceRule)}>
              {OBLIGATION_RECURRENCE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r === "annual" ? "Annually" : r === "quarterly" ? "Quarterly" : "Monthly"}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="button" disabled={saving} onClick={submit}>
          {saving ? "Creating…" : "Create obligation"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
