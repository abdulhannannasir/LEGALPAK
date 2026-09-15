import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Rocket, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";

const PILLARS: { key: string; title: string; body: string; icon: LucideIcon; to: string }[] = [
  {
    key: "START",
    title: "Start",
    body: "Register a company and prepare your SECP filing pack.",
    icon: Rocket,
    to: "/incorporation",
  },
  {
    key: "RUN",
    title: "Run",
    body: "Manage contracts, filings, directors and compliance.",
    icon: Compass,
    to: "/business",
  },
  {
    key: "PROTECT",
    title: "Protect",
    body: "Create agreements, notices and business documents.",
    icon: ShieldCheck,
    to: "/contracts",
  },
  {
    key: "UNDERSTAND",
    title: "Understand",
    body: "Get preliminary legal guidance in English, Urdu and Roman Urdu.",
    icon: Sparkles,
    to: "/citizen",
  },
];

/** The four-step product story: Start → Run → Protect → Understand. */
export function PillarsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <p className="text-center text-xs font-semibold tracking-[0.2em] text-accent uppercase">
        How it works
      </p>
      <h2 className="mt-3 text-center font-display text-2xl text-fg sm:text-3xl md:text-4xl">
        One system, four jobs
      </h2>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p, i) => {
          const Icon = p.icon;
          return (
            <Link
              key={p.key}
              to={p.to}
              className="group flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-accent/10 text-accent">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <span aria-hidden className="font-display text-2xl text-border">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-5 text-xs font-semibold tracking-[0.15em] text-muted uppercase">{p.key}</p>
              <h3 className="mt-1 font-display text-xl text-fg">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.body}</p>
              <span className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
                Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
