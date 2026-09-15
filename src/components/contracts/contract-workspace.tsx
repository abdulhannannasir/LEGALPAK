import { type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Flags } from "@/components/flags";
import { PackOutput } from "@/components/pack-output";
import { SplitScreen } from "@/components/split-screen";
import {
  contractPartyLabels,
  contractType,
  generateContract,
} from "@/lib/legal/contracts";
import { CLAUSE_MODULES, recommendedClauseIds } from "@/lib/legal/clauses";
import { computeContractRiskFlags } from "@/lib/legal/contract-guidance";
import { NegotiationNotes, type NegotiationNote } from "./negotiation-notes";

export type ContractDraftState = {
  a: string;
  b: string;
  city: string;
  extra: string;
  clauses: string[];
  negotiationNotes: NegotiationNote[];
};

export function emptyContractDraft(): ContractDraftState {
  return { a: "", b: "", city: "Islamabad", extra: "", clauses: [], negotiationNotes: [] };
}

/** Normalizes whatever was persisted (an older shape, partial data) into a complete draft state. */
export function normalizeContractDraft(saved: Partial<ContractDraftState> | undefined | null): ContractDraftState {
  const base = emptyContractDraft();
  if (!saved) return base;
  return {
    a: saved.a ?? base.a,
    b: saved.b ?? base.b,
    city: saved.city ?? base.city,
    extra: saved.extra ?? base.extra,
    clauses: Array.isArray(saved.clauses) ? saved.clauses : base.clauses,
    negotiationNotes: Array.isArray(saved.negotiationNotes) ? saved.negotiationNotes : base.negotiationNotes,
  };
}

function localId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `note_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/**
 * The core questionnaire → draft → risk flags → clause explanations →
 * negotiation notes experience for one contract, shared between the unsaved
 * library workspace (`/contracts/$typeId`) and a saved matter's contract
 * page (`/matters/$matterId`). Persistence (localStorage vs. the matter's
 * workflow_data) and lifecycle chrome (status stepper, version history) are
 * the CALLER's job — passed in as slots — so this component only ever knows
 * about one contract's in-memory state.
 */
export function ContractWorkspace({
  typeId,
  state,
  onChange,
  readOnly = false,
  headerSlot,
  actionsSlot,
  footerSlot,
}: {
  typeId: string;
  state: ContractDraftState;
  onChange: (updater: (s: ContractDraftState) => ContractDraftState) => void;
  readOnly?: boolean;
  headerSlot?: ReactNode;
  actionsSlot?: ReactNode;
  footerSlot?: ReactNode;
}) {
  const type = contractType(typeId);
  const labels = contractPartyLabels(typeId);
  const { a, b, city, extra, clauses, negotiationNotes } = state;

  const draftText = generateContract(typeId, a, b, city, extra, clauses);
  const flags = computeContractRiskFlags(typeId, { a, b, city, extra, clauses });
  const recommended = recommendedClauseIds(typeId);
  const missingRecommended = recommended.filter((id) => !clauses.includes(id));

  function set<K extends keyof ContractDraftState>(key: K, value: ContractDraftState[K]) {
    onChange((s) => ({ ...s, [key]: value }));
  }

  function toggleClause(clauseId: string) {
    if (readOnly) return;
    onChange((s) => ({
      ...s,
      clauses: s.clauses.includes(clauseId) ? s.clauses.filter((c) => c !== clauseId) : [...s.clauses, clauseId],
    }));
  }

  function addAllRecommended() {
    onChange((s) => ({ ...s, clauses: Array.from(new Set([...s.clauses, ...recommended])) }));
  }

  function addNote(note: Omit<NegotiationNote, "id" | "createdAt">) {
    onChange((s) => ({
      ...s,
      negotiationNotes: [{ ...note, id: localId(), createdAt: new Date().toISOString() }, ...s.negotiationNotes],
    }));
  }

  function removeNote(id: string) {
    onChange((s) => ({ ...s, negotiationNotes: s.negotiationNotes.filter((n) => n.id !== id) }));
  }

  return (
    <div className="space-y-6">
      {headerSlot}

      <SplitScreen
        form={
          <>
            <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City / jurisdiction">
                  <Input value={city} disabled={readOnly} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <Field label={labels.a}>
                  <Input value={a} disabled={readOnly} onChange={(e) => set("a", e.target.value)} />
                </Field>
                <Field label={labels.b}>
                  <Input value={b} disabled={readOnly} onChange={(e) => set("b", e.target.value)} />
                </Field>
                <Field label={type?.extraLabel || "Details"} className="sm:col-span-2">
                  <Textarea
                    value={extra}
                    disabled={readOnly}
                    placeholder={type?.extraPlaceholder}
                    onChange={(e) => set("extra", e.target.value)}
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg">Clauses</h2>
                  <p className="text-xs text-muted">
                    Toggle clauses on or off. Expand one to see what it does and what's at risk if it's left out.
                  </p>
                </div>
                {!readOnly && missingRecommended.length > 0 && (
                  <Button type="button" variant="ghost" onClick={addAllRecommended}>
                    <Sparkles className="size-4" strokeWidth={1.75} />
                    Add {missingRecommended.length} recommended
                  </Button>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {CLAUSE_MODULES.map((m) => {
                  const isRecommended = recommended.includes(m.id);
                  const checked = clauses.includes(m.id);
                  return (
                    <details
                      key={m.id}
                      className="rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2"
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={readOnly}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleClause(m.id)}
                        />
                        <span className="font-medium">{m.label}</span>
                        {isRecommended && (
                          <span className="rounded-full border border-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                            Recommended
                          </span>
                        )}
                      </summary>
                      <div className="mt-2 space-y-1.5 border-t border-border pt-2 text-xs text-muted">
                        <p>{m.explanation}</p>
                        <p>
                          <span className="font-medium text-fg">If omitted: </span>
                          {m.riskIfOmitted}
                        </p>
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>

            {actionsSlot}
          </>
        }
        preview={
          <>
            <Flags flags={flags} />
            <PackOutput
              text={draftText}
              filename={`${typeId}-agreement.txt`}
              title={type?.title ?? "Contract"}
            />
            <NegotiationNotes
              notes={negotiationNotes}
              partyALabel={labels.a}
              partyBLabel={labels.b}
              clauseOptions={clauses.map((id) => ({
                id,
                label: CLAUSE_MODULES.find((m) => m.id === id)?.label ?? id,
              }))}
              onAdd={addNote}
              onRemove={removeNote}
              readOnly={readOnly}
            />
          </>
        }
      />

      {footerSlot}
    </div>
  );
}
