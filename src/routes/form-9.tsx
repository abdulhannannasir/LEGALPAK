import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RequireSubscription } from "@/components/billing/RequireSubscription";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Flags } from "@/components/flags";
import { PackOutput } from "@/components/pack-output";
import { SplitScreen } from "@/components/split-screen";
import { usePersistedState } from "@/lib/use-persisted-state";
import { isValidCnic, formatCnic } from "@/lib/legal/validate";
import { form9Advice, type Form9Event, type Form9Input } from "@/lib/legal/form9";

export const Route = createFileRoute("/form-9")({
  component: () => (
    <RequireSubscription>
      <Form9Page />
    </RequireSubscription>
  ),
  head: () => ({
    meta: [
      { title: "Form 9 director change — LegalPak" },
      {
        name: "description",
        content:
          "File a director induction or cessation on SECP eZfile — Form 9 (formerly Form 29), the 15-day clock, minimum board size, and the consent pack.",
      },
    ],
  }),
});

const empty: Form9Input = {
  companyName: "",
  cuin: "",
  kind: "private",
  currentDirectors: 2,
  event: "replace",
  incomingName: "",
  incomingCnic: "",
  outgoingName: "",
  outgoingCnic: "",
  modeIn: "Appointed",
  modeOut: "Resigned",
  effectiveDate: "",
  designation: "Director",
};

function Form9Page() {
  const [form, setForm] = usePersistedState<Form9Input>("legalpak:form-9", empty);
  const [show, setShow] = useState(false);
  const advice = useMemo(() => form9Advice(form), [form]);

  function set<K extends keyof Form9Input>(k: K, v: Form9Input[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function sample() {
    setForm({
      companyName: "Horizon Manufacturing (Pvt) Ltd",
      cuin: "0071234",
      kind: "private",
      currentDirectors: 2,
      event: "replace",
      incomingName: "Ayesha Raza",
      incomingCnic: "35202-1234567-1",
      outgoingName: "Bilal Ahmed",
      outgoingCnic: "35202-7654321-3",
      modeIn: "Appointed",
      modeOut: "Resigned",
      effectiveDate: new Date().toISOString().slice(0, 10),
      designation: "Director",
    });
    setShow(true);
  }

  function generate() {
    if (!form.companyName.trim()) {
      toast.error("Enter a company name first");
      return;
    }
    if (!form.effectiveDate) {
      toast.error("Set the effective date so the 15-day clock can be computed");
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
          Form 9 · old Form 29
        </p>
        <h1 className="font-display text-3xl">Director and officer change</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          15 days from the effective date. eZfile process: Induction, Cessation and change in
          particulars. Consent is still required even though Form 28 was merged.
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
              <Field label="CUIN">
                <Input value={form.cuin} onChange={(e) => set("cuin", e.target.value)} />
              </Field>
              <Field label="Type">
                <Select
                  value={form.kind}
                  onChange={(e) => set("kind", e.target.value as Form9Input["kind"])}
                >
                  <option value="smc">SMC (min 1)</option>
                  <option value="private">Private (min 2)</option>
                  <option value="public">Public (min 3)</option>
                </Select>
              </Field>
              <Field label="Directors now">
                <Input
                  type="number"
                  min={0}
                  value={form.currentDirectors}
                  onChange={(e) => set("currentDirectors", Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="Event">
                <Select
                  value={form.event}
                  onChange={(e) => set("event", e.target.value as Form9Event)}
                >
                  <option value="induct">Induct</option>
                  <option value="cease">Cease</option>
                  <option value="replace">Replace (same process)</option>
                  <option value="particulars">Change particulars only</option>
                </Select>
              </Field>
              <Field label="Designation">
                <Select
                  value={form.designation}
                  onChange={(e) => set("designation", e.target.value)}
                >
                  <option>Director</option>
                  <option>Chief Executive</option>
                  <option>CFO</option>
                  <option>Company Secretary</option>
                  <option>Auditor</option>
                  <option>Legal Adviser</option>
                </Select>
              </Field>
              <Field label="Effective date">
                <Input
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => set("effectiveDate", e.target.value)}
                />
              </Field>
              <Field label="File by (auto)">
                <Input readOnly value={advice.due ?? ""} />
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
                  maxLength={15}
                  placeholder="42101-1234567-1"
                  onChange={(e) => set("incomingCnic", formatCnic(e.target.value))}
                />
                {form.incomingCnic && !isValidCnic(form.incomingCnic) && (
                  <span className="text-xs text-warn">Needs 13 digits</span>
                )}
              </Field>
              <Field label="Mode in">
                <Select value={form.modeIn} onChange={(e) => set("modeIn", e.target.value)}>
                  <option>Appointed</option>
                  <option>Elected</option>
                  <option>Re-elected</option>
                  <option>Re-appointed</option>
                </Select>
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
                  maxLength={15}
                  placeholder="42101-1234567-1"
                  onChange={(e) => set("outgoingCnic", formatCnic(e.target.value))}
                />
                {form.outgoingCnic && !isValidCnic(form.outgoingCnic) && (
                  <span className="text-xs text-warn">Needs 13 digits</span>
                )}
              </Field>
              <Field label="Mode out">
                <Select value={form.modeOut} onChange={(e) => set("modeOut", e.target.value)}>
                  <option>Resigned</option>
                  <option>Retired</option>
                  <option>Removed</option>
                  <option>Died</option>
                  <option>Disqualified</option>
                  <option>Ceased</option>
                </Select>
              </Field>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" onClick={generate}>
                Generate Form 9 pack
              </Button>
              <Button type="button" variant="secondary" onClick={sample}>
                Load sample
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
              <Flags flags={advice.flags} />
              <PackOutput text={advice.pack} filename="secp-form-9-director-change.txt" />
            </>
          ) : (
            <section className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
              Enter the company name and effective date to generate the pack here.
            </section>
          )
        }
      />
    </div>
  );
}
