import type { ReactNode } from "react";
import { CheckCircle2, FileSearch, Gavel, Info, ListChecks } from "lucide-react";
import { AdvocateEscalationCard } from "@/components/citizen/advocate-escalation-card";
import { GUIDANCE } from "@/lib/citizen/guidance";
import { t, UI, type Lang } from "@/lib/citizen/i18n";

/**
 * The shared "step 2" results layout every help-desk wizard renders once the
 * triage questions are answered: what may be happening, what to do now,
 * evidence to keep, the generated document, and when a lawyer is needed.
 * `topicId` must match a key in GUIDANCE (see src/lib/citizen/guidance.ts).
 */
export function GuidancePanel({
  lang,
  topicId,
  documentSlot,
  escalationCity,
  escalationSpecialty,
}: {
  lang: Lang;
  topicId: keyof typeof GUIDANCE;
  documentSlot: ReactNode;
  escalationCity?: string;
  escalationSpecialty: string;
}) {
  const content = GUIDANCE[topicId];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-border bg-bg p-3 text-xs text-muted">
        <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
        <span>{t(lang, UI.notLegalAdvice)}</span>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 font-display text-lg">
          <FileSearch className="size-4 text-accent" strokeWidth={1.75} />
          {t(lang, UI.whatMayBeHappening)}
        </h2>
        <p className="mt-2 text-sm text-muted">{t(lang, content.whatMayBeHappening)}</p>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 font-display text-lg">
          <ListChecks className="size-4 text-accent" strokeWidth={1.75} />
          {t(lang, UI.whatYouCanDoNow)}
        </h2>
        <ul className="mt-2 space-y-2">
          {content.whatYouCanDoNow.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.75} />
              <span>{t(lang, item)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 font-display text-lg">
          <FileSearch className="size-4 text-accent" strokeWidth={1.75} />
          {t(lang, UI.evidenceToPreserve)}
        </h2>
        <ul className="mt-2 space-y-2">
          {content.evidenceToPreserve.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.75} />
              <span>{t(lang, item)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 font-display text-lg">
          <Gavel className="size-4 text-accent" strokeWidth={1.75} />
          {t(lang, UI.whenToContactLawyer)}
        </h2>
        <p className="mt-2 text-sm text-muted">{t(lang, content.whenToContactLawyer)}</p>
      </section>

      <div>
        <h2 className="font-display text-lg">{t(lang, UI.generateDocument)}</h2>
        <p className="mt-1 text-xs text-muted">{t(lang, UI.documentInEnglishNote)}</p>
        <div className="mt-4">{documentSlot}</div>
      </div>

      <AdvocateEscalationCard city={escalationCity} specialty={escalationSpecialty} lang={lang} />
    </div>
  );
}
