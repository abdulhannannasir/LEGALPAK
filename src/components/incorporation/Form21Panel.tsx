import { useMemo } from "react";
import { PackOutput } from "@/components/pack-output";
import { SplitScreen } from "@/components/split-screen";
import { Field, Input } from "@/components/ui/field";
import { generateForm21, type Form21Input } from "@/lib/incorporation/corporate-filings";

export function Form21Panel({
  form,
  onChange,
}: {
  form: Form21Input;
  onChange: (form: Form21Input) => void;
}) {
  function set<K extends keyof Form21Input>(k: K, v: Form21Input[K]) {
    onChange({ ...form, [k]: v });
  }
  const hasAnyValue = form.companyName.trim() !== "" && form.newAddress.trim() !== "";
  const out = useMemo(() => (hasAnyValue ? generateForm21(form) : ""), [form, hasAnyValue]);

  return (
    <SplitScreen
      form={
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h2 className="font-display text-lg">Form 21 — Change of registered office</h2>
          <p className="mt-1 text-sm text-muted">
            File within the statutory period after the Board resolution approving the move.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Company name">
              <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </Field>
            <Field label="CUIN">
              <Input value={form.cuin} onChange={(e) => set("cuin", e.target.value)} />
            </Field>
            <Field label="Board resolution date">
              <Input
                type="date"
                value={form.boardResolutionDate}
                onChange={(e) => set("boardResolutionDate", e.target.value)}
              />
            </Field>
            <Field label="Effective date">
              <Input type="date" value={form.effectiveDate} onChange={(e) => set("effectiveDate", e.target.value)} />
            </Field>
            <Field label="Previous registered office" className="sm:col-span-2">
              <Input value={form.oldAddress} onChange={(e) => set("oldAddress", e.target.value)} />
            </Field>
            <Field label="New registered office" className="sm:col-span-2">
              <Input value={form.newAddress} onChange={(e) => set("newAddress", e.target.value)} />
            </Field>
            <Field label="Province">
              <Input value={form.province} onChange={(e) => set("province", e.target.value)} />
            </Field>
          </div>
        </section>
      }
      preview={
        out ? (
          <PackOutput text={out} filename="form-21-change-of-office.txt" title="Form 21" />
        ) : (
          <section className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
            Fill in the company name and new address to generate Form 21.
          </section>
        )
      }
    />
  );
}
