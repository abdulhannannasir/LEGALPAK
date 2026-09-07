import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { CONTRACT_TYPES, generateContract } from "@/lib/legal/contracts";

export const Route = createFileRoute("/contracts")({ component: ContractsPage });

function ContractsPage() {
  const [id, setId] = useState("service");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [city, setCity] = useState("Islamabad");
  const [extra, setExtra] = useState("");
  const [out, setOut] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Contract Act 1872</p>
        <h1 className="font-display text-3xl">Agreements</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Formal English drafts with governing law of Pakistan, jurisdiction and witnesses. Have an advocate
          stamp and review before execution.
        </p>
      </div>
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select value={id} onChange={(e) => setId(e.target.value)}>
              {CONTRACT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="City / jurisdiction">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="Party A">
            <Input value={a} onChange={(e) => setA(e.target.value)} />
          </Field>
          <Field label="Party B">
            <Input value={b} onChange={(e) => setB(e.target.value)} />
          </Field>
          <Field label="Scope / property / role" className="sm:col-span-2">
            <Textarea value={extra} onChange={(e) => setExtra(e.target.value)} />
          </Field>
        </div>
        <div className="mt-5">
          <Button type="button" onClick={() => setOut(generateContract(id, a, b, city, extra))}>
            Generate
          </Button>
        </div>
      </section>
      {out && (
        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-[var(--radius-lg)] border border-border bg-surface p-5 font-mono text-xs">
          {out}
        </pre>
      )}
    </div>
  );
}
