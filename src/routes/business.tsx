import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Building2,
  CalendarClock,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Landmark,
  LayoutDashboard,
  Rocket,
  ScrollText,
  Send,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/business")({
  component: BusinessHubPage,
  head: () => ({
    meta: [
      { title: "Business — Corporate Suite — LegalPak" },
      {
        name: "description",
        content:
          "Company registration, SECP filings, contracts, and compliance for Pakistani businesses — the Corporate Suite, PKR 3,000/month per workspace.",
      },
    ],
  }),
});

const CARDS = [
  {
    to: "/dashboard",
    title: "Companies",
    body: "Manage your workspace's saved companies and their matters.",
    icon: LayoutDashboard,
    free: true,
  },
  {
    to: "/incorporation",
    title: "Register a Company",
    body: "Choose your legal vehicle, validate your name and capital, and generate a ready-to-file SECP eZfile pack.",
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
    body: "Induction / cessation on eZfile, 15-day clock, minimum board, consent pack.",
    icon: Users,
  },
  {
    to: "/corporate-filings",
    title: "Form 21 & Form 45",
    body: "Change of registered office, and Ultimate Beneficial Ownership declarations.",
    icon: ScrollText,
  },
  {
    to: "/contracts",
    title: "Contracts",
    body: "Service, employment, rent, NDA, partnership, JV, loan, PoA, shareholders' agreements.",
    icon: Building2,
  },
  {
    to: "/notices",
    title: "Legal Notices",
    body: "Section 489-F and commercial debt-recovery notices, with postal dispatch tracking.",
    icon: Send,
  },
  {
    to: "/tax-assistant",
    title: "Tax Assistant (FBR)",
    body: "A deterministic decision tree for what needs filing — not a guess.",
    icon: Landmark,
  },
  {
    to: "/compliance",
    title: "Compliance Calendar",
    body: "Every statutory deadline in one place, with reminders before the clock runs out.",
    icon: CalendarClock,
  },
  {
    to: "/documents",
    title: "Document Vault",
    body: "Every document across every company — corporate records, SECP filings, tax, contracts, and notices.",
    icon: FolderOpen,
    free: true,
  },
  {
    to: "/guide",
    title: "Filing Guide",
    body: "A plain-language walkthrough of eZfile and what to prepare before you start.",
    icon: BookOpen,
    free: true,
  },
];

function BusinessHubPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Business</p>
        <h1 className="font-display mt-1 text-3xl md:text-4xl">The Corporate Suite</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Company registration, SECP compliance, contracts, and filings for your Pakistani
          business. Most tools here require an active subscription —{" "}
          <Link to="/billing" className="text-accent underline">
            PKR 3,000/month per workspace
          </Link>
          . Managing your companies and reading the filing guide are always free.
        </p>
        <Link to="/consultations" className="mt-2 inline-block text-sm text-accent underline">
          View consultation requests received
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.to}
              to={c.to}
              className="relative rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-colors hover:border-accent"
            >
              <div className="flex items-start justify-between">
                <Icon className="size-5 text-accent" strokeWidth={1.75} />
                {c.free && (
                  <span className="rounded-full border border-accent/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                    Free
                  </span>
                )}
              </div>
              <h2 className="mt-3 font-display text-xl">{c.title}</h2>
              <p className="mt-1 text-sm text-muted">{c.body}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
