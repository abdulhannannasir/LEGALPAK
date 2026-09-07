import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Flags } from "@/components/flags";
import { form9Advice, type Form9Event, type Form9Input } from "@/lib/legal/form9";

export const Route = createFileRoute("/form-9")({ component: Form9Page });

function Form9Page() {
  const [form, setForm] = useState<Form9Input>({
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
  });
  const [show, setShow] = useState(false);
  const advice = useMemo(() => form9Advice(form), [form]);

  function set<K extends keyof Form9Input>(k: K, v: Form9Input[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Form 9 · old Form 29</p>
        <h1 className="font-display text-3xl">Director and officer change</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          15 days from the effective date. eZfile process: Induction, Cessation and change in particulars.
          Consent is still required even though Form 28 was merged.
        </p>
      </div>
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company">
            <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
          </Field>
          <Field label="CUIN">
            <Input value={form.cuin} onChange={(e) => set("cuin", e.target.value)} />
          </Field>
          <Field label="Type">
            <Select value={form.kind} onChange={(e) => set("kind", e.target.value as Form9Input["kind"])}>
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
            <Select value={form.event} onChange={(e) => set("event", e.target.value as Form9Event)}>
              <option value="induct">Induct</option>
              <option value="cease">Cease</option>
              <option value="replace">Replace (same process)</option>
              <option value="particulars">Change particulars only</option>
            </Select>
          </Field>
          <Field label="Designation">
            <Select value={form.designation} onChange={(e) => set("designation", e.target.value)}>
              <option>Director</option>
              <option>Chief Executive</option>
              <option>CFO</option>
              <option>Company Secretary</option>
              <option>Auditor</option>
              <option>Legal Adviser</option>
            </Select>
          </Field>
          <Field label="Effective date">
            <Input type="date" value={form.effectiveDate} onChange={(e) => set("effectiveDate", e.target.value)} />
          </Field>
          <Field label="File by (auto)">
            <Input readOnly value={advice.due ?? ""} />
          </Field>
          <Field label="Incoming name">
            <Input value={form.incomingName} onChange={(e) => set("incomingName", e.target.value)} />
          </Field>
          <Field label="Incoming CNIC">
            <Input value={form.incomingCnic} onChange={(e) => set("incomingCnic", e.target.value)} />
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
            <Input value={form.outgoingName} onChange={(e) => set("outgoingName", e.target.value)} />
          </Field>
          <Field label="Outgoing CNIC">
            <Input value={form.outgoingCnic} onChange={(e) => set("outgoingCnic", e.target.value)} />
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
        <div className="mt-5">
          <Button type="button" onClick={() => setShow(true)}>
            Generate Form 9 pack
          </Button>
        </div>
      </section>
      {show && (
        <>
          <Flags flags={advice.flags} />
          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-[var(--radius-lg)] border border-border bg-surface p-5 font-mono text-xs">
            {advice.pack}
          </pre>
        </>
      )}
    </div>
  );
}
