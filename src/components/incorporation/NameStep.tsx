import { AlertTriangle } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import { PRINCIPAL_BUSINESS_LINES, checkProposedName, type PrincipalBusinessLine } from "@/lib/incorporation/secp-rules";

export function NameStep({
  names,
  onNameChange,
  principalBusiness,
  onPrincipalBusinessChange,
}: {
  names: [string, string, string];
  onNameChange: (index: 0 | 1 | 2, value: string) => void;
  principalBusiness: PrincipalBusinessLine;
  onPrincipalBusinessChange: (v: PrincipalBusinessLine) => void;
}) {
  return (
    <section className="space-y-5 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div>
        <h2 className="font-display text-lg">Proposed company names</h2>
        <p className="mt-1 text-sm text-muted">
          List three names in priority order. Each is checked against Section 10 of the Companies
          Act, 2017 for prohibited/restricted words.
        </p>
      </div>

      <div className="space-y-3">
        {([0, 1, 2] as const).map((i) => {
          const result = checkProposedName(names[i]);
          return (
            <Field key={i} label={`Priority ${i + 1}`}>
              <Input value={names[i]} onChange={(e) => onNameChange(i, e.target.value)} />
              {result.flaggedWords.length > 0 && (
                <p className="mt-1 flex items-start gap-1.5 text-xs text-danger">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
                  Contains restricted word(s) under Section 10: {result.flaggedWords.join(", ")} —
                  SECP is likely to reject this name without prior approval from the relevant
                  authority.
                </p>
              )}
            </Field>
          );
        })}
      </div>

      <Field label="Principal line of business">
        <Select
          value={principalBusiness}
          onChange={(e) => onPrincipalBusinessChange(e.target.value as PrincipalBusinessLine)}
        >
          {PRINCIPAL_BUSINESS_LINES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
      </Field>
      <p className="text-xs text-muted">
        Reminder: SECP expects the company name to signify its principal line of business — avoid a
        generic name unrelated to what the company actually does.
      </p>
    </section>
  );
}
