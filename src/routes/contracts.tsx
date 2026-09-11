import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PackOutput } from "@/components/pack-output";
import { SplitScreen } from "@/components/split-screen";
import { usePersistedState } from "@/lib/use-persisted-state";
import { CONTRACT_TYPES, contractPartyLabels, generateContract } from "@/lib/legal/contracts";
import { CLAUSE_MODULES } from "@/lib/legal/clauses";

export const Route = createFileRoute("/contracts")({
  component: ContractsPage,
  head: () => ({
    meta: [
      { title: "Contracts — LegalPak" },
      {
        name: "description",
        content:
          "Draft service, employment, rent, bayana, NDA, partnership, joint venture, loan, power of attorney, and shareholders' agreements under Pakistan's Contract Act 1872.",
      },
    ],
  }),
});

type Draft = { id: string; a: string; b: string; city: string; extra: string; clauses: string[] };

const empty: Draft = { id: "service", a: "", b: "", city: "Islamabad", extra: "", clauses: [] };

function ContractsPage() {
  const [draft, setDraft] = usePersistedState<Draft>("legalpak:contracts", empty);
  const { id, a, b, city, extra, clauses = [] } = draft;
  const labels = contractPartyLabels(id);
  const hasParties = a.trim() !== "" && b.trim() !== "";
  const out = useMemo(
    () => (hasParties ? generateContract(id, a, b, city, extra, clauses) : ""),
    [id, a, b, city, extra, clauses, hasParties],
  );

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function toggleClause(clauseId: string) {
    setDraft((d) => {
      const current = d.clauses ?? [];
      return {
        ...d,
        clauses: current.includes(clauseId)
          ? current.filter((c) => c !== clauseId)
          : [...current, clauseId],
      };
    });
  }

  function sample() {
    setDraft({
      id: "service",
      a: "Horizon Manufacturing (Pvt) Ltd",
      b: "Nimbus Consulting Services",
      city: "Lahore",
      extra: "Provision of monthly bookkeeping and tax-filing support.",
      clauses: ["confidentiality", "force_majeure"],
    });
  }

  function reset() {
    setDraft(empty);
    toast.success("Cleared — draft removed from this browser");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Contract Act 1872
        </p>
        <h1 className="font-display text-3xl">Agreements</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Formal English drafts with governing law of Pakistan, jurisdiction and witnesses. The
          draft updates live as you type. Have an advocate stamp and review before execution.
        </p>
      </div>

      <SplitScreen
        form={
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <Select value={id} onChange={(e) => set("id", e.target.value)}>
                  {CONTRACT_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="City / jurisdiction">
                <Input value={city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label={labels.a}>
                <Input value={a} onChange={(e) => set("a", e.target.value)} />
              </Field>
              <Field label={labels.b}>
                <Input value={b} onChange={(e) => set("b", e.target.value)} />
              </Field>
              <Field label="Scope / property / role" className="sm:col-span-2">
                <Textarea value={extra} onChange={(e) => set("extra", e.target.value)} />
              </Field>
            </div>

            <fieldset className="mt-5">
              <legend className="text-xs font-medium uppercase tracking-wide text-muted">
                Additional clauses (optional)
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {CLAUSE_MODULES.map((m) => (
                  <label key={m.id} className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={clauses.includes(m.id)}
                      onChange={() => toggleClause(m.id)}
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 flex flex-wrap gap-2">
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
          out ? (
            <PackOutput text={out} filename={`${id}-agreement.txt`} />
          ) : (
            <section className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
              Enter {labels.a} and {labels.b} to see the draft appear here.
            </section>
          )
        }
      />
    </div>
  );
}
