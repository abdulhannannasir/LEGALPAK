import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const TRUST_ITEMS = ["Built for Pakistan", "SECP", "FBR", "Commercial Law", "Contracts"];

export function HeroSection() {
  return (
    <section className="border-b border-border px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="text-center lg:text-left">
          <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
            Pakistan's Legal &amp; Compliance Operating System
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.1] text-fg sm:text-5xl">
            Start a company. Draft a contract.
            <br className="hidden sm:block" /> Stay compliant. Understand your rights.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted lg:mx-0">
            One system for SECP incorporation, commercial contracts, statutory compliance, and
            plain-language legal guidance — built specifically for Pakistani businesses and
            citizens.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link
              to="/business"
              className="inline-flex min-h-12 items-center rounded-[var(--radius-sm)] bg-primary px-6 text-sm font-semibold text-primary-fg hover:bg-accent"
            >
              Start a Business
            </Link>
            <Link
              to="/personal"
              className="inline-flex min-h-12 items-center rounded-[var(--radius-sm)] border border-border bg-surface px-6 text-sm font-semibold text-fg hover:border-accent"
            >
              Explore Legal Tools
            </Link>
          </div>
          <div className="mx-auto mt-9 flex max-w-lg flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:mx-0 lg:justify-start">
            {TRUST_ITEMS.map((item, i) => (
              <span key={item} className="flex items-center gap-2 text-xs font-medium text-muted">
                {i > 0 && <span className="text-border">•</span>}
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Compliance Health</p>
          <p className="mt-1 font-display text-4xl text-fg">82/100</p>
          <p className="mt-1 text-xs text-muted">Illustrative — based on your own filings once connected</p>
          <div className="mt-5 space-y-2.5 border-t border-border pt-5">
            <div className="flex items-center gap-2.5 text-sm">
              <AlertTriangle className="size-4 shrink-0 text-danger" strokeWidth={1.75} />
              <span className="text-fg">Form A annual return — overdue</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Clock className="size-4 shrink-0 text-warn" strokeWidth={1.75} />
              <span className="text-fg">NDA renewal — due in 6 days</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <CheckCircle2 className="size-4 shrink-0 text-success" strokeWidth={1.75} />
              <span className="text-fg">Financial statements — filed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
