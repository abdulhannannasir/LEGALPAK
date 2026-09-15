import { Check } from "lucide-react";

/** Two-step progress indicator shared by every help-desk questionnaire. */
export function StepProgress({ step, labels }: { step: 1 | 2; labels: [string, string] }) {
  return (
    <div className="flex items-center gap-3 text-xs font-medium text-muted">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                done
                  ? "border-accent bg-accent text-primary-fg"
                  : active
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-border text-muted"
              }`}
            >
              {done ? <Check className="size-3" strokeWidth={2.5} /> : n}
            </span>
            <span className={active ? "text-fg" : undefined}>{label}</span>
            {i === 0 && <span className="h-px w-6 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
