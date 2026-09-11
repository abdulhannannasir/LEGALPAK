/** Dark-glass counterpart to AttorneyProfile for the luxury marketing shell. */
export function LuxuryAttorneyCard() {
  return (
    <div className="rounded-2xl border border-[var(--lux-border)] bg-white/[0.03] p-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-full border border-[var(--lux-border-strong)] text-lg text-[var(--lux-gold)]"
          style={{ fontFamily: "var(--font-lux-display)" }}
        >
          AN
        </span>
        <div>
          <h3
            className="text-lg text-[var(--lux-fg)]"
            style={{ fontFamily: "var(--font-lux-serif)" }}
          >
            Abdul Hannan Nasir
          </h3>
          <p className="text-xs tracking-wide text-[var(--lux-muted)] uppercase">
            Corporate &amp; Commercial Advisory
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-[var(--lux-muted)] italic">
        Credentials, bar admission, and track record to be added.
      </p>
    </div>
  );
}
