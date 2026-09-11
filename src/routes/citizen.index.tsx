import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, LifeBuoy, MessageCircle, Scale } from "lucide-react";

export const Route = createFileRoute("/citizen/")({
  component: CitizenHubPage,
  head: () => ({
    meta: [
      { title: "Citizen legal help — LegalPak" },
      {
        name: "description",
        content:
          "Free legal help for Pakistani citizens — AI chat in English, Roman Urdu, or Urdu, plain-language document drafts, and a directory of verified advocates.",
      },
    ],
  }),
});

const CARDS = [
  {
    to: "/help-desk",
    title: "Help Desk & Rights Navigator",
    body: "Guided wizards for utility overbilling, cyber harassment, eviction, police encounters, and inheritance — with emergency helplines and ready-to-print notices.",
    icon: LifeBuoy,
  },
  {
    to: "/citizen/chat",
    title: "Ask LegalPak AI",
    body: "Describe your situation in plain language — English, Roman Urdu, or Urdu — and get preliminary guidance on your rights and next steps.",
    icon: MessageCircle,
  },
  {
    to: "/citizen/documents",
    title: "Draft a document",
    body: "Affidavits, tenancy deeds, a 489-F cheque-dishonour notice, or a consumer complaint — plain-language starting drafts.",
    icon: FileText,
  },
  {
    to: "/citizen/lawyers",
    title: "Find a lawyer",
    body: "A directory of verified advocates by city and court level, for when a matter needs a person, not a form.",
    icon: Scale,
  },
];

function CitizenHubPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          For every citizen
        </p>
        <h1 className="font-display mt-1 text-3xl md:text-4xl">Legal help, in plain language</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Preliminary guidance under Pakistani law — not a substitute for a licensed advocate, but a
          place to start when you don't know where to start.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
