import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Flags } from "@/components/flags";
import { PackOutput } from "@/components/pack-output";
import { SplitScreen } from "@/components/split-screen";
import { usePersistedState } from "@/lib/use-persisted-state";
import { formAAdvice, type FormAInput } from "@/lib/legal/form-a";

export const Route = createFileRoute("/form-a")({
  component: FormAPage,
  head: () => ({
    meta: [
      { title: "Form A annual return — LegalPak" },
      {
        name: "description",
        content:
          "Work out Form A vs. Form 24 vs. no filing for your SECP annual return, with the AGM-plus-30-days clock, transfers, officers, and inactive Part III handled.",
      },
    ],
  }),
});

const empty: FormAInput = {
  companyName: "",
  kind: "private",
  paidUp: 10_000_000,
  changed: true,
  agmDate: "",
  fyEnd: "",
};

function FormAPage() {
  const [form, setForm] = usePersistedState<FormAInput>("legalpak:form-a", empty);
  const [show, setShow] = useState(false);
  const advice = useMemo(() => formAAdvice(form), [form]);

  function set<K extends keyof FormAInput>(k: K, v: FormAInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function generate() {
    if (!form.companyName.trim()) {
      toast.error("Enter a company name first");
      return;
    }
    setShow(true);
  }

  function reset() {
    setForm(empty);
    setShow(false);
    toast.success("Cleared — draft removed from this browser");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          s. 130 · Form A / Form 24
        </p>
        <h1 className="font-display text-3xl">Annual return</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Snapshot of officers, members and capital. Not the accounts. File within 30 days of the
          AGM.
        </p>
      </div>
      <SplitScreen
        form={
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company">
                <Input
                  value={form.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                />
              </Field>
              <Field label="Type">
                <Select
                  value={form.kind}
                  onChange={(e) => set("kind", e.target.value as FormAInput["kind"])}
                >
                  <option value="smc">SMC</option>
                  <option value="private">Private</option>
                  <option value="public">Public unlisted</option>
                  <option value="listed">Listed</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </Field>
              <Field label="Paid-up (PKR)">
                <Input
                  type="number"
                  value={form.paidUp || ""}
                  onChange={(e) => set("paidUp", Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="FY end">
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
              <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.changed}
                  onChange={(e) => set("changed", e.target.checked)}
                />
                Particulars changed since last return (officers, members, capital, address)
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" onClick={generate}>
                Decide Form A / Form 24
              </Button>
              <Button type="button" variant="ghost" onClick={reset}>
                Clear draft
              </Button>
            </div>
          </section>
        }
        preview={
          show ? (
            <>
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                <p className="text-xs uppercase tracking-wide text-muted">File</p>
                <p className="font-display text-2xl">{advice.which}</p>
                <p className="mt-1 text-sm text-muted">Due {advice.due ?? "30 days after AGM"}</p>
              </div>
              <Flags flags={advice.flags} />
              <PackOutput text={advice.pack} filename="secp-form-a-memo.txt" />
            </>
          ) : (
            <section className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
              Enter the company name and click "Decide Form A / Form 24" to see the pack here.
            </section>
          )
        }
      />
    </div>
  );
}
