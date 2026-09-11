export function AttorneyProfile() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <div className="flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary font-display text-xl text-primary-fg">
          AN
        </span>
        <div>
          <h3 className="font-display text-xl">Abdul Hannan Nasir</h3>
          <p className="text-sm text-muted">Corporate &amp; Commercial Advisory</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted italic">
        Credentials, bar admission, and track record to be added.
      </p>
    </div>
  );
}
