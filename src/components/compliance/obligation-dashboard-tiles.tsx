import type { ComplianceObligationStatus } from "@/lib/legalpak/compliance-obligations";
import { COMPLIANCE_OBLIGATION_STATUS_LABEL } from "@/lib/legalpak/compliance-obligations";
import { cn } from "@/lib/cn";

const STATUS_TILES: { key: ComplianceObligationStatus; tone: "danger" | "warn" | "muted" | "accent" | "success" }[] = [
  { key: "overdue", tone: "danger" },
  { key: "due_soon", tone: "warn" },
  { key: "upcoming", tone: "muted" },
  { key: "in_progress", tone: "accent" },
  { key: "completed", tone: "success" },
];

const TONE_CLASS: Record<(typeof STATUS_TILES)[number]["tone"], string> = {
  danger: "text-danger",
  warn: "text-warn",
  muted: "text-fg",
  accent: "text-accent",
  success: "text-success",
};

/**
 * The Compliance Health dashboard: one clickable tile per status (filters
 * the list/calendar below), plus two rolling-window stat cards — This
 * Month and Next 30 Days — and a footnote for obligations still waiting on
 * a verified rule (`due_date` is null, never a guessed date).
 */
export function ComplianceDashboardTiles({
  counts,
  configurationRequiredCount,
  thisMonthCount,
  next30Count,
  active,
  onSelect,
}: {
  counts: Record<ComplianceObligationStatus, number>;
  configurationRequiredCount: number;
  thisMonthCount: number;
  next30Count: number;
  active?: ComplianceObligationStatus | "all";
  onSelect?: (key: ComplianceObligationStatus | "all") => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUS_TILES.map((t) => {
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
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {COMPLIANCE_OBLIGATION_STATUS_LABEL[t.key]}
              </p>
              <p className={`mt-1 font-display text-3xl ${TONE_CLASS[t.tone]}`}>{counts[t.key]}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">This month</p>
          <p className="mt-1 font-display text-2xl">{thisMonthCount}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Next 30 days</p>
          <p className="mt-1 font-display text-2xl">{next30Count}</p>
        </div>
      </div>

      {configurationRequiredCount > 0 && (
        <p className="text-xs text-muted">
          + {configurationRequiredCount} item{configurationRequiredCount === 1 ? "" : "s"} with no computed due date —
          configuration required.
        </p>
      )}
    </div>
  );
}
