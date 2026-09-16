import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  FileSignature,
  FolderOpen,
  Scale,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const PLATFORM_AREAS: { title: string; body: string; icon: LucideIcon; to: string }[] = [
  {
    title: "Company workspace",
    body: "One workspace per company — profile, CUIN/NTN, directors, and every matter in one place.",
    icon: Building2,
    to: "/companies",
  },
  {
    title: "Compliance calendar",
    body: "Every statutory deadline — SECP, tax, and labour filings — in one calendar, with health status and reminders before the clock runs out.",
    icon: CalendarClock,
    to: "/compliance",
  },
  {
    title: "SECP filing workflows",
    body: "Incorporation, annual return, director changes, share changes, and Form 21/45 — each a ready-to-file eZfile pack.",
    icon: FileSignature,
    to: "/secp",
  },
  {
    title: "Document vault",
    body: "Corporate records, SECP filings, tax documents and contracts — versioned, categorized, and searchable across every company.",
    icon: FolderOpen,
    to: "/documents",
  },
  {
    title: "Contracts",
    body: "Service, employment, rent, NDA, partnership, and loan agreements drafted under the Contract Act 1872, with a Draft → Review → Signed workflow.",
    icon: Scale,
    to: "/contracts",
  },
  {
    title: "AI corporate counsel",
    body: "Ask about SECP filings, deadlines, and contracts, grounded in the Companies Act 2017 — with a human lawyer one click away.",
    icon: Sparkles,
    to: "/ai-counsel",
  },
];

/** The six core product desks — the homepage's "explore" anchor target. */
export function PlatformSection() {
  return (
    <section
      id="platform"
      className="scroll-mt-20 border-t border-border bg-surface/60 px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          The Platform
        </p>
        <h2 className="mt-3 text-center font-display text-2xl text-fg sm:text-3xl md:text-4xl">
          Everything your company's compliance needs
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-muted sm:text-base">
          Jump straight to the desk you need.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_AREAS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.to}
                to={a.to}
                className="group flex flex-col rounded-[var(--radius-lg)] border border-border bg-bg p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
              >
                <span className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-primary/5 text-primary">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-lg text-fg">{a.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{a.body}</p>
                <span className="mt-4 flex items-center gap-1 text-xs font-medium text-fg">
                  Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
