import { Languages } from "lucide-react";
import { LANGS, type Lang } from "@/lib/citizen/i18n";

/** Segmented English / Urdu / Roman Urdu control shared by every citizen-help page. */
export function LanguageSwitcher({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
      <Languages className="ml-1.5 size-3.5 text-muted" strokeWidth={1.75} />
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => onChange(l.id)}
          className={`min-h-8 rounded-full px-3 text-xs font-medium transition-colors ${
            lang === l.id ? "bg-primary text-primary-fg" : "text-muted hover:text-fg"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
