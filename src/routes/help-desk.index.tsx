import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { EmergencyRibbon } from "@/components/citizen/emergency-ribbon";
import { HELP_DESK_CATEGORIES } from "@/lib/citizen/help-desk";

export const Route = createFileRoute("/help-desk/")({
  component: HelpDeskHubPage,
  head: () => ({
    meta: [
      { title: "Help Desk & Rights Navigator — LegalPak" },
      {
        name: "description",
        content:
          "Guided wizards for utility overbilling, cyber harassment, eviction, police encounters, and inheritance in Pakistan — with emergency helplines on every page.",
      },
    ],
  }),
});

function HelpDeskHubPage() {
  return (
    <div className="space-y-6">
      <EmergencyRibbon />

      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Rights Navigator
        </p>
        <h1 className="font-display text-3xl">Help Desk & Rights Navigator</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Pick the situation closest to yours. Each guide walks through what to check, what the
          law says, and gives you a ready-to-print notice or checklist — preliminary guidance, not
          legal representation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {HELP_DESK_CATEGORIES.map((c) => (
          <Link
            key={c.id}
            to={c.to}
            className="group flex flex-col justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-5 transition-colors hover:border-accent"
          >
            <div>
              <h3 className="font-display text-lg">
                {c.title} <span className="font-sans text-sm text-muted">/ {c.titleUrdu}</span>
              </h3>
              <p className="mt-2 text-sm text-muted">{c.body}</p>
            </div>
            <span className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
              Start <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
