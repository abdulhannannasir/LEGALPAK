import { createFileRoute, Link } from "@tanstack/react-router";
import {
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
import { LuxuryAttorneyCard } from "@/components/marketing/LuxuryAttorneyCard";
import { FaqSection } from "@/components/marketing/FaqSection";
import { FAQS } from "@/lib/marketing/faqs";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "LegalPak — SECP Company Registration & Pakistan Corporate Compliance Desk" },
      {
        name: "description",
        content:
          "Register a company with SECP, file Form A and Form 9, draft contracts and legal notices, and get free citizen legal help in English, Roman Urdu, or Urdu — all in one Pakistan legal-tech desk.",
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
    "Pakistan's SECP compliance and legal drafting desk — company incorporation, Form A, Form 9, financial statements, contracts, legal notices, and free citizen legal help.",
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

const SERVICES = [
  {
    to: "/incorporation",
    title: "Company Registration & eZfile Pre-Flight",
    body: "Choose your legal vehicle, validate your name and capital against the Companies Act 2017, and generate a ready-to-file SECP eZfile execution pack — MOA, AOA, Form 28, and more.",
    icon: Rocket,
  },
  {
    to: "/citizen",
    title: "Citizen Legal Help",
    body: "Ask LegalPak AI in plain language — English, Roman Urdu, or Urdu — draft documents, and find a verified advocate.",
    icon: MessageCircle,
    free: true,
  },
  {
    to: "/help-desk",
    title: "Help Desk & Rights Navigator",
    body: "Guided wizards for utility overbilling, cyber harassment, eviction, police encounters, and inheritance, with emergency helplines on every page.",
    icon: LifeBuoy,
    free: true,
  },
  {
    to: "/accounts",
    title: "Financial Statements",
    body: "Classify audit vs SECP filing, 15- vs 30-day clocks, board resolution and directors’ report skeleton.",
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
    <div className="luxury min-h-screen">
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

      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-center text-xs font-medium tracking-[0.3em] text-[var(--lux-bronze)] uppercase">
          The Practice
        </p>
        <h2
          className="mt-3 text-center text-3xl text-[var(--lux-fg)] sm:text-4xl"
          style={{ fontFamily: "var(--font-lux-serif)" }}
        >
          A Desk for Every Filing
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-[var(--lux-muted)]">
          Citizen Legal Help and the Help Desk are free, always. The Corporate Suite is PKR
          3,000/month per workspace —{" "}
          <Link to="/billing" className="text-[var(--lux-gold)] underline">
            see billing
          </Link>
          .
        </p>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.to}
                to={s.to}
                className="group relative overflow-hidden rounded-2xl border border-[var(--lux-border)] bg-white/[0.03] p-6 backdrop-blur-md transition-colors hover:border-[var(--lux-border-strong)]"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[var(--lux-gold)]/0 via-transparent to-[var(--lux-sapphire)]/0 opacity-0 transition-opacity duration-500 group-hover:opacity-10" />
                <div className="flex items-start justify-between">
                  <Icon className="size-5 text-[var(--lux-gold)]" strokeWidth={1.5} />
                  {"free" in s && s.free && (
                    <span className="rounded-full border border-[var(--lux-gold)]/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--lux-gold)]">
                      Free
                    </span>
                  )}
                </div>
                <h3
                  className="mt-4 text-lg text-[var(--lux-fg)]"
                  style={{ fontFamily: "var(--font-lux-serif)" }}
                >
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--lux-muted)]">{s.body}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-28">
        <p className="text-center text-xs font-medium tracking-[0.3em] text-[var(--lux-bronze)] uppercase">
          Need More Than a Template?
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <LuxuryAttorneyCard />
          <div className="rounded-2xl border border-[var(--lux-border)] bg-white/[0.03] p-6 backdrop-blur-md">
            <p className="text-sm leading-relaxed text-[var(--lux-muted)]">
              Cap table terms, cross-border jurisdiction clauses, SECP disputes, share
              restructuring, or a regulatory audit — some matters need a person, not a form.
            </p>
            <Link
              to="/consult"
              className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[var(--lux-gold)] px-6 text-xs font-medium tracking-widest text-black uppercase hover:opacity-90"
            >
              Request a Consultation
            </Link>
          </div>
        </div>
      </section>

      <FaqSection />

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-[var(--lux-muted)]">
        <p>
          LegalPak drafts packs for eZfile. SECP still receives the PIN-signed filing. Not a
          substitute for a licensed Pakistani advocate.
        </p>
        <p className="mt-2 flex justify-center gap-3">
          <Link to="/privacy" className="underline hover:text-[var(--lux-fg)]">
            Privacy Policy
          </Link>
          <Link to="/terms" className="underline hover:text-[var(--lux-fg)]">
            Terms of Service
          </Link>
        </p>
      </footer>
    </div>
  );
}
