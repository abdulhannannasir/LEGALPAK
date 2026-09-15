import { PhoneCall, ShieldAlert } from "lucide-react";
import { EMERGENCY_CONTACTS } from "@/lib/citizen/help-desk";
import type { Lang } from "@/lib/citizen/i18n";

const COPY = {
  en: {
    callNow: "In danger? Call now",
    verify:
      "Publicly listed government numbers — source verification required before relying on them in an emergency; if in doubt, dial 15 (Police).",
  },
  ur: {
    callNow: "خطرے میں ہیں؟ ابھی کال کریں",
    verify:
      "یہ عوامی طور پر درج حکومتی نمبر ہیں — ہنگامی صورت میں انحصار کرنے سے پہلے تصدیق ضروری ہے؛ شک کی صورت میں 15 (پولیس) ڈائل کریں۔",
  },
  roman: {
    callNow: "Khatray mein hain? Abhi call karein",
    verify:
      "Yeh awami tor par darj hukoomati numbers hain — hangami surat mein inhisar karne se pehle tasdeeq zaroori hai; shak ki surat mein 15 (Police) dial karein.",
  },
} satisfies Record<Lang, { callNow: string; verify: string }>;

/**
 * Sticky emergency-helpline bar shown at the top of every Help Desk page
 * where a genuine personal-safety risk is plausible. `tel:` links work as
 * tap-to-call on mobile; on desktop they just prompt the OS's default
 * calling app, which is the best available without a telephony backend.
 */
export function EmergencyRibbon({ lang = "en" }: { lang?: Lang }) {
  const c = COPY[lang];
  return (
    <div className="sticky top-0 z-10 mb-6 rounded-[var(--radius-md)] border border-danger bg-flag-high px-4 py-2.5 print:hidden">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-danger">
          <PhoneCall className="size-3.5" strokeWidth={2} />
          {c.callNow}
        </span>
        {EMERGENCY_CONTACTS.map((ec) => (
          <a
            key={ec.number}
            href={`tel:${ec.number}`}
            className="text-xs font-medium text-danger underline decoration-danger/40 underline-offset-2 hover:decoration-danger"
          >
            {lang === "en" ? ec.label : lang === "ur" ? ec.labelUrdu : ec.labelRoman}{" "}
            <span className="font-semibold">{ec.number}</span>
          </a>
        ))}
      </div>
      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-danger/80">
        <ShieldAlert className="size-3 shrink-0" strokeWidth={2} />
        {c.verify}
      </p>
    </div>
  );
}
