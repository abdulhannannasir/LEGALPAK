import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  FileSpreadsheet,
  FileText,
  Landmark,
  Lock,
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
import { PillarsSection } from "@/components/marketing/PillarsSection";
import { PlatformSection } from "@/components/marketing/PlatformSection";
import { AttorneyConsultCard } from "@/components/marketing/AttorneyConsultCard";
import { FaqSection } from "@/components/marketing/FaqSection";
import { FAQS } from "@/lib/marketing/faqs";
import { CORPORATE_PLAN_PRICE_PKR } from "@/lib/legalpak/billing";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "LegalPak — Pakistan's Corporate Compliance OS" },
      {
        name: "description",
        content:
          "Manage your Pakistani company's SECP filings, legal documents, contracts and compliance deadlines from one workspace. LegalPak is Pakistan's corporate compliance operating system.",
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
    "Pakistan's corporate compliance operating system — company workspaces, SECP filings, compliance deadlines, contracts, and AI corporate counsel, plus free citizen legal help.",
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
    to: "/ai-counsel",
    title: "AI Corporate Counsel",
    body: "Ask about SECP filings, deadlines and contracts — grounded in the Companies Act 2017, with a human lawyer one click away.",
    icon: Sparkles,
  },
  {
    to: "/guide",
    title: "Filing Guide",
    body: "A plain-language walkthrough of eZfile, SECP forms, and what to prepare before you start a filing.",
    icon: BookOpen,
  },
];

const TRUST_POINTS = [
  {
    title: "Your documents, your control",
    body: "Every filing pack, contract and upload is scoped to your workspace — nothing is shared across companies or accounts.",
  },
  {
    title: "Software, not a filing authority",
    body: "LegalPak drafts execution-ready packs for SECP's eZfile and FBR's IRIS. Submission and the PIN-signed filing itself always happen on the official government system, not on LegalPak.",
  },
  {
    title: "Not a substitute for licensed advice",
    body: "Deterministic drafting tools and AI Counsel give preliminary guidance under Pakistani law — for binding legal opinions or representation, consult a licensed corporate lawyer.",
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
      <PillarsSection />
      <PlatformSection />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          Everything, in one workspace
        </p>
        <h2 className="mt-3 text-center font-display text-2xl text-fg sm:text-3xl md:text-4xl">
          The Corporate Compliance OS
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
          Every tool a Pakistani company needs, from incorporation through ongoing compliance.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BUSINESS_SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.to}
                to={s.to}
                className="group flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
              >
                <span className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-accent/10 text-accent">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-lg text-fg">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{s.body}</p>
                <span className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
                  Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border bg-bg px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold tracking-[0.2em] text-accent uppercase">
            Security &amp; trust
          </p>
          <h2 className="mt-3 text-center font-display text-2xl text-fg sm:text-3xl md:text-4xl">
            Software, not a shortcut around the law
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-muted">
            LegalPak is workflow infrastructure for Pakistani companies — not a substitute for
            licensed legal advice or SECP and FBR's official filing systems.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {TRUST_POINTS.map((t) => (
              <div key={t.title} className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm">
                <ShieldCheck className="size-5 text-accent" strokeWidth={1.75} />
                <h3 className="mt-4 font-display text-lg text-fg">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 border-t border-border bg-surface/60 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Pricing</p>
          <h2 className="mt-3 font-display text-2xl text-fg sm:text-3xl md:text-4xl">
            One plan, per workspace
          </h2>
          <div className="mt-10 rounded-[var(--radius-lg)] border border-border bg-bg p-8 shadow-sm">
            <p className="font-display text-4xl text-fg">
              PKR {CORPORATE_PLAN_PRICE_PKR.toLocaleString("en-PK")}
              <span className="text-base font-normal text-muted">/month</span>
            </p>
            <p className="mt-2 text-sm text-muted">Per workspace — unlimited companies and matters.</p>
            <ul className="mx-auto mt-6 grid max-w-sm gap-2 text-left text-sm text-muted">
              {[
                "Incorporation, annual return, director & share changes",
                "Compliance calendar with reminders",
                "Contract library, drafting and review workflow",
                "Document vault, tax assistant, and AI Counsel",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Lock className="mt-0.5 size-3.5 shrink-0 text-accent" strokeWidth={1.75} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/billing"
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-primary px-6 text-sm font-semibold text-primary-fg shadow-sm transition-all hover:bg-accent hover:shadow-md"
            >
              See billing
            </Link>
            <p className="mt-3 text-xs text-muted">
              Citizen Legal Help and the Help Desk & Rights Navigator stay free, no subscription needed.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface/60 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold tracking-[0.2em] text-accent uppercase">
            Need More Than a Template?
          </p>
          <h2 className="mt-3 text-center font-display text-2xl text-fg sm:text-3xl md:text-4xl">
            Consult Counsel
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <AttorneyConsultCard />
            <div className="flex flex-col justify-center rounded-[var(--radius-lg)] border border-border bg-bg p-6 shadow-sm">
              <p className="text-sm leading-relaxed text-muted">
                Cap table terms, cross-border jurisdiction clauses, SECP disputes, share
                restructuring, or a regulatory audit — some matters need a person, not a form.
              </p>
              <Link
                to="/consult"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-sm)] bg-primary px-6 text-sm font-semibold text-primary-fg shadow-sm transition-all hover:bg-accent hover:shadow-md sm:w-auto sm:justify-start"
              >
                Request a Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-semibold tracking-[0.2em] text-accent uppercase">
            For individuals
          </p>
          <h2 className="mt-3 text-center font-display text-xl text-fg sm:text-2xl">
            Free Legal Help, separate from your business workspace
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted">
            No account, no cost — for personal legal questions, not your company's compliance.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PERSONAL_SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.to}
                  to={s.to}
                  className="group flex items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-colors hover:border-accent"
                >
                  <Icon className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.75} />
                  <div>
                    <h3 className="font-display text-base text-fg">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted">{s.body}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <FaqSection />

      <footer className="border-t border-border px-4 py-10 text-center text-xs text-muted sm:px-6">
        <p className="font-display text-base text-fg">LegalPak</p>
        <p className="mx-auto mt-3 max-w-xl leading-relaxed">
          LegalPak drafts packs for eZfile. SECP still receives the PIN-signed filing. Not a
          substitute for a licensed Pakistani advocate.
        </p>
        <p className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1">
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
