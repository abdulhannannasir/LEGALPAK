import type { ComplianceHealth } from "@/lib/legalpak/compliance";

const TILES: { key: ComplianceHealth; label: string; tone: "danger" | "warn" | "muted" | "success" }[] = [
  { key: "overdue", label: "Overdue", tone: "danger" },
  { key: "due_soon", label: "Due soon", tone: "warn" },
  { key: "upcoming", label: "Upcoming", tone: "muted" },
  { key: "completed", label: "Completed", tone: "success" },
];

const TONE_CLASS: Record<(typeof TILES)[number]["tone"], string> = {
  danger: "text-danger",
  warn: "text-warn",
  muted: "text-fg",
  success: "text-success",
};

/** The four Compliance Health tiles. `unscheduled` isn't one of the four — it's surfaced as a footnote instead. */
export function ComplianceHealthTiles({ counts }: { counts: Record<ComplianceHealth, number> }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TILES.map((t) => (
          <div key={t.key} className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{t.label}</p>
            <p className={`mt-1 font-display text-3xl ${TONE_CLASS[t.tone]}`}>{counts[t.key]}</p>
          </div>
        ))}
      </div>
      {counts.unscheduled > 0 && (
        <p className="mt-2 text-xs text-muted">
          + {counts.unscheduled} item{counts.unscheduled === 1 ? "" : "s"} with no computed due date —
          verification required.
        </p>
      )}
    </div>
  );
}
