import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CalendarClock,
  Compass,
  FileSpreadsheet,
  FileText,
  HeartHandshake,
  Landmark,
  LifeBuoy,
  MessageCircle,
  Rocket,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { GlassNavbar } from "@/components/marketing/GlassNavbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { AttorneyConsultCard } from "@/components/marketing/AttorneyConsultCard";
import { FaqSection } from "@/components/marketing/FaqSection";
import { FAQS } from "@/lib/marketing/faqs";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "LegalPak — Pakistan's Legal & Compliance Operating System" },
      {
        name: "description",
        content:
          "Start a company, draft a contract, stay compliant, and understand your rights — LegalPak is Pakistan's legal and compliance operating system for SECP filings, contracts, and citizen legal help.",
      },
    ],
  }),
});

const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  name: "LegalPak",
  url: "https://legalpak.vercel.app",
  description:
    "Pakistan's legal and compliance operating system — company incorporation, SECP filings, contracts, statutory compliance, and free citizen legal help.",
  areaServed: { "@type": "Country", name: "Pakistan" },
  availableLanguage: ["English", "Urdu"],
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

const ARCHITECTURE = [
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
] as const;

const PERSONAL_SERVICES = [
  {
    to: "/citizen",
    title: "Citizen Legal Help",
    body: "Ask LegalPak in plain language — English, Roman Urdu, or Urdu — draft documents, and find a verified advocate.",
    icon: MessageCircle,
  },
  {
    to: "/help-desk",
    title: "Help Desk & Rights Navigator",
    body: "Guided wizards for utility overbilling, cyber harassment, eviction, police encounters, and inheritance, with emergency helplines on every page.",
    icon: LifeBuoy,
  },
];

const BUSINESS_SERVICES = [
  {
    to: "/incorporation",
    title: "Company Registration & eZfile Pre-Flight",
    body: "Choose your legal vehicle, validate your name and capital against the Companies Act 2017, and generate a ready-to-file SECP eZfile execution pack — MOA, AOA, Form 28, and more.",
    icon: Rocket,
  },
  {
    to: "/accounts",
    title: "Financial Statements",
    body: "Classify audit vs SECP filing, 15- vs 30-day clocks, board resolution and directors' report skeleton.",
    icon: FileSpreadsheet,
  },
  {
    to: "/form-a",
    title: "Form A Annual Return",
    body: "Form A vs Form 24 vs no filing. AGM + 30 days. Transfers, officers, inactive Part III.",
    icon: FileText,
  },
  {
    to: "/form-9",
    title: "Form 9 Director Change",
    body: "Old Form 29. Induction / cessation on eZfile, 15-day clock, minimum board, consent pack.",
    icon: Users,
  },
  {
    to: "/contracts",
    title: "Commercial Contracts",
    body: "Service, employment, rent, bayana, NDA, partnership, JV, loan, PoA, shareholders — Contract Act 1872.",
    icon: Scale,
  },
  {
    to: "/tax-assistant",
    title: "Digital Tax Assistant",
    body: "FBR income tax filing guidance — a deterministic decision tree, not a guess, for what needs filing.",
    icon: Landmark,
  },
  {
    to: "/compliance",
    title: "Compliance Calendar",
    body: "Every statutory deadline in one place — SECP, tax, and labour filings — with reminders before the clock runs out.",
    icon: CalendarClock,
  },
  {
    to: "/guide",
    title: "Filing Guide",
    body: "A plain-language walkthrough of eZfile, SECP forms, and what to prepare before you start a filing.",
    icon: BookOpen,
  },
];

const UNITS = [
  {
    to: "/personal",
    title: "Personal",
    tagline: "Free, always",
    body: "AI legal chat, document drafts, a lawyer directory, and guided rights wizards — for individuals.",
    icon: HeartHandshake,
  },
  {
    to: "/business",
    title: "Business",
    tagline: "PKR 3,000/month per workspace",
    body: "Company registration, SECP filings, contracts, and compliance tools — for companies.",
    icon: Briefcase,
  },
];

function Home() {
  return (
    <div className="marketing-surface min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <GlassNavbar />
      <HeroSection />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          One System, Four Jobs
        </p>
        <h2 className="mt-3 text-center font-display text-3xl text-fg sm:text-4xl">
          Everything a Pakistani business and its people need
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ARCHITECTURE.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.key}
                to={a.to}
                className="group rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm transition-colors hover:border-accent"
              >
                <Icon className="size-6 text-accent" strokeWidth={1.75} />
                <p className="mt-4 text-xs font-semibold tracking-[0.15em] text-muted uppercase">
                  {a.key}
                </p>
                <h3 className="mt-1 font-display text-xl text-fg">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{a.body}</p>
                <span className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
                  Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border bg-surface/60 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold tracking-[0.2em] text-accent uppercase">
            Two Desks, One Platform
          </p>
          <h2 className="mt-3 text-center font-display text-3xl text-fg sm:text-4xl">
            Where do you want to start?
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {UNITS.map((u) => {
              const Icon = u.icon;
              return (
                <Link
                  key={u.to}
                  to={u.to}
                  className="group rounded-[var(--radius-lg)] border border-border bg-bg p-8 shadow-sm transition-colors hover:border-accent"
                >
                  <Icon className="size-8 text-accent" strokeWidth={1.5} />
                  <h3 className="mt-5 font-display text-2xl text-fg">{u.title}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-accent">
                    {u.tagline}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{u.body}</p>
                  <span className="mt-5 flex items-center gap-1 text-xs font-medium text-fg">
                    Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          Personal
        </p>
        <h2 className="mt-2 text-center font-display text-2xl text-fg">Free legal help</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {PERSONAL_SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.to}
                to={s.to}
                className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm transition-colors hover:border-accent"
              >
                <Icon className="size-5 text-accent" strokeWidth={1.75} />
                <h3 className="mt-4 font-display text-lg text-fg">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </Link>
            );
          })}
        </div>

        <p className="mx-auto mt-16 text-center text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          Business
        </p>
        <h2 className="mt-2 text-center font-display text-2xl text-fg">The Corporate Suite</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
          PKR 3,000/month per workspace —{" "}
          <Link to="/billing" className="text-accent underline">
            see billing
          </Link>
          .
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BUSINESS_SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.to}
                to={s.to}
                className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm transition-colors hover:border-accent"
              >
                <Icon className="size-5 text-accent" strokeWidth={1.75} />
                <h3 className="mt-4 font-display text-lg text-fg">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border bg-surface/60 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold tracking-[0.2em] text-accent uppercase">
            Need More Than a Template?
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <AttorneyConsultCard />
            <div className="rounded-[var(--radius-lg)] border border-border bg-bg p-6 shadow-sm">
              <p className="text-sm leading-relaxed text-muted">
                Cap table terms, cross-border jurisdiction clauses, SECP disputes, share
                restructuring, or a regulatory audit — some matters need a person, not a form.
              </p>
              <Link
                to="/consult"
                className="mt-5 inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-primary px-6 text-sm font-semibold text-primary-fg hover:bg-accent"
              >
                Request a Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FaqSection />

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted sm:px-6">
        <p>
          LegalPak drafts packs for eZfile. SECP still receives the PIN-signed filing. Not a
          substitute for a licensed Pakistani advocate.
        </p>
        <p className="mt-2 flex justify-center gap-3">
          <Link to="/privacy" className="underline hover:text-fg">
            Privacy Policy
          </Link>
          <Link to="/terms" className="underline hover:text-fg">
            Terms of Service
          </Link>
        </p>
      </footer>
    </div>
  );
}
