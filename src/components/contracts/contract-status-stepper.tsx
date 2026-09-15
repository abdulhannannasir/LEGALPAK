import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canTransition, type MatterStatus } from "@/lib/legalpak/workflow";

/**
 * Every contract's lifecycle, start to finish. Reuses the SAME `matter.status`
 * state machine every other matter type already has (see
 * lib/legalpak/workflow.ts) — "Final" is just this UI's label for the
 * generic "approved" status — so nothing new needs to be taught to the
 * server, the audit log, or the compliance dashboard. `filed`/`closed` exist
 * in that state machine for SECP filings and are simply never offered here.
 */
const CONTRACT_STAGES: { status: MatterStatus; label: string; hint: string }[] = [
  { status: "draft", label: "Draft", hint: "Being drafted and edited" },
  { status: "review", label: "Review", hint: "Out for internal or client review" },
  { status: "approved", label: "Final", hint: "Wording locked — ready to sign" },
  { status: "signed", label: "Signed", hint: "Executed by both parties" },
];

/** For UI copy elsewhere (e.g. the status-change toast) that needs the contract-flavored label for a status. */
export const CONTRACT_STATUS_LABEL: Partial<Record<MatterStatus, string>> = Object.fromEntries(
  CONTRACT_STAGES.map((s) => [s.status, s.label]),
);

export function ContractStatusStepper({
  status,
  onAdvance,
  busy = false,
}: {
  status: MatterStatus;
  onAdvance: (next: MatterStatus) => void;
  busy?: boolean;
}) {
  const currentIndex = CONTRACT_STAGES.findIndex((s) => s.status === status);
  const isPastEnd = currentIndex === -1; // filed/closed — treat as "beyond signed"
  const nextInStages = isPastEnd
    ? null
    : CONTRACT_STAGES.find((s, i) => i === currentIndex + 1 && canTransition(status, s.status));
  const canGoBackToDraft = status === "review";

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Contract status</p>
      <ol className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
        {CONTRACT_STAGES.map((stage, i) => {
          const done = !isPastEnd && i < currentIndex;
          const current = !isPastEnd && i === currentIndex;
          const reached = isPastEnd || done || current;
          return (
            <li key={stage.status} className="flex items-center gap-1.5 sm:gap-2">
              {i > 0 && <span className="h-px w-4 bg-border sm:w-6" aria-hidden />}
              <span
                title={stage.hint}
                className={
                  current
                    ? "flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-fg"
                    : reached
                      ? "flex items-center gap-1.5 rounded-full border border-primary px-3 py-1 text-xs font-medium text-primary"
                      : "flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted"
                }
              >
                {done && <Check className="size-3" strokeWidth={2} />}
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-wrap gap-2">
        {canGoBackToDraft && (
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onAdvance("draft")}>
            Back to draft
          </Button>
        )}
        {nextInStages && (
          <Button type="button" variant="secondary" disabled={busy} onClick={() => onAdvance(nextInStages.status)}>
            Mark as {nextInStages.label}
          </Button>
        )}
      </div>
      {status === "signed" && (
        <p className="mt-3 text-xs text-muted">
          This contract is signed and locked for editing, including its saved versions. Draft a
          new contract for any amendment.
        </p>
      )}
    </section>
  );
}
