import { useState } from "react";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";

export type NegotiationStance = "favorable_a" | "favorable_b" | "neutral" | "needs_negotiation";

export type NegotiationNote = {
  id: string;
  /** A clause id from CLAUSE_MODULES, or null for a general note not tied to one clause. */
  clauseId: string | null;
  stance: NegotiationStance;
  text: string;
  author: string;
  createdAt: string;
};

const STANCE_LABEL: Record<NegotiationStance, string> = {
  favorable_a: "Favours",
  favorable_b: "Favours",
  neutral: "Neutral",
  needs_negotiation: "Needs negotiation",
};

const STANCE_TONE: Record<NegotiationStance, string> = {
  favorable_a: "border-success text-success",
  favorable_b: "border-success text-success",
  neutral: "border-border text-muted",
  needs_negotiation: "border-warn text-warn",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Free-form negotiation log for a contract: track which clauses are still
 * being negotiated, whose position a clause currently favours, and why —
 * so the history of "why does clause 7 read this way" survives beyond one
 * person's memory. Persisted as part of the contract's own draft state
 * (workflow_data for a saved matter, localStorage for an unsaved draft) —
 * it's drafting annotation, not a separate record.
 */
export function NegotiationNotes({
  notes,
  partyALabel,
  partyBLabel,
  clauseOptions,
  onAdd,
  onRemove,
  readOnly = false,
}: {
  notes: NegotiationNote[];
  partyALabel: string;
  partyBLabel: string;
  clauseOptions: { id: string; label: string }[];
  onAdd: (note: Omit<NegotiationNote, "id" | "createdAt">) => void;
  onRemove: (id: string) => void;
  readOnly?: boolean;
}) {
  const [clauseId, setClauseId] = useState<string>("");
  const [stance, setStance] = useState<NegotiationStance>("neutral");
  const [text, setText] = useState("");

  function clauseLabelFor(id: string | null): string {
    if (!id) return "General";
    return clauseOptions.find((c) => c.id === id)?.label ?? id;
  }

  function submit() {
    if (!text.trim()) return;
    onAdd({ clauseId: clauseId || null, stance, text: text.trim(), author: "You" });
    setText("");
    setStance("neutral");
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="font-display text-xl">Negotiation notes</h2>
      <p className="mt-1 text-sm text-muted">
        Track open points, redlines and which side a clause currently favours as this contract
        moves back and forth.
      </p>

      {!readOnly && (
        <div className="mt-4 grid gap-3 rounded-[var(--radius-md)] border border-border bg-bg p-4 sm:grid-cols-2">
          <Field label="Clause">
            <Select value={clauseId} onChange={(e) => setClauseId(e.target.value)}>
              <option value="">General (not clause-specific)</option>
              {clauseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Position">
            <Select value={stance} onChange={(e) => setStance(e.target.value as NegotiationStance)}>
              <option value="neutral">Neutral</option>
              <option value="favorable_a">Favours {partyALabel}</option>
              <option value="favorable_b">Favours {partyBLabel}</option>
              <option value="needs_negotiation">Needs negotiation</option>
            </Select>
          </Field>
          <Field label="Note" className="sm:col-span-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Client wants the liability cap raised to 2x fees — pushed back, proposed 1.5x."
            />
          </Field>
          <div className="sm:col-span-2">
            <Button type="button" variant="secondary" onClick={submit} disabled={!text.trim()}>
              <MessageSquarePlus className="size-4" strokeWidth={1.75} />
              Add note
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No negotiation notes yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-[var(--radius-md)] border border-border bg-bg p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted">
                    {clauseLabelFor(n.clauseId)}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STANCE_TONE[n.stance]}`}
                  >
                    {STANCE_LABEL[n.stance]}
                    {n.stance === "favorable_a" ? ` ${partyALabel}` : n.stance === "favorable_b" ? ` ${partyBLabel}` : ""}
                  </span>
                  <span className="text-xs text-muted">
                    {n.author} · {formatDate(n.createdAt)}
                  </span>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => onRemove(n.id)}
                    aria-label="Remove note"
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="size-4" strokeWidth={1.75} />
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm">{n.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
