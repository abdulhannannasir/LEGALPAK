import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { registrationStatus, type Company } from "@/lib/legalpak/companies";
import { listComplianceItemsFn } from "@/lib/legalpak/compliance";
import { listComplianceObligationsFn } from "@/lib/legalpak/compliance-obligations";
import { COMPLIANCE_CATEGORY_LABEL, type ComplianceCategory } from "@/lib/legalpak/compliance-rules";
import {
  matterItemToUnified,
  obligationToUnified,
  type UnifiedComplianceItem,
} from "@/lib/legalpak/compliance-unified";
import { createMatterFn } from "@/lib/legalpak/matters";
import { listCompanyActivityFn, type AuditLogRow } from "@/lib/legalpak/audit";
import { MATTER_TYPE_LABEL, type MatterType } from "@/lib/legalpak/workflow";
import { describeAuditRow } from "@/components/activity-timeline";
import { EmptyState } from "@/components/company-health-widgets";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import {
  balanceColumns,
  breakdownByCategory,
  buildNextActions,
  describeDue,
  DUE_SOON_DAYS,
  findUntrackedRequirements,
  HEALTH_BAND_LABEL,
  HEALTH_CREDIT,
  OVERDUE_SCORE_CAP,
  PRIORITY_WEIGHT,
  stripCompanySuffix,
  summarizeCompliance,
  type CategoryBreakdown,
  type HealthBand,
  type HealthSummary,
  type ItemHealth,
  type NextAction,
  type ScoredItem,
  type StandingRequirement,
} from "@/lib/legal/compliance-health";

/** Rows shown per category before the rest are left to the full Compliance Center. */
const ROWS_PER_CATEGORY = 6;
const RECENT_ACTIVITY_ROWS = 5;

const BAND_TONE: Record<HealthBand, { text: string; bar: string }> = {
  excellent: { text: "text-success", bar: "bg-success" },
  good: { text: "text-success", bar: "bg-success" },
  attention: { text: "text-warn", bar: "bg-warn" },
  at_risk: { text: "text-danger", bar: "bg-danger" },
  not_scored: { text: "text-muted", bar: "bg-muted" },
};

const HEALTH_BADGE: Record<ItemHealth, { label: string; className: string; icon: LucideIcon }> = {
  overdue: { label: "Overdue", className: "border-danger bg-flag-high text-fg", icon: AlertTriangle },
  due_soon: { label: "Due soon", className: "border-warn bg-flag-med text-fg", icon: Clock },
  upcoming: { label: "On track", className: "border-border bg-surface text-muted", icon: Circle },
  completed: { label: "Completed", className: "border-success bg-flag-low text-fg", icon: CheckCircle2 },
  needs_setup: { label: "Setup needed", className: "border-dashed border-warn bg-surface text-muted", icon: Settings2 },
};

function categoryLabel(category: string): string {
  return COMPLIANCE_CATEGORY_LABEL[category as ComplianceCategory] ?? category;
}

/** "5 min ago", "2 days ago" — falls back to a calendar date past a month, and to the raw text if it can't be parsed. */
function formatRelative(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const minutes = Math.max(0, Math.round((now - then) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(then).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function CompanyHealthDashboard({
  workspaceId,
  company,
  companies,
  onSelectCompany,
}: {
  workspaceId: string;
  company: Company;
  companies: Company[];
  onSelectCompany: (companyId: string) => void;
}) {
  const navigate = useNavigate();
  const [allItems, setAllItems] = useState<UnifiedComplianceItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [activity, setActivity] = useState<AuditLogRow[] | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const startingRef = useRef(false);

  // Workspace-wide load, filtered per company below — switching company re-slices instead of refetching.
  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    Promise.all([listComplianceItemsFn({ data: workspaceId }), listComplianceObligationsFn({ data: workspaceId })])
      .then(([matterItems, obligations]) => {
        if (cancelled) return;
        setAllItems([
          ...matterItems.map(matterItemToUnified).filter((x): x is UnifiedComplianceItem => x !== null),
          ...obligations.map(obligationToUnified),
        ]);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setActivity(null);
    listCompanyActivityFn({ data: company.id })
      .then((rows) => !cancelled && setActivity(rows))
      .catch(() => !cancelled && setActivity([]));
    return () => {
      cancelled = true;
    };
  }, [company.id]);

  const items = useMemo(() => (allItems ?? []).filter((i) => i.companyId === company.id), [allItems, company.id]);
  const summary = useMemo(() => summarizeCompliance(items), [items]);
  const untracked = useMemo(() => findUntrackedRequirements(items), [items]);
  const actions = useMemo(
    () => buildNextActions(summary.items, untracked, company.name),
    [summary, untracked, company.name],
  );
  const breakdown = useMemo(() => breakdownByCategory(summary.items, ["secp", "tax"]), [summary]);

  async function startMatter(type: string) {
    // A ref, not `starting`: state only updates on the next render, so two rapid clicks would both get through.
    if (startingRef.current) return;
    startingRef.current = true;
    setStarting(type);
    try {
      const matterType = type as MatterType;
      const matter = await createMatterFn({
        data: { companyId: company.id, type: matterType, title: `${MATTER_TYPE_LABEL[matterType]} — ${company.name}` },
      });
      // The matter page fills its form from this company's profile.
      navigate({ to: "/matters/$matterId", params: { matterId: matter.id } });
    } catch {
      toast.error("Could not start this filing");
      startingRef.current = false;
      setStarting(null);
    }
  }

  const loading = allItems === null && !loadError;

  return (
    <div className="space-y-6">
      <CompanyHeader company={company} companies={companies} onSelectCompany={onSelectCompany} />

      {loadError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-danger bg-flag-high px-4 py-3 text-sm text-danger">
          <span>Could not load this company's compliance data.</span>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="font-medium underline">
            Try again
          </button>
        </div>
      ) : loading ? (
        <HealthSkeleton />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <ScoreCard summary={summary} />
            <NextActions actions={actions} starting={starting} onStart={startMatter} hasItems={items.length > 0} />
          </div>
          <Breakdown breakdown={breakdown} untracked={untracked} companyName={company.name} starting={starting} onStart={startMatter} />
        </>
      )}

      <RecentActivity rows={activity} />
    </div>
  );
}

function CompanyHeader({
  company,
  companies,
  onSelectCompany,
}: {
  company: Company;
  companies: Company[];
  onSelectCompany: (companyId: string) => void;
}) {
  const reg = registrationStatus(company);
  return (
    <header className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">Company health</p>
          <h2 className="mt-1 truncate font-display text-2xl">{company.name}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span>{company.cuin ? `CUIN ${company.cuin}` : "CUIN not on file"}</span>
            <span>{company.ntn ? `NTN ${company.ntn}` : "NTN not on file"}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                reg.tone === "success" ? "border-success text-success" : "border-warn text-warn",
              )}
            >
              <Circle className="size-1.5 fill-current" strokeWidth={0} />
              {reg.label}
            </span>
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {companies.length > 1 && (
            <label className="min-w-0 flex-1 sm:w-56 sm:flex-none">
              <span className="sr-only">Switch company</span>
              <Select value={company.id} onChange={(e) => onSelectCompany(e.target.value)}>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </label>
          )}
          <Link
            to="/companies/$companyId"
            params={{ companyId: company.id }}
            className="inline-flex min-h-11 shrink-0 items-center rounded-[var(--radius-sm)] border border-border px-3 text-sm font-medium text-muted hover:border-accent hover:text-fg"
          >
            View company →
          </Link>
        </div>
      </div>
    </header>
  );
}

function HealthSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="h-56 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface" />
        <div className="h-56 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-40 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface" />
        <div className="h-40 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface" />
      </div>
    </div>
  );
}

function ScoreCard({ summary }: { summary: HealthSummary }) {
  const { score, band, counts, capped, scoredCount } = summary;
  const tone = BAND_TONE[band];
  const parts = [
    counts.overdue > 0 && `${counts.overdue} overdue`,
    counts.due_soon > 0 && `${counts.due_soon} due soon`,
    counts.upcoming > 0 && `${counts.upcoming} on track`,
    counts.completed > 0 && `${counts.completed} completed`,
  ].filter(Boolean);

  return (
    <section
      aria-labelledby="health-score-heading"
      className="flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:p-6"
    >
      <h3 id="health-score-heading" className="text-xs font-medium uppercase tracking-widest text-muted">
        Compliance health
      </h3>

      {score === null ? (
        <div className="mt-3">
          <p className="font-display text-3xl text-muted">Not scored yet</p>
          <p className="mt-2 text-sm text-muted">
            A score appears once at least one filing has a real deadline. Start a filing below, or add its dates so
            the deadline can be worked out.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-3 flex items-baseline gap-1.5">
            <span className={cn("font-display text-6xl leading-none", tone.text)}>{score}</span>
            <span className="text-lg text-muted">/100</span>
          </p>
          <div
            role="meter"
            aria-label="Compliance health score"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={score}
            aria-valuetext={`${score} out of 100, ${HEALTH_BAND_LABEL[band]}`}
            className="mt-4 h-2.5 overflow-hidden rounded-full bg-border"
          >
            <div className={cn("h-full rounded-full transition-[width] duration-300", tone.bar)} style={{ width: `${score}%` }} />
          </div>
          <p className={cn("mt-3 text-lg font-medium", tone.text)}>{HEALTH_BAND_LABEL[band]}</p>
        </>
      )}

      <div className="mt-3 space-y-1 text-xs text-muted">
        {parts.length > 0 && <p>{parts.join(" · ")}</p>}
        {capped && <p>Held at {OVERDUE_SCORE_CAP} while anything is overdue.</p>}
        {counts.needs_setup > 0 && (
          <p>
            {counts.needs_setup} item{counts.needs_setup === 1 ? " has" : "s have"} no deadline yet and{" "}
            {counts.needs_setup === 1 ? "isn't" : "aren't"} scored.
          </p>
        )}
        {score !== null && <p>Based on {scoredCount} tracked item{scoredCount === 1 ? "" : "s"}.</p>}
      </div>

      <details className="mt-auto pt-4 text-xs text-muted">
        <summary className="cursor-pointer select-none font-medium underline underline-offset-2">How is this calculated?</summary>
        <p className="mt-2 leading-relaxed">
          Each tracked item is weighted by priority (Low {PRIORITY_WEIGHT.low} · Medium {PRIORITY_WEIGHT.medium} · High{" "}
          {PRIORITY_WEIGHT.high} · Critical {PRIORITY_WEIGHT.critical}). Completed and on-track items earn full credit,
          items due within {DUE_SOON_DAYS} days earn {Math.round(HEALTH_CREDIT.due_soon * 100)}%, and overdue items earn
          none. The score is credit earned ÷ weight tracked, and any overdue item holds it at {OVERDUE_SCORE_CAP} or
          below. Items with no computed deadline aren't scored, and completed filings stop counting a year after their
          deadline.
        </p>
      </details>
    </section>
  );
}

function NextActions({
  actions,
  starting,
  onStart,
  hasItems,
}: {
  actions: NextAction[];
  starting: string | null;
  onStart: (matterType: string) => void;
  hasItems: boolean;
}) {
  return (
    <section aria-labelledby="next-actions-heading" className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:p-6">
      <h3 id="next-actions-heading" className="text-xs font-medium uppercase tracking-widest text-muted">
        {actions.length > 1 ? `Next ${actions.length} actions` : actions.length === 1 ? "Next action" : "Next actions"}
      </h3>
      {actions.length === 0 ? (
        <div className="mt-3 flex items-start gap-3 rounded-[var(--radius-md)] border border-success bg-flag-low p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" strokeWidth={1.75} />
          <div>
            <p className="text-sm font-medium">You're all caught up</p>
            <p className="mt-0.5 text-sm text-muted">
              {hasItems
                ? "Nothing open needs attention for this company."
                : "Nothing is being tracked for this company yet."}
            </p>
          </div>
        </div>
      ) : (
        <ol className="mt-3 space-y-2">
          {actions.map((a, index) => {
            const starting_ = a.startMatterType !== undefined && starting === a.startMatterType;
            const ctaClass =
              "inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 text-sm font-medium hover:border-accent disabled:opacity-60";
            return (
              <li
                key={a.key}
                className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-border bg-bg p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-fg">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p
                      className={cn(
                        "text-xs",
                        a.health === "overdue" ? "text-danger" : a.health === "due_soon" ? "text-warn" : "text-muted",
                      )}
                    >
                      {a.detail}
                    </p>
                  </div>
                </div>
                {a.href ? (
                  <Link to={a.href} className={ctaClass}>
                    {a.cta}
                    <ArrowRight className="size-4" strokeWidth={1.75} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={starting !== null}
                    onClick={() => a.startMatterType && onStart(a.startMatterType)}
                    className={ctaClass}
                  >
                    {starting_ ? "Starting…" : a.cta}
                    {!starting_ && <ArrowRight className="size-4" strokeWidth={1.75} />}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function Breakdown({
  breakdown,
  untracked,
  companyName,
  starting,
  onStart,
}: {
  breakdown: CategoryBreakdown[];
  untracked: StandingRequirement[];
  companyName: string;
  starting: string | null;
  onStart: (matterType: string) => void;
}) {
  // Masonry from `lg` up: the cards are dealt into two columns by estimated height (SECP and Tax side by side on
  // top, the rest under whichever column is shorter) instead of sitting in grid rows that leave gaps. Below `lg` it
  // is one column in the original order.
  const wide = useMediaQuery(WIDE_QUERY);
  const cards = useMemo(
    () =>
      breakdown.map((b) => {
        const cardUntracked = untracked.filter((r) => r.category === b.category);
        return { b, untracked: cardUntracked, weight: estimateCardWeight(b, cardUntracked.length) };
      }),
    [breakdown, untracked],
  );
  const columns = useMemo(() => balanceColumns(cards, wide ? 2 : 1, (c) => c.weight), [cards, wide]);

  return (
    <section aria-labelledby="breakdown-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id="breakdown-heading" className="font-display text-xl">
          Breakdown
        </h3>
        <Link to="/compliance" className="text-sm text-accent underline underline-offset-2">
          Open the full compliance center
        </Link>
      </div>
      <div className="mt-3 grid items-start gap-4 lg:grid-cols-2">
        {columns.map((column, index) => (
          <div key={index} className="min-w-0 space-y-4">
            {column.map(({ b, untracked: cardUntracked }) => (
              <BreakdownCard
                key={b.category}
                breakdown={b}
                untracked={cardUntracked}
                companyName={companyName}
                starting={starting}
                onStart={onStart}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/** Same breakpoint as the Tailwind `lg:` classes used around it. */
const WIDE_QUERY = "(min-width: 1024px)";

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", notify);
      return () => mql.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Rough rendered height of a breakdown card in "rows" — only used to decide which column is shorter. */
function estimateCardWeight(b: CategoryBreakdown, untrackedCount: number): number {
  const shown = Math.min(b.items.length, ROWS_PER_CATEGORY);
  const moreLink = b.items.length > shown ? 0.5 : 0;
  const empty = b.items.length === 0 && untrackedCount === 0 ? 1 : 0;
  // Header ≈ 1 row; a "start tracking" row is a little taller than an item row because of its button.
  return 1 + shown + moreLink + untrackedCount * 1.2 + empty;
}

function BreakdownCard({
  breakdown,
  untracked,
  companyName,
  starting,
  onStart,
}: {
  breakdown: CategoryBreakdown;
  untracked: StandingRequirement[];
  companyName: string;
  starting: string | null;
  onStart: (matterType: string) => void;
}) {
  // On a phone each card is a collapsible section (opened by default when it has something needing attention);
  // from `sm` up the body is always visible and the header is just a label.
  const [openOverride, setOpenOverride] = useState<boolean | null>(null);
  const open = openOverride ?? breakdown.attention > 0;
  const shown = breakdown.items.slice(0, ROWS_PER_CATEGORY);
  const hidden = breakdown.items.length - shown.length;
  const isEmpty = breakdown.items.length === 0 && untracked.length === 0;
  const bodyId = `breakdown-${breakdown.category}`;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
      {/* The whole header is tappable on a phone; the button inside is the keyboard/screen-reader control and only exists below `sm`. */}
      <div
        onClick={() => setOpenOverride(!open)}
        className="flex min-h-14 items-center justify-between gap-3 px-5 py-2 max-sm:cursor-pointer"
      >
        <h4 className="font-display text-lg">{categoryLabel(breakdown.category)}</h4>
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "text-xs font-medium",
              breakdown.counts.overdue > 0 ? "text-danger" : breakdown.attention > 0 ? "text-warn" : "text-muted",
            )}
          >
            {breakdown.counts.overdue > 0
              ? `${breakdown.counts.overdue} overdue`
              : breakdown.attention > 0
                ? `${breakdown.attention} need${breakdown.attention === 1 ? "s" : ""} attention`
                : breakdown.items.length > 0
                  ? "All clear"
                  : ""}
          </span>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            aria-label={`${open ? "Collapse" : "Expand"} ${categoryLabel(breakdown.category)}`}
            className="-mr-2 flex size-11 items-center justify-center text-muted sm:hidden"
          >
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div id={bodyId} className={cn("space-y-2 px-5 pb-5", open ? "block" : "hidden sm:block")}>
        {isEmpty && <p className="text-sm text-muted">Nothing tracked here yet.</p>}
        {shown.map((s) => (
          <BreakdownRow key={`${s.item.kind}:${s.item.id}`} scored={s} companyName={companyName} />
        ))}
        {hidden > 0 && (
          <Link to="/compliance" className="block text-xs text-accent underline underline-offset-2">
            +{hidden} more in the compliance center
          </Link>
        )}
        {untracked.map((r) => (
          <div
            key={r.matterType}
            className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-dashed border-border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{r.label}</p>
              <p className="text-xs text-muted">Not tracked yet — start one to get its deadline.</p>
            </div>
            <button
              type="button"
              disabled={starting !== null}
              onClick={() => onStart(r.matterType)}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 text-sm font-medium hover:border-accent disabled:opacity-60"
            >
              {starting === r.matterType ? "Starting…" : "Start tracking"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakdownRow({ scored, companyName }: { scored: ScoredItem; companyName: string }) {
  const { item, health, daysUntilDue } = scored;
  const badge = HEALTH_BADGE[health];
  const Icon = badge.icon;
  return (
    <Link
      to={item.href}
      className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2.5 hover:border-accent"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{stripCompanySuffix(item.title, companyName)}</p>
        <p className="text-xs text-muted">
          {health === "needs_setup"
            ? "No deadline yet — details needed"
            : health === "completed"
              ? item.matterType
                ? "Filed"
                : "Done"
              : describeDue(daysUntilDue)}
        </p>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
          badge.className,
        )}
      >
        <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
        {badge.label}
      </span>
    </Link>
  );
}

function RecentActivity({ rows }: { rows: AuditLogRow[] | null }) {
  return (
    <section aria-labelledby="recent-activity-heading">
      <h3 id="recent-activity-heading" className="font-display text-xl">
        Recent activity
      </h3>
      {rows === null ? (
        <div className="mt-3 space-y-2" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-[var(--radius-md)] border border-border bg-surface" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState className="mt-3" text="No activity for this company yet — filings, documents and edits will show up here." />
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.slice(0, RECENT_ACTIVITY_ROWS).map((row) => (
            <li key={row.id} className="flex items-baseline gap-3 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 self-start rounded-full bg-accent" aria-hidden="true" />
              <span className="min-w-0 flex-1">{describeAuditRow(row)}</span>
              <span className="shrink-0 text-xs text-muted">{formatRelative(row.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
