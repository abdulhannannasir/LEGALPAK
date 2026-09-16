import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock } from "lucide-react";

const TRUST_ITEMS = ["Built for Pakistan", "SECP", "FBR", "Companies Act 2017"];

const STATUS_ROWS = [
  {
    label: "Form A annual return — overdue",
    icon: AlertTriangle,
    border: "border-danger",
    bg: "bg-flag-high",
    iconColor: "text-danger",
  },
  {
    label: "NDA renewal — due in 6 days",
    icon: Clock,
    border: "border-warn",
    bg: "bg-flag-med",
    iconColor: "text-warn",
  },
  {
    label: "Financial statements — filed",
    icon: CheckCircle2,
    border: "border-success",
    bg: "bg-flag-low",
    iconColor: "text-success",
  },
] as const;

export function HeroSection() {
  return (
    <section className="relative border-b border-border px-4 pt-14 pb-16 sm:px-6 sm:pt-24 sm:pb-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-[-10%] size-[420px] rounded-full bg-accent/10 blur-3xl sm:size-[640px]" />
        <div className="absolute -bottom-40 -left-24 size-[320px] rounded-full bg-primary/5 blur-3xl sm:size-[420px]" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.15em] text-accent uppercase shadow-sm">
            <span className="size-1.5 rounded-full bg-accent" />
            Pakistan&apos;s Corporate Compliance OS
          </span>

          <h1 className="mt-6 text-balance font-display text-4xl leading-[1.08] tracking-tight text-fg sm:text-5xl lg:text-6xl">
            Run Your Pakistani Company&apos;s <span className="text-accent">Legal &amp; Compliance Work</span> in One Place
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-muted sm:text-lg lg:mx-0 lg:border-l-2 lg:border-accent/40 lg:pl-4 lg:text-left">
            SECP filings, corporate documents, compliance deadlines and contracts — organised in
            one workspace for Pakistani businesses.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              to="/dashboard"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-primary px-7 text-sm font-semibold text-primary-fg shadow-sm transition-all hover:bg-accent hover:shadow-md sm:w-auto"
            >
              Start Business Workspace
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
            <Link
              to="/"
              hash="platform"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-sm)] border border-border bg-surface px-7 text-sm font-semibold text-fg transition-colors hover:border-accent hover:text-accent sm:w-auto"
            >
              Explore Compliance Tools
            </Link>
          </div>

          <div className="mx-auto mt-10 flex max-w-lg flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:mx-0 lg:justify-start">
            {TRUST_ITEMS.map((item, i) => (
              <span key={item} className="flex items-center gap-2 text-xs font-medium text-muted">
                {i > 0 && <span className="text-border">•</span>}
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm lg:mx-0">
          <div className="absolute -top-5 -left-5 hidden rounded-[var(--radius-md)] border border-border bg-primary px-4 py-2 shadow-md sm:block">
            <p className="text-[10px] font-semibold tracking-wide text-primary-fg/70 uppercase">Next up</p>
            <p className="text-sm font-semibold text-primary-fg">Form A due in 14 days</p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Compliance Health</p>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted uppercase">
                Preview
              </span>
            </div>
            <div className="mt-3 flex items-end gap-2">
              <p className="font-display text-5xl text-fg">82</p>
              <p className="mb-1.5 text-sm text-muted">/ 100</p>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-accent" style={{ width: "82%" }} />
            </div>
            <p className="mt-2 text-xs text-muted">
              Illustrative — based on your own filings once connected
            </p>

            <div className="mt-5 space-y-2 border-t border-border pt-5">
              {STATUS_ROWS.map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.label}
                    className={`flex items-center gap-2.5 rounded-[var(--radius-md)] border-l-4 ${row.border} ${row.bg} px-3 py-2.5 text-sm`}
                  >
                    <Icon className={`size-4 shrink-0 ${row.iconColor}`} strokeWidth={1.75} />
                    <span className="text-fg">{row.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
