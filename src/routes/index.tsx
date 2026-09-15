import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  FileSpreadsheet,
  FileText,
  Landmark,
  LifeBuoy,
  MessageCircle,
  Rocket,
  Scale,
  Users,
} from "lucide-react";
import { GlassNavbar } from "@/components/marketing/GlassNavbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { PillarsSection } from "@/components/marketing/PillarsSection";
import { PlatformSection } from "@/components/marketing/PlatformSection";
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
          Personal
        </p>
        <h2 className="mt-3 text-center font-display text-2xl text-fg sm:text-3xl md:text-4xl">
          Free legal help
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {PERSONAL_SERVICES.map((s) => {
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

        <p className="mx-auto mt-16 text-center text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          Business
        </p>
        <h2 className="mt-3 text-center font-display text-2xl text-fg sm:text-3xl md:text-4xl">
          The Corporate Suite
        </h2>
        <p className="mx-auto mt-3 flex max-w-xl items-center justify-center text-center text-sm text-muted">
          <span className="rounded-full border border-border bg-surface px-3 py-1">
            PKR 3,000/month per workspace —{" "}
            <Link to="/billing" className="text-accent underline">
              see billing
            </Link>
          </span>
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
