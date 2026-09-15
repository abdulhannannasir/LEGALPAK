import { Field, Input } from "@/components/ui/field";
import { estimateFees, pkr } from "@/lib/incorporation/secp-rules";
import { LegalSourceNote } from "@/components/legal-source-note";

export function CapitalStep({
  authorizedCapital,
  onAuthorizedCapitalChange,
  shareFaceValue,
  onShareFaceValueChange,
  paidUpCapital,
  onPaidUpCapitalChange,
  directorCount,
}: {
  authorizedCapital: number;
  onAuthorizedCapitalChange: (v: number) => void;
  shareFaceValue: number;
  onShareFaceValueChange: (v: number) => void;
  paidUpCapital: number;
  onPaidUpCapitalChange: (v: number) => void;
  directorCount: number;
}) {
  const fees = estimateFees(authorizedCapital, directorCount);

  return (
    <section className="space-y-5 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div>
        <h2 className="font-display text-lg">Capitalization</h2>
        <p className="mt-1 text-sm text-muted">
          Authorized capital is the ceiling you can issue shares up to; paid-up capital is what's
          actually been paid in by subscribers so far.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Authorized share capital (PKR)">
          <Input
            type="number"
            min={100_000}
            step={10_000}
            value={authorizedCapital}
            onChange={(e) => onAuthorizedCapitalChange(Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="Share face value (PKR)">
          <Input
            type="number"
            min={1}
            value={shareFaceValue}
            onChange={(e) => onShareFaceValueChange(Number(e.target.value) || 1)}
          />
        </Field>
        <Field label="Paid-up capital (PKR)">
          <Input
            type="number"
            min={0}
            max={authorizedCapital}
            value={paidUpCapital}
            onChange={(e) => onPaidUpCapitalChange(Number(e.target.value) || 0)}
          />
        </Field>
      </div>

      <div className="rounded-[var(--radius-md)] border border-border bg-bg p-4">
        <h3 className="text-sm font-medium">Estimated SECP challan</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Online name reservation</dt>
            <dd>{pkr(fees.nameReservationFee)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Capital filing fee</dt>
            <dd>{pkr(fees.capitalFilingFee)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">
              Attachment fees ({fees.attachmentCount} × PKR 600 — Form-1, MOA/AOA set, Form-28 per
              director)
            </dt>
            <dd>{pkr(fees.attachmentFees)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-medium">
            <dt>Total estimated challan</dt>
            <dd>{pkr(fees.total)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">
          Indicative only — confirm the exact amount on eZfile's own fee calculator before payment.
        </p>
      </div>

      <LegalSourceNote sourceKey="secp-incorporation-fees" />
    </section>
  );
}
