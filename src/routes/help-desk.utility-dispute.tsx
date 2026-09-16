import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { GuidancePanel } from "@/components/citizen/guidance-panel";
import { LanguageSwitcher } from "@/components/citizen/language-switcher";
import { StepProgress } from "@/components/citizen/step-progress";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { PackOutput } from "@/components/pack-output";
import { usePersistedState } from "@/lib/use-persisted-state";
import { t, UI, dirFor, usePersistedLang, type Lang } from "@/lib/citizen/i18n";
import { TOPICS } from "@/lib/citizen/topics";
import {
  UTILITY_PROVIDERS,
  generateUtilityRepresentationLetter,
  isLikelyDetectionBill,
  type UtilityDisputeInput,
} from "@/lib/citizen/help-desk";

export const Route = createFileRoute("/help-desk/utility-dispute")({
  component: UtilityDisputePage,
  head: () => ({
    meta: [
      { title: "Utility Overbilling — Help Desk — LegalPak" },
      {
        name: "description",
        content:
          "Challenge a LESCO, K-Electric, IESCO, MEPCO, or SNGPL detection bill — generate a representation letter citing Section 26(6) of the Electricity Act, 1910.",
      },
    ],
  }),
});

const COPY = {
  en: {
    title: "Utility Overbilling & Detection Bills",
    intro:
      "For LESCO, K-Electric, IESCO, MEPCO or SNGPL detection/tampering bills that look disproportionate to your actual usage.",
    providerLabel: "Utility provider",
    referenceLabel: "Reference / consumer number",
    avgUnitsLabel: "Average monthly units (normal bill)",
    disputedUnitsLabel: "Disputed units billed",
    surchargeLabel: "Detection surcharge (PKR)",
    flaggedNote:
      "This looks like an unauthorized detection/tampering claim — Section 26(6) of the Electricity Act, 1910 requires a proper inspection report before such a charge is valid.",
    unflaggedNote:
      "This doesn't clearly look like a detection bill, but the letter below still requests re-verification of the reading.",
  },
  ur: {
    title: "بجلی/گیس کا زائد بل اور ڈیٹیکشن بل",
    intro:
      "LESCO، K-Electric، IESCO، MEPCO یا SNGPL کے ڈیٹیکشن/ٹیمپرنگ بلوں کے لیے جو آپ کے اصل استعمال سے غیر متناسب لگیں۔",
    providerLabel: "بجلی/گیس فراہم کنندہ",
    referenceLabel: "ریفرنس / کنزیومر نمبر",
    avgUnitsLabel: "اوسط ماہانہ یونٹس (معمول کا بل)",
    disputedUnitsLabel: "متنازع بل کیے گئے یونٹس",
    surchargeLabel: "ڈیٹیکشن سرچارج (روپے)",
    flaggedNote:
      "یہ ایک غیر مجاز ڈیٹیکشن/ٹیمپرنگ کا دعویٰ لگتا ہے — الیکٹریسٹی ایکٹ 1910 کی دفعہ 26(6) کے تحت ایسا چارج درست ہونے کے لیے پہلے مناسب معائنہ رپورٹ درکار ہے۔",
    unflaggedNote:
      "یہ واضح طور پر ڈیٹیکشن بل نہیں لگتا، لیکن نیچے دیا گیا خط پھر بھی ریڈنگ کی دوبارہ تصدیق کی درخواست کرتا ہے۔",
  },
  roman: {
    title: "Bijli/Gas ka Zaid Bill aur Detection Bills",
    intro:
      "LESCO, K-Electric, IESCO, MEPCO ya SNGPL ke detection/tampering bills ke liye jo aap ke asal istemal se ghair mutanasib lagein.",
    providerLabel: "Bijli/Gas provider",
    referenceLabel: "Reference / consumer number",
    avgUnitsLabel: "Average monthly units (mamool ka bill)",
    disputedUnitsLabel: "Mutanaza bill kiye gaye units",
    surchargeLabel: "Detection surcharge (PKR)",
    flaggedNote:
      "Yeh aik ghair mujaz detection/tampering ka dawa lagta hai — Electricity Act 1910 ki Section 26(6) ke tehat aisa charge durust hone ke liye pehle munasib muaina report darkar hai.",
    unflaggedNote:
      "Yeh wazeh tor par detection bill nahi lagta, lekin neeche diya gaya khat phir bhi reading ki dobara tasdeeq ki darkhwast karta hai.",
  },
} satisfies Record<Lang, Record<string, string>>;

const emptyForm: UtilityDisputeInput = {
  provider: "LESCO",
  consumerName: "",
  consumerAddress: "",
  referenceNumber: "",
  averageMonthlyUnits: 0,
  disputedUnitsBilled: 0,
  detectionSurcharge: 0,
  city: "",
};

function UtilityDisputePage() {
  const [lang, setLang] = usePersistedLang();
  const topic = TOPICS.find((tp) => tp.id === "utility-dispute")!;
  const dir = dirFor(lang);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = usePersistedState<UtilityDisputeInput>(
    "legalpak:help-desk-utility",
    emptyForm,
  );

  function set<K extends keyof UtilityDisputeInput>(k: K, v: UtilityDisputeInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const flagged = isLikelyDetectionBill(form);
  const out = useMemo(() => generateUtilityRepresentationLetter(form), [form]);

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            {t(lang, UI.eyebrow)} / {t(lang, topic.title)}
          </p>
          <h1 className="font-display text-3xl">{COPY[lang].title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{COPY[lang].intro}</p>
        </div>
        <LanguageSwitcher lang={lang} onChange={setLang} />
      </div>

      <StepProgress step={step} labels={[t(lang, UI.step1Title), t(lang, UI.step2Title)]} />

      {step === 1 && (
        <>
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={COPY[lang].providerLabel}>
                <Select
                  value={form.provider}
                  onChange={(e) => set("provider", e.target.value as UtilityDisputeInput["provider"])}
                >
                  {UTILITY_PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={COPY[lang].referenceLabel}>
                <Input
                  value={form.referenceNumber}
                  onChange={(e) => set("referenceNumber", e.target.value)}
                />
              </Field>
              <Field label={t(lang, UI.city)}>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label={COPY[lang].avgUnitsLabel}>
                <Input
                  type="number"
                  value={form.averageMonthlyUnits || ""}
                  onChange={(e) => set("averageMonthlyUnits", Number(e.target.value) || 0)}
                />
              </Field>
              <Field label={COPY[lang].disputedUnitsLabel}>
                <Input
                  type="number"
                  value={form.disputedUnitsBilled || ""}
                  onChange={(e) => set("disputedUnitsBilled", Number(e.target.value) || 0)}
                />
              </Field>
              <Field label={COPY[lang].surchargeLabel}>
                <Input
                  type="number"
                  value={form.detectionSurcharge || ""}
                  onChange={(e) => set("detectionSurcharge", Number(e.target.value) || 0)}
                />
              </Field>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-border bg-bg p-3 text-xs">
              <AlertTriangle
                className={`mt-0.5 size-4 shrink-0 ${flagged ? "text-danger" : "text-muted"}`}
                strokeWidth={1.75}
              />
              <span className={flagged ? "text-danger" : "text-muted"}>
                {flagged ? COPY[lang].flaggedNote : COPY[lang].unflaggedNote}
              </span>
            </div>
          </section>

          <div className="flex justify-end">
            <Button type="button" onClick={() => setStep(2)}>
              {t(lang, UI.continue)}
            </Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <GuidancePanel
            lang={lang}
            topicId="utility-dispute"
            escalationCity={form.city || undefined}
            escalationSpecialty="Utility / Consumer"
            documentSlot={
              <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                  <Field label="Your name">
                    <Input
                      value={form.consumerName}
                      onChange={(e) => set("consumerName", e.target.value)}
                    />
                  </Field>
                  <Field label="Address">
                    <Input
                      value={form.consumerAddress}
                      onChange={(e) => set("consumerAddress", e.target.value)}
                    />
                  </Field>
                </section>
                <div className="lg:sticky lg:top-20">
                  <PackOutput text={out} filename="utility-representation-letter.txt" />
                </div>
              </div>
            }
          />
          <div className="flex justify-start">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              {t(lang, UI.back)}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
