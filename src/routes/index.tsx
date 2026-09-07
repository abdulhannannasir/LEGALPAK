import { createFileRoute, Link } from "@tanstack/react-router";
import { FileSpreadsheet, FileText, Scale, Users } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

const CARDS = [
  {
    to: "/accounts",
    title: "Financial statements",
    body: "Classify audit vs SECP filing, 15- vs 30-day clocks, board resolution and directors’ report skeleton.",
    icon: FileSpreadsheet,
  },
  {
    to: "/form-a",
    title: "Form A annual return",
    body: "Form A vs Form 24 vs no filing. AGM + 30 days. Transfers, officers, inactive Part III.",
    icon: FileText,
  },
  {
    to: "/form-9",
    title: "Form 9 director change",
    body: "Old Form 29. Induction / cessation on eZfile, 15-day clock, minimum board, consent pack.",
    icon: Users,
  },
  {
    to: "/contracts",
    title: "Contracts",
    body: "Service, employment, rent, bayana, NDA, partnership, JV, loan, PoA, shareholders — Contract Act 1872.",
    icon: Scale,
  },
];

function Home() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Pakistan corporate desk</p>
        <h1 className="font-display mt-1 text-3xl text-fg md:text-4xl">LegalPak</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Prepare SECP eZfile packs and commercial contracts. There is no public SECP filing API — you draft
          here, then PIN-sign on leap.secp.gov.pk.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.to}
              to={c.to}
              className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-colors hover:border-accent"
            >
              <Icon className="size-5 text-accent" strokeWidth={1.75} />
              <h2 className="mt-3 font-display text-xl">{c.title}</h2>
              <p className="mt-1 text-sm text-muted">{c.body}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
