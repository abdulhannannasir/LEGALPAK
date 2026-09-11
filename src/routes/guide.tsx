import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/guide")({
  component: GuidePage,
  head: () => ({
    meta: [
      { title: "Filing guide — LegalPak" },
      {
        name: "description",
        content:
          "A plain-language walkthrough of SECP's eZfile system and its forms — what to prepare before you start a filing in Pakistan.",
      },
    ],
  }),
});

function GuidePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">When and where</h1>
      <p className="max-w-2xl text-sm text-muted">
        eZfile (leap.secp.gov.pk) is the live channel for incorporation and most returns. Legacy eServices
        remains for charges, foreign companies, easy exit and winding-up. There is no public filing API.
      </p>
      {(() => {
        const ROWS: [event: string, instrument: string, deadline: string, portal: string][] = [
          ["Director / officer change", "Form 9 (old 29)", "15 days", "eZfile"],
          ["Annual return", "Form A or Form 24", "30 days after AGM", "eZfile"],
          ["Audited FS (s. 233 filers)", "Signed PDF pack", "15 days after AGM (listed: 30)", "eZfile"],
          ["AGM", "s. 132", "120 days from FY end; first AGM 16 months", "—"],
          ["UBO", "Form 19", "With annual return / 30 days after year-end", "eZfile"],
          ["Share allotment", "Form 3", "45 days", "eZfile"],
          ["Registered office", "Form 21", "15 days", "eZfile"],
          ["Charge on assets", "Form 10", "30 days", "eServices"],
        ];
        return (
          <>
            {/* Below `sm`, a fixed-width table hides Deadline/Portal off-screen with no scroll
                affordance — stack each row as a card instead. */}
            <div className="space-y-3 sm:hidden">
              {ROWS.map(([event, instrument, deadline, portal]) => (
                <div key={event} className="rounded-[var(--radius-lg)] border border-border bg-surface p-3 text-sm">
                  <p className="font-medium">{event}</p>
                  <p className="mt-1 text-xs text-muted">{instrument}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span>{deadline}</span>
                    <span className="text-muted">{portal}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface sm:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="p-3">Event</th>
                    <th className="p-3">Instrument</th>
                    <th className="p-3">Deadline</th>
                    <th className="p-3">Portal</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row[0]} className="border-b border-border last:border-0">
                      {row.map((c) => (
                        <td key={c} className="p-3">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}
    </div>
  );
}
