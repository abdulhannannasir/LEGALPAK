import type { ComplianceHealth } from "@/lib/legalpak/compliance";
import { cn } from "@/lib/cn";

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

/**
 * The four Compliance Health tiles — clickable to filter the list/calendar
 * below to that bucket. `unscheduled` isn't one of the four — it's surfaced
 * as a footnote instead.
 */
export function ComplianceHealthTiles({
  counts,
  active,
  onSelect,
}: {
  counts: Record<ComplianceHealth, number>;
  active?: ComplianceHealth | "all";
  onSelect?: (key: ComplianceHealth | "all") => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TILES.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onSelect?.(isActive ? "all" : t.key)}
              disabled={!onSelect}
              className={cn(
                "rounded-[var(--radius-lg)] border bg-surface p-4 text-left transition-colors",
                onSelect && "hover:border-accent",
                isActive ? "border-accent ring-1 ring-accent" : "border-border",
              )}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{t.label}</p>
              <p className={`mt-1 font-display text-3xl ${TONE_CLASS[t.tone]}`}>{counts[t.key]}</p>
            </button>
          );
        })}
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
