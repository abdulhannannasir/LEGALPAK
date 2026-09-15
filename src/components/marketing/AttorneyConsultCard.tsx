/** Compact attorney summary card shown alongside the homepage consult CTA. */
export function AttorneyConsultCard() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-primary/5 font-display text-xl text-primary ring-1 ring-border">
          AN
        </span>
        <div>
          <h3 className="font-display text-lg text-fg">Abdul Hannan Nasir</h3>
          <p className="mt-1 text-xs font-medium tracking-wide text-muted uppercase">
            Corporate &amp; Commercial Advisory
          </p>
        </div>
      </div>
      <p className="mt-5 border-t border-border pt-4 text-sm text-muted">
        Credentials, bar admission, and track record to be added.
      </p>
    </div>
  );
}
