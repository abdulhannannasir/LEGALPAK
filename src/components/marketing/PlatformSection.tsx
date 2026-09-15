import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  Gavel,
  HeartHandshake,
  MessageCircle,
  Scale,
  type LucideIcon,
} from "lucide-react";

const PLATFORM_AREAS: { title: string; body: string; icon: LucideIcon; to: string }[] = [
  {
    title: "Business Suite",
    body: "Company registration, SECP filings, financial statements, and director changes — one workspace per company.",
    icon: Briefcase,
    to: "/business",
  },
  {
    title: "Personal Legal Help",
    body: "Free AI legal chat, document drafts, and a directory of verified advocates — for individuals, no account needed.",
    icon: HeartHandshake,
    to: "/personal",
  },
  {
    title: "Compliance",
    body: "Every statutory deadline — SECP, tax, and labour filings — in one calendar, with reminders before the clock runs out.",
    icon: CalendarClock,
    to: "/compliance",
  },
  {
    title: "Contracts",
    body: "Service, employment, rent, NDA, partnership, and loan agreements drafted under the Contract Act 1872.",
    icon: Scale,
    to: "/contracts",
  },
  {
    title: "LegalPak Intelligence",
    body: "Ask in English, Roman Urdu, or Urdu and get preliminary guidance on your rights and next steps.",
    icon: MessageCircle,
    to: "/citizen",
  },
  {
    title: "Consult Counsel",
    body: "When a matter needs judgment, not a template — request a consultation with a verified advocate.",
    icon: Gavel,
    to: "/consult",
  },
];

/** The six top-level product desks — the homepage's "explore" anchor target. */
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
          Six desks. One system.
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
