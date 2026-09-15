/**
 * Minimal language layer for the Citizen Legal Help experience — English,
 * Urdu (Nastaliq script), and Roman Urdu. `usePersistedLang` mirrors the
 * pattern in usePersistedState so a visitor's language choice survives
 * across the hub and every workflow page.
 */
import { usePersistedState } from "@/lib/use-persisted-state";

export type Lang = "en" | "ur" | "roman";

export type LocalizedText = { en: string; ur: string; roman: string };

export const LANGS: { id: Lang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "ur", label: "اردو" },
  { id: "roman", label: "Roman Urdu" },
];

export function t(lang: Lang, text: LocalizedText): string {
  return text[lang] || text.en;
}

/** Urdu is the only script of the three that reads right-to-left. */
export function dirFor(lang: Lang): "rtl" | "ltr" {
  return lang === "ur" ? "rtl" : "ltr";
}

export function usePersistedLang() {
  return usePersistedState<Lang>("legalpak:citizen-lang", "en");
}

export const UI: Record<string, LocalizedText> = {
  eyebrow: { en: "Citizen legal help", ur: "شہری قانونی مدد", roman: "Shehri qanooni madad" },
  hubTitle: { en: "What happened?", ur: "کیا ہوا؟", roman: "Kya hua?" },
  hubSubtitle: {
    en: "Tell us what's going on and we'll walk you through your rights, what to do now, and the document you may need.",
    ur: "ہمیں بتائیں کہ کیا ہو رہا ہے — ہم آپ کو آپ کے حقوق، اگلے اقدامات، اور درکار دستاویز کے بارے میں رہنمائی دیں گے۔",
    roman: "Hamein batayein keh kya ho raha hai — hum aap ko aap ke haqooq, agle iqdamat, aur darkar dastawez ke bare mein rehnumai dein ge.",
  },
  disclaimer: {
    en: "Preliminary guidance under Pakistani law — not a substitute for a licensed advocate, but a place to start when you don't know where to start.",
    ur: "پاکستانی قانون کے تحت ابتدائی رہنمائی — یہ لائسنس یافتہ وکیل کا متبادل نہیں، بلکہ وہاں سے شروعات کرنے کی جگہ ہے جہاں آپ کو پتا نہ ہو کہ کہاں سے شروع کریں۔",
    roman: "Pakistani qanoon ke tehat ibtidai rehnumai — yeh license-yafta wakeel ka mutabadil nahi, balkeh wahan se shuruaat karne ki jagah hai jahan aap ko pata na ho keh kahan se shuru karein.",
  },
  notLegalAdvice: {
    en: "This is preliminary guidance generated from a fixed set of rules, not a lawyer's opinion — it is not definitive legal advice.",
    ur: "یہ ایک متعین اصولوں کی بنیاد پر ابتدائی رہنمائی ہے، وکیل کی رائے نہیں — یہ حتمی قانونی مشورہ نہیں ہے۔",
    roman: "Yeh aik muta'ayyan usoolon ki bunyad par ibtidai rehnumai hai, wakeel ki raye nahi — yeh hatmi qanooni mashwara nahi hai.",
  },
  start: { en: "Start", ur: "شروع کریں", roman: "Shuru karein" },
  step1Title: {
    en: "Step 1 of 2 — Tell us what happened",
    ur: "مرحلہ 1 از 2 — ہمیں بتائیں کیا ہوا",
    roman: "Marhala 1 az 2 — Hamein batayein kya hua",
  },
  step2Title: {
    en: "Step 2 of 2 — Your guidance",
    ur: "مرحلہ 2 از 2 — آپ کی رہنمائی",
    roman: "Marhala 2 az 2 — Aap ki rehnumai",
  },
  continue: { en: "Continue", ur: "جاری رکھیں", roman: "Jari rakhein" },
  back: { en: "Back", ur: "واپس", roman: "Wapis" },
  whatMayBeHappening: {
    en: "What may be happening",
    ur: "کیا ہو سکتا ہے",
    roman: "Kya ho sakta hai",
  },
  whatYouCanDoNow: {
    en: "What you can do now",
    ur: "آپ ابھی کیا کر سکتے ہیں",
    roman: "Aap abhi kya kar sakte hain",
  },
  evidenceToPreserve: {
    en: "Evidence to preserve",
    ur: "محفوظ رکھنے کے شواہد",
    roman: "Mehfooz rakhne ke shawahid",
  },
  generateDocument: {
    en: "The document you can generate",
    ur: "وہ دستاویز جو آپ بنا سکتے ہیں",
    roman: "Woh dastawez jo aap bana sakte hain",
  },
  whenToContactLawyer: {
    en: "When to contact a lawyer",
    ur: "وکیل سے کب رابطہ کریں",
    roman: "Wakeel se kab rabta karein",
  },
  emergencyContacts: {
    en: "Emergency contacts",
    ur: "ہنگامی رابطے",
    roman: "Hangami rabtay",
  },
  documentInEnglishNote: {
    en: "Fields below are in English because the generated document is drafted in formal English, the language Pakistani courts and authorities expect.",
    ur: "نیچے دیے گئے خانے انگریزی میں ہیں کیونکہ تیار ہونے والی دستاویز رسمی انگریزی میں لکھی جاتی ہے، جو پاکستانی عدالتیں اور ادارے استعمال کرتے ہیں۔",
    roman: "Neeche diye gaye khanay English mein hain kyunkeh tayar hone wali dastawez rasmi English mein likhi jati hai, jo Pakistani adalatein aur idaray istemal karte hain.",
  },
  city: { en: "City", ur: "شہر", roman: "Shehar" },
  province: { en: "Province / territory", ur: "صوبہ / علاقہ", roman: "Sooba / ilaqa" },
  yes: { en: "Yes", ur: "ہاں", roman: "Haan" },
  no: { en: "No", ur: "نہیں", roman: "Nahi" },
  askAi: { en: "Ask LegalPak AI", ur: "لیگل پاک اے آئی سے پوچھیں", roman: "LegalPak AI se poochein" },
  draftDocument: {
    en: "Draft another document",
    ur: "کوئی اور دستاویز تیار کریں",
    roman: "Koi aur dastawez tayar karein",
  },
  findLawyer: { en: "Find a lawyer", ur: "وکیل تلاش کریں", roman: "Wakeel talash karein" },
  fillFormPrompt: {
    en: "Fill in the details above to see your guidance and generate a document.",
    ur: "اپنی رہنمائی دیکھنے اور دستاویز بنانے کے لیے اوپر تفصیلات درج کریں۔",
    roman: "Apni rehnumai dekhne aur dastawez banane ke liye oopar tafseelat darj karein.",
  },
};
