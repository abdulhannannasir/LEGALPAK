import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, FileText, Repeat, Rocket, ScrollText, Users } from "lucide-react";
import { useCompanyContext } from "@/lib/legalpak/company-context";

export const Route = createFileRoute("/secp/")({
  component: SecpHubPage,
  head: () => ({
    meta: [
      { title: "SECP — LegalPak" },
      {
        name: "description",
        content:
          "Every SECP filing workflow for a Pakistani company — incorporation, annual return, director changes, share changes, and Form 21/45 — in one place.",
      },
    ],
  }),
});

const FILINGS = [
  {
    to: "/incorporation",
    title: "Incorporation",
    body: "Choose your legal vehicle, validate your name and capital, and generate a ready-to-file SECP eZfile pack — MOA, AOA, Form 28.",
    icon: Rocket,
  },
  {
    to: "/form-a",
    title: "Annual Return",
    body: "Form A vs Form 24 vs no filing. AGM + 30 days. Transfers, officers, inactive Part III.",
    icon: FileText,
  },
  {
    to: "/form-9",
    title: "Director Changes",
    body: "Form 9 — induction / cessation on eZfile, 15-day clock, minimum board, consent pack.",
    icon: Users,
  },
  {
    to: "/share-changes",
    title: "Share Changes",
    body: "Form 3 return of allotment for new shares, or a transfer deed for existing holdings.",
    icon: Repeat,
  },
  {
    to: "/corporate-filings",
    title: "Other Filings",
    body: "Form 21 (change of registered office) and Form 45 (Ultimate Beneficial Ownership).",
    icon: ScrollText,
  },
] as const;

function SecpHubPage() {
  const { selectedCompany } = useCompanyContext();
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">SECP</p>
        <h1 className="font-display mt-1 text-3xl md:text-4xl">Filing workflows</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Every SECP filing a company needs across its lifecycle — from incorporation through
          annual compliance, officer and share changes. Each generates a ready-to-file eZfile pack,
          not a submission — SECP still receives the PIN-signed filing.
        </p>
        {selectedCompany && (
          <Link
            to="/companies/$companyId"
            params={{ companyId: selectedCompany.id }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted hover:border-accent hover:text-fg"
          >
            <Building2 className="size-3.5 text-accent" strokeWidth={1.75} />
            Filing for {selectedCompany.name} — start a matter from its workspace →
          </Link>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FILINGS.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.to}
              to={f.to}
              className="group flex flex-col justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-colors hover:border-accent"
            >
              <div>
                <Icon className="size-5 text-accent" strokeWidth={1.75} />
                <h2 className="mt-3 font-display text-xl">{f.title}</h2>
                <p className="mt-1 text-sm text-muted">{f.body}</p>
              </div>
              <span className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
                Open <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
