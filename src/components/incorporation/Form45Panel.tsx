import { useMemo } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PackOutput } from "@/components/pack-output";
import { SplitScreen } from "@/components/split-screen";
import { Field, Input, Select } from "@/components/ui/field";
import {
  NATURE_OF_CONTROL_OPTIONS,
  emptyBeneficialOwner,
  generateForm45,
  isAboveUboThreshold,
  type Form45Input,
} from "@/lib/incorporation/corporate-filings";
import { createId } from "@/lib/legalpak/id";

export function Form45Panel({
  form,
  onChange,
}: {
  form: Form45Input;
  onChange: (form: Form45Input) => void;
}) {
  function set<K extends keyof Form45Input>(k: K, v: Form45Input[K]) {
    onChange({ ...form, [k]: v });
  }
  function updateOwner(id: string, patch: Partial<Form45Input["owners"][number]>) {
    set(
      "owners",
      form.owners.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    );
  }
  function addOwner() {
    set("owners", [...form.owners, emptyBeneficialOwner(createId("ubo"))]);
  }
  function removeOwner(id: string) {
    set("owners", form.owners.filter((o) => o.id !== id));
  }

  const hasAnyValue = form.companyName.trim() !== "" && form.owners.length > 0;
  const out = useMemo(() => (hasAnyValue ? generateForm45(form) : ""), [form, hasAnyValue]);
  const noneAboveThreshold = form.owners.length > 0 && !form.owners.some(isAboveUboThreshold);

  return (
    <SplitScreen
      form={
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h2 className="font-display text-lg">Form 45 — Ultimate Beneficial Ownership</h2>
          <p className="mt-1 text-sm text-muted">
            Section 123A — declare any natural person holding 25%+ of shares/voting rights, or
            otherwise exercising significant control.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Company name">
              <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </Field>
            <Field label="CUIN">
              <Input value={form.cuin} onChange={(e) => set("cuin", e.target.value)} />
            </Field>
            <Field label="NTN">
              <Input value={form.ntn} onChange={(e) => set("ntn", e.target.value)} />
            </Field>
          </div>

          <div className="mt-4 space-y-4">
            {form.owners.map((o, i) => (
              <div key={o.id} className="rounded-[var(--radius-md)] border border-border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Beneficial owner {i + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeOwner(o.id)}
                    className="text-muted hover:text-danger"
                    aria-label="Remove"
                  >
                    <Trash2 className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Full name">
                    <Input value={o.fullName} onChange={(e) => updateOwner(o.id, { fullName: e.target.value })} />
                  </Field>
                  <Field label="CNIC / Passport">
                    <Input
                      value={o.cnicOrPassport}
                      onChange={(e) => updateOwner(o.id, { cnicOrPassport: e.target.value })}
                    />
                  </Field>
                  <Field label="Nationality">
                    <Input value={o.nationality} onChange={(e) => updateOwner(o.id, { nationality: e.target.value })} />
                  </Field>
                  <Field label="UBO since">
                    <Input
                      type="date"
                      value={o.dateBecameUbo}
                      onChange={(e) => updateOwner(o.id, { dateBecameUbo: e.target.value })}
                    />
                  </Field>
                  <Field label="Shares held (%)">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={o.percentShares}
                      onChange={(e) => updateOwner(o.id, { percentShares: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Voting rights (%)">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={o.percentVotingRights}
                      onChange={(e) => updateOwner(o.id, { percentVotingRights: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Nature of control" className="sm:col-span-2">
                    <Select
                      value={o.natureOfControl}
                      onChange={(e) => updateOwner(o.id, { natureOfControl: e.target.value })}
                    >
                      {NATURE_OF_CONTROL_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="secondary" className="mt-4" onClick={addOwner}>
            <Plus className="size-4" strokeWidth={1.75} />
            Add beneficial owner
          </Button>

          {noneAboveThreshold && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-danger">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
              None of the owners listed cross the 25% threshold — declare the senior managing
              official(s) who exercise control instead of leaving the register blank.
            </p>
          )}
        </section>
      }
      preview={
        out ? (
          <PackOutput text={out} filename="form-45-ubo-declaration.txt" title="Form 45" />
        ) : (
          <section className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
            Add at least one beneficial owner to generate Form 45.
          </section>
        )
      }
    />
  );
}
