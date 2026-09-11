import { buildEzfileMapping, type IncorporationState } from "@/lib/incorporation/secp-rules";

/** Side-by-side table showing exactly what to paste into each tab of SECP's eZfile system. */
export function EzfileMappingGuide({ state }: { state: IncorporationState }) {
  const rows = buildEzfileMapping(state);
  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 print:hidden">
      <h3 className="font-display text-lg">eZfile field-mapping guide</h3>
      <p className="mt-1 text-sm text-muted">
        LegalPak prepares this execution pack — the filing itself is submitted and PIN-signed
        directly by authorized officers on SECP's eZfile portal.
      </p>
      {/* Below `sm`, a fixed-width table would hide the "value" column off-screen with no
          scroll affordance — the one thing this guide exists to show. Stack as cards instead. */}
      <div className="mt-4 space-y-3 sm:hidden">
        {rows.map((r, i) => (
          <div key={i} className="rounded-[var(--radius-md)] border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-muted">
              {r.tab} · {r.field}
            </p>
            <p className="mt-1 text-sm font-medium break-words">{r.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-2 pr-4">eZfile tab</th>
              <th className="py-2 pr-4">Field</th>
              <th className="py-2">Paste this value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="py-2 pr-4 text-muted">{r.tab}</td>
                <td className="py-2 pr-4">{r.field}</td>
                <td className="py-2 font-medium">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
