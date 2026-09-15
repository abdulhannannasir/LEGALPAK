import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, MessageCircle, Scale } from "lucide-react";
import { LanguageSwitcher } from "@/components/citizen/language-switcher";
import { TOPICS } from "@/lib/citizen/topics";
import { t, UI, dirFor, usePersistedLang } from "@/lib/citizen/i18n";

export const Route = createFileRoute("/citizen/")({
  component: CitizenHubPage,
  head: () => ({
    meta: [
      { title: "What happened? — Citizen legal help — LegalPak" },
      {
        name: "description",
        content:
          "Tell LegalPak what happened and get a guided path to your rights, next steps, evidence to preserve, and a document you can generate — in English, Urdu, or Roman Urdu.",
      },
    ],
  }),
});

const SECONDARY_LINKS = [
  { to: "/citizen/chat", label: UI.askAi, icon: MessageCircle },
  { to: "/citizen/documents", label: UI.draftDocument, icon: FileText },
  { to: "/citizen/lawyers", label: UI.findLawyer, icon: Scale },
];

function CitizenHubPage() {
  const [lang, setLang] = usePersistedLang();
  const dir = dirFor(lang);

  return (
    <div className="space-y-8" dir={dir}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            {t(lang, UI.eyebrow)}
          </p>
          <h1 className="font-display mt-1 text-3xl md:text-4xl">{t(lang, UI.hubTitle)}</h1>
          <p className="mt-3 max-w-2xl text-muted">{t(lang, UI.hubSubtitle)}</p>
        </div>
        <LanguageSwitcher lang={lang} onChange={setLang} />
      </div>

      <p className="max-w-2xl rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-muted">
        {t(lang, UI.disclaimer)}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TOPICS.map((topic) => {
          const Icon = topic.icon;
          return (
            <Link
              key={topic.id}
              to={topic.to}
              className="group flex flex-col justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-colors hover:border-accent"
            >
              <div>
                <Icon className="size-5 text-accent" strokeWidth={1.75} />
                <h2 className="font-display mt-3 text-lg leading-snug">{t(lang, topic.title)}</h2>
                <p className="mt-1.5 text-sm text-muted">{t(lang, topic.body)}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        {SECONDARY_LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              className="flex min-h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm text-muted hover:border-accent hover:text-fg"
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {t(lang, l.label)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
