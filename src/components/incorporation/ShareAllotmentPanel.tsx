import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PackOutput } from "@/components/pack-output";
import { SplitScreen } from "@/components/split-screen";
import { Field, Input } from "@/components/ui/field";
import {
  emptyAllottee,
  generateShareAllotment,
  totalAllottedShares,
  type ShareAllotmentInput,
} from "@/lib/incorporation/share-changes";
import { createId } from "@/lib/legalpak/id";

export function ShareAllotmentPanel({
  form,
  onChange,
}: {
  form: ShareAllotmentInput;
  onChange: (form: ShareAllotmentInput) => void;
}) {
  function set<K extends keyof ShareAllotmentInput>(k: K, v: ShareAllotmentInput[K]) {
    onChange({ ...form, [k]: v });
  }
  function updateAllottee(id: string, patch: Partial<ShareAllotmentInput["allottees"][number]>) {
    set(
      "allottees",
      form.allottees.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
  }
  function addAllottee() {
    set("allottees", [...form.allottees, emptyAllottee(createId("allottee"))]);
  }
  function removeAllottee(id: string) {
    set("allottees", form.allottees.filter((a) => a.id !== id));
  }

  const hasAnyValue = form.companyName.trim() !== "" && form.allottees.length > 0;
  const out = useMemo(() => (hasAnyValue ? generateShareAllotment(form) : ""), [form, hasAnyValue]);
  const total = totalAllottedShares(form.allottees);

  return (
    <SplitScreen
      form={
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h2 className="font-display text-lg">Form 3 — Return of Allotment of Shares</h2>
          <p className="mt-1 text-sm text-muted">
            File within 30 days of allotting new shares — Section 73, Companies Act 2017.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Company name">
              <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </Field>
            <Field label="CUIN">
              <Input value={form.cuin} onChange={(e) => set("cuin", e.target.value)} />
            </Field>
            <Field label="Allotment date">
              <Input type="date" value={form.allotmentDate} onChange={(e) => set("allotmentDate", e.target.value)} />
            </Field>
            <Field label="Board resolution date">
              <Input
                type="date"
                value={form.boardResolutionDate}
                onChange={(e) => set("boardResolutionDate", e.target.value)}
              />
            </Field>
            <Field label="Nominal value per share (PKR)">
              <Input
                type="number"
                min={0}
                value={form.shareFaceValue}
                onChange={(e) => set("shareFaceValue", Number(e.target.value) || 0)}
              />
            </Field>
          </div>

          <div className="mt-4 space-y-4">
            {form.allottees.map((a, i) => (
              <div key={a.id} className="rounded-[var(--radius-md)] border border-border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Allottee {i + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeAllottee(a.id)}
                    className="text-muted hover:text-danger"
                    aria-label="Remove"
                  >
                    <Trash2 className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Full name">
                    <Input value={a.fullName} onChange={(e) => updateAllottee(a.id, { fullName: e.target.value })} />
                  </Field>
                  <Field label="CNIC / Passport">
                    <Input
                      value={a.cnicOrPassport}
                      onChange={(e) => updateAllottee(a.id, { cnicOrPassport: e.target.value })}
                    />
                  </Field>
                  <Field label="Address" className="sm:col-span-2">
                    <Input value={a.address} onChange={(e) => updateAllottee(a.id, { address: e.target.value })} />
                  </Field>
                  <Field label="Shares allotted">
                    <Input
                      type="number"
                      min={0}
                      value={a.numberOfShares}
                      onChange={(e) => updateAllottee(a.id, { numberOfShares: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Amount paid per share (PKR)">
                    <Input
                      type="number"
                      min={0}
                      value={a.amountPaidPerShare}
                      onChange={(e) => updateAllottee(a.id, { amountPaidPerShare: Number(e.target.value) || 0 })}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="secondary" className="mt-4" onClick={addAllottee}>
            <Plus className="size-4" strokeWidth={1.75} />
            Add allottee
          </Button>

          {form.allottees.length > 0 && (
            <p className="mt-3 text-xs text-muted">Total shares allotted: {total}</p>
          )}
        </section>
      }
      preview={
        out ? (
          <PackOutput text={out} filename="form-3-return-of-allotment.txt" title="Form 3" />
        ) : (
          <section className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
            Add the company name and at least one allottee to generate Form 3.
          </section>
        )
      }
    />
  );
}
