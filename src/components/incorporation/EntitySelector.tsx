import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { ENTITY_TYPES, type EntityTypeId } from "@/lib/incorporation/secp-rules";

export function EntitySelector({
  value,
  onChange,
}: {
  value: EntityTypeId;
  onChange: (id: EntityTypeId) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ENTITY_TYPES.map((e) => {
        const selected = e.id === value;
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => onChange(e.id)}
            className={`flex flex-col items-start gap-2 rounded-[var(--radius-lg)] border p-5 text-left transition-colors ${
              selected ? "border-accent bg-surface" : "border-border bg-surface hover:border-accent/60"
            }`}
          >
            <div className="flex w-full items-start justify-between gap-2">
              <h3 className="font-display text-lg">{e.title}</h3>
              {selected && <CheckCircle2 className="size-5 shrink-0 text-accent" strokeWidth={1.75} />}
            </div>
            <p className="text-xs uppercase tracking-wide text-muted">
              {e.regulator} · {e.governingLaw}
            </p>
            <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
              <dt>Min. {e.id === "llp" ? "designated partners" : "directors"}</dt>
              <dd className="text-right font-medium text-fg">{e.minDirectors || "—"}</dd>
              <dt>Min. shareholders</dt>
              <dd className="text-right font-medium text-fg">{e.minShareholders}</dd>
              <dt>Liability</dt>
              <dd className="text-right font-medium text-fg">
                {e.liability.startsWith("Limited") ? "Limited" : "Unlimited"}
              </dd>
            </dl>
            {!e.isSecpEntity && (
              <p className="mt-1 flex items-start gap-1.5 text-xs text-danger">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
                Not an SECP entity — no eZfile filing applies.
              </p>
            )}
            <ul className="mt-2 space-y-1 text-xs text-muted">
              {e.notes.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}
