import { Gavel } from "lucide-react";
import { t, UI, type Lang } from "@/lib/citizen/i18n";

const COPY = {
  en: (city?: string) =>
    `Need an advocate${city ? ` in ${city}` : ""} to file this notice or appear before the tribunal? Book a verified counsel starting at PKR 2,000.`,
  ur: (city?: string) =>
    `کیا آپ کو یہ نوٹس فائل کرنے یا ٹریبونل میں پیش ہونے کے لیے${city ? ` ${city} میں` : ""} وکیل درکار ہے؟ صرف 2,000 روپے سے تصدیق شدہ وکیل بک کریں۔`,
  roman: (city?: string) =>
    `Kya aap ko yeh notice file karne ya tribunal mein pesh hone ke liye${city ? ` ${city} mein` : ""} wakeel darkar hai? Sirf PKR 2,000 se tasdeeq shuda wakeel book karein.`,
};

/**
 * Conversion card shown under every generated help-desk notice/checklist —
 * prepopulates the lawyer directory with the user's city and the dispute
 * type so they don't have to re-describe their situation.
 */
export function AdvocateEscalationCard({
  city,
  specialty,
  lang = "en",
}: {
  city?: string;
  specialty: string;
  lang?: Lang;
}) {
  const params = new URLSearchParams();
  if (city) params.set("city", city);
  params.set("specialty", specialty);

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Gavel className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.75} />
        <p className="text-sm text-muted">{COPY[lang](city)}</p>
      </div>
      <a
        href={`/citizen/lawyers?${params.toString()}`}
        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-accent"
      >
        {t(lang, UI.findLawyer)}
      </a>
    </div>
  );
}
