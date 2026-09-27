import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Small presentational pieces shared by the workspace Dashboard and a single Company's overview — both show the same "health at a glance" shape, just scoped differently. */

export function ScoreRing({ score }: { score: number }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const tone = clamped >= 80 ? "var(--color-success)" : clamped >= 50 ? "var(--color-warn)" : "var(--color-danger)";
  return (
    <svg viewBox="0 0 64 64" className="size-14 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke={tone}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 300ms ease" }}
      />
    </svg>
  );
}

export function StatTile({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: "danger" | "warn" | "success";
  icon: LucideIcon;
}) {
  const toneClass = { danger: "text-danger", warn: "text-warn", success: "text-success" }[tone];
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <Icon className={cn("size-4", toneClass)} strokeWidth={1.75} />
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("mt-0.5 font-display text-2xl", toneClass)}>{value}</p>
    </div>
  );
}

export function EmptyState({
  text,
  cta,
  className,
}: {
  text: string;
  /** Pass a caller-typed `<Link>` (or any element) — kept generic here so this component doesn't need to know about route literals. */
  cta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[var(--radius-md)] border border-dashed border-border bg-surface p-5", className)}>
      <p className="text-sm text-muted">{text}</p>
      {cta && <div className="mt-3">{cta}</div>}
    </div>
  );
}

export function SkeletonRows({ count, className }: { count: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-[var(--radius-md)] border border-border bg-surface" />
      ))}
    </div>
  );
}
