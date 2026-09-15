import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EmergencyRibbon } from "@/components/citizen/emergency-ribbon";
import { GuidancePanel } from "@/components/citizen/guidance-panel";
import { LanguageSwitcher } from "@/components/citizen/language-switcher";
import { StepProgress } from "@/components/citizen/step-progress";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PackOutput } from "@/components/pack-output";
import { usePersistedState } from "@/lib/use-persisted-state";
import { t, UI, dirFor, usePersistedLang, type Lang } from "@/lib/citizen/i18n";
import { TOPICS } from "@/lib/citizen/topics";
import {
  CYBER_OFFENSE_TYPES,
  CYBER_PLATFORMS,
  cyberApplicableLaw,
  generateCyberComplaintPacket,
  type CyberReportInput,
} from "@/lib/citizen/help-desk";

export const Route = createFileRoute("/help-desk/cyber-report")({
  component: CyberReportPage,
  head: () => ({
    meta: [
      { title: "Cyber Harassment & Scams — Help Desk — LegalPak" },
      {
        name: "description",
        content:
          "Report blackmail, non-consensual imagery, OTP scams, or impersonation in Pakistan — generate a PECA 2016 complaint packet for the FIA Cybercrime Wing / NCCIA.",
      },
    ],
  }),
});

const COPY = {
  en: {
    title: "Cyber Harassment, Blackmail & Online Scams",
    intro:
      "Do not pay demanded money and do not delete evidence — describe the incident below to generate a complaint packet for the National Cyber Crime Investigation Agency (NCCIA)/FIA Cybercrime Wing.",
    natureOfOffense: "Nature of offense",
    platform: "Platform",
    culpritIdentifier: "Culprit identifier",
    culpritPlaceholder: "Phone number, profile link, or account title",
    likelyLaw: "Likely applicable law:",
  },
  ur: {
    title: "سائبر ہراسانی، بلیک میلنگ، اور آن لائن فراڈ",
    intro:
      "مطالبہ کردہ رقم ہرگز ادا نہ کریں اور کوئی ثبوت ڈیلیٹ نہ کریں — نیچے واقعہ بیان کریں تاکہ نیشنل سائبر کرائم انویسٹیگیشن ایجنسی (این سی سی آئی اے)/ایف آئی اے سائبر کرائم ونگ کے لیے شکایتی پیکٹ تیار ہو سکے۔",
    natureOfOffense: "جرم کی نوعیت",
    platform: "پلیٹ فارم",
    culpritIdentifier: "مجرم کی شناخت",
    culpritPlaceholder: "فون نمبر، پروفائل لنک، یا اکاؤنٹ کا نام",
    likelyLaw: "غالباً قابلِ اطلاق قانون:",
  },
  roman: {
    title: "Cyber Harassment, Blackmail aur Online Scams",
    intro:
      "Mutaliba karda raqam hargiz ada na karein aur koi saboot delete na karein — neeche waqia bayan karein taake NCCIA/FIA Cybercrime Wing ke liye shikayati packet tayar ho sake.",
    natureOfOffense: "Jurm ki nauiyat",
    platform: "Platform",
    culpritIdentifier: "Mujrim ki shanakht",
    culpritPlaceholder: "Phone number, profile link, ya account ka naam",
    likelyLaw: "Ghaliban qabil-e-itlaq qanoon:",
  },
} satisfies Record<Lang, Record<string, string>>;

const emptyForm: CyberReportInput = {
  offenseType: "Non-consensual imagery / blackmail",
  platform: "WhatsApp",
  culpritIdentifier: "",
  victimName: "",
  victimCnic: "",
  victimAddress: "",
  victimPhone: "",
  incidentDescription: "",
  city: "",
};

function CyberReportPage() {
  const [lang, setLang] = usePersistedLang();
  const topic = TOPICS.find((tp) => tp.id === "cyber-report")!;
  const dir = dirFor(lang);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = usePersistedState<CyberReportInput>(
    "legalpak:help-desk-cyber",
    emptyForm,
  );

  function set<K extends keyof CyberReportInput>(k: K, v: CyberReportInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const out = useMemo(() => generateCyberComplaintPacket(form), [form]);

  return (
    <div className="space-y-6" dir={dir}>
      <EmergencyRibbon lang={lang} />
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
              <Field label={COPY[lang].natureOfOffense}>
                <Select
                  value={form.offenseType}
                  onChange={(e) => set("offenseType", e.target.value as CyberReportInput["offenseType"])}
                >
                  {CYBER_OFFENSE_TYPES.map((t2) => (
                    <option key={t2} value={t2}>
                      {t2}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={COPY[lang].platform}>
                <Select
                  value={form.platform}
                  onChange={(e) => set("platform", e.target.value as CyberReportInput["platform"])}
                >
                  {CYBER_PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={COPY[lang].culpritIdentifier} className="sm:col-span-2">
                <Input
                  placeholder={COPY[lang].culpritPlaceholder}
                  value={form.culpritIdentifier}
                  onChange={(e) => set("culpritIdentifier", e.target.value)}
                />
              </Field>
              <Field label={t(lang, UI.city)}>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
            </div>
            <p className="mt-4 text-xs text-muted">
              {COPY[lang].likelyLaw}{" "}
              <span className="font-medium">{cyberApplicableLaw(form.offenseType)}</span>
            </p>
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
            topicId="cyber-report"
            escalationCity={form.city || undefined}
            escalationSpecialty="Cyber Crime"
            documentSlot={
              <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                  <Field label="Your name">
                    <Input value={form.victimName} onChange={(e) => set("victimName", e.target.value)} />
                  </Field>
                  <Field label="Your CNIC">
                    <Input value={form.victimCnic} onChange={(e) => set("victimCnic", e.target.value)} />
                  </Field>
                  <Field label="Your phone">
                    <Input
                      value={form.victimPhone}
                      onChange={(e) => set("victimPhone", e.target.value)}
                    />
                  </Field>
                  <Field label="Your address">
                    <Input
                      value={form.victimAddress}
                      onChange={(e) => set("victimAddress", e.target.value)}
                    />
                  </Field>
                  <Field label="What happened?">
                    <Textarea
                      value={form.incidentDescription}
                      onChange={(e) => set("incidentDescription", e.target.value)}
                    />
                  </Field>
                </section>
                <div className="lg:sticky lg:top-20">
                  <PackOutput text={out} filename="cyber-complaint-packet.txt" />
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
