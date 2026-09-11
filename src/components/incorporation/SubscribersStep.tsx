import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import {
  emptySubscriber,
  officerLabel,
  validateSubscribers,
  type EntityTypeId,
  type Subscriber,
} from "@/lib/incorporation/secp-rules";
import { createId } from "@/lib/legalpak/id";

export function SubscribersStep({
  entityType,
  subscribers,
  onChange,
  section153Confirmed,
  onSection153Change,
}: {
  entityType: EntityTypeId;
  subscribers: Subscriber[];
  onChange: (subscribers: Subscriber[]) => void;
  section153Confirmed: boolean;
  onSection153Change: (v: boolean) => void;
}) {
  const label = officerLabel(entityType);
  const validation = validateSubscribers(entityType, subscribers);

  function update(id: string, patch: Partial<Subscriber>) {
    onChange(subscribers.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function add(nominee = false) {
    onChange([...subscribers, { ...emptySubscriber(createId("sub")), isNominee: nominee }]);
  }
  function remove(id: string) {
    onChange(subscribers.filter((s) => s.id !== id));
  }

  return (
    <section className="space-y-5 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div>
        <h2 className="font-display text-lg">Subscribers & {label.toLowerCase()}s</h2>
        <p className="mt-1 text-sm text-muted">
          Add every subscriber/{label.toLowerCase()}. Share percentages must total 100%.
        </p>
      </div>

      <div className="rounded-[var(--radius-md)] border border-border bg-bg p-3 text-xs text-muted">
        Mobile numbers must be registered against the respective CNIC with biometric verification —
        SECP sends the 4-digit digital PIN via OTP to that number.
      </div>

      <div className="space-y-4">
        {subscribers.map((s, i) => (
          <div key={s.id} className="rounded-[var(--radius-md)] border border-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                {s.isNominee ? "Nominee Director" : `Subscriber ${i + 1}`}
              </h3>
              <button
                type="button"
                onClick={() => remove(s.id)}
                className="text-muted hover:text-danger"
                aria-label="Remove"
              >
                <Trash2 className="size-4" strokeWidth={1.75} />
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Full legal name">
                <Input value={s.fullName} onChange={(e) => update(s.id, { fullName: e.target.value })} />
              </Field>
              <Field label="Father's / spouse's name">
                <Input value={s.parentName} onChange={(e) => update(s.id, { parentName: e.target.value })} />
              </Field>
              <Field label="CNIC / NICOP / Passport">
                <Input value={s.cnic} onChange={(e) => update(s.id, { cnic: e.target.value })} />
              </Field>
              <Field label="Registered address">
                <Input value={s.address} onChange={(e) => update(s.id, { address: e.target.value })} />
              </Field>
              <Field label="Mobile number">
                <Input value={s.mobile} onChange={(e) => update(s.id, { mobile: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" value={s.email} onChange={(e) => update(s.id, { email: e.target.value })} />
              </Field>
              <Field label="Share %">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  disabled={s.isNominee}
                  value={s.sharePercent}
                  onChange={(e) => update(s.id, { sharePercent: Number(e.target.value) || 0 })}
                />
              </Field>
              {!s.isNominee && (
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={s.isOfficer}
                    onChange={(e) => update(s.id, { isOfficer: e.target.checked })}
                  />
                  Also a {label.toLowerCase()}
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => add(false)}>
          <Plus className="size-4" strokeWidth={1.75} />
          Add subscriber
        </Button>
        {entityType === "smc" && !subscribers.some((s) => s.isNominee) && (
          <Button type="button" variant="ghost" onClick={() => add(true)}>
            <Plus className="size-4" strokeWidth={1.75} />
            Add nominee director
          </Button>
        )}
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={section153Confirmed}
          onChange={(e) => onSection153Change(e.target.checked)}
        />
        <span>
          I confirm that no {label.toLowerCase()} named above is an undischarged insolvent or has
          been convicted of an offence involving fraud or moral turpitude (Section 153, Companies
          Act, 2017).
        </span>
      </label>

      {!validation.ok && (
        <div className="space-y-1 rounded-[var(--radius-md)] border border-danger bg-flag-high p-3 text-xs text-danger">
          {validation.issues.map((issue) => (
            <p key={issue} className="flex items-start gap-1.5">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
              {issue}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
