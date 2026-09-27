import { useMemo } from "react";
import { PackOutput } from "@/components/pack-output";
import { SplitScreen } from "@/components/split-screen";
import { Field, Input } from "@/components/ui/field";
import { generateShareTransfer, type ShareTransferInput } from "@/lib/incorporation/share-changes";

export function ShareTransferPanel({
  form,
  onChange,
}: {
  form: ShareTransferInput;
  onChange: (form: ShareTransferInput) => void;
}) {
  function set<K extends keyof ShareTransferInput>(k: K, v: ShareTransferInput[K]) {
    onChange({ ...form, [k]: v });
  }
  const hasAnyValue =
    form.companyName.trim() !== "" && form.transferorName.trim() !== "" && form.transfereeName.trim() !== "";
  const out = useMemo(() => (hasAnyValue ? generateShareTransfer(form) : ""), [form, hasAnyValue]);

  return (
    <SplitScreen
      form={
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h2 className="font-display text-lg">Share Transfer Deed</h2>
          <p className="mt-1 text-sm text-muted">
            Transfer of existing shares between holders — update the Register of Members once
            executed. Not itself an SECP eZfile form, but stamp duty applies under the provincial
            Stamp Act.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Company name">
              <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </Field>
            <Field label="CUIN">
              <Input value={form.cuin} onChange={(e) => set("cuin", e.target.value)} />
            </Field>
            <Field label="Transferor name">
              <Input value={form.transferorName} onChange={(e) => set("transferorName", e.target.value)} />
            </Field>
            <Field label="Transferor CNIC">
              <Input value={form.transferorCnic} onChange={(e) => set("transferorCnic", e.target.value)} />
            </Field>
            <Field label="Transferee name">
              <Input value={form.transfereeName} onChange={(e) => set("transfereeName", e.target.value)} />
            </Field>
            <Field label="Transferee CNIC">
              <Input value={form.transfereeCnic} onChange={(e) => set("transfereeCnic", e.target.value)} />
            </Field>
            <Field label="Number of shares">
              <Input
                type="number"
                min={0}
                value={form.numberOfShares}
                onChange={(e) => set("numberOfShares", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Price per share (PKR)">
              <Input
                type="number"
                min={0}
                value={form.pricePerShare}
                onChange={(e) => set("pricePerShare", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Transfer date">
              <Input type="date" value={form.transferDate} onChange={(e) => set("transferDate", e.target.value)} />
            </Field>
            <Field label="Board approval date">
              <Input
                type="date"
                value={form.boardApprovalDate}
                onChange={(e) => set("boardApprovalDate", e.target.value)}
              />
            </Field>
          </div>
        </section>
      }
      preview={
        out ? (
          <PackOutput text={out} filename="share-transfer-deed.txt" title="Share Transfer Deed" />
        ) : (
          <section className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
            Fill in the company, transferor and transferee to generate the transfer deed.
          </section>
        )
      }
    />
  );
}
