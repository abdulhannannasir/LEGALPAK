import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  LEGAL_NOTICE_PURPOSES,
  generateGeneralLegalNotice,
  type GeneralLegalNoticeInput,
} from "@/lib/citizen/help-desk";

export const Route = createFileRoute("/help-desk/legal-notice")({
  component: LegalNoticePage,
  head: () => ({
    meta: [
      { title: "Legal Notice — Help Desk — LegalPak" },
      {
        name: "description",
        content:
          "Generate a formal legal notice for Pakistan — a demand for payment, breach of agreement, harassment, or a property dispute — before going to court.",
      },
    ],
  }),
});

const COPY = {
  en: {
    title: "Send a Legal Notice",
    intro:
      "A formal, on-record warning before you go to court — for anything not already covered by a more specific guide on the Citizen Legal Help hub.",
    aboutLabel: "What is this notice about?",
    whatHappenedLabel: "What happened?",
    whatHappenedPlaceholder: "Describe the situation, with relevant dates",
    demandLabel: "What are you demanding?",
    demandPlaceholder: "Exactly what you want the other side to do",
    deadlineLabel: "Deadline (days)",
  },
  ur: {
    title: "قانونی نوٹس بھیجیں",
    intro:
      "عدالت جانے سے پہلے ایک باضابطہ، ریکارڈ شدہ وارننگ — ایسے معاملات کے لیے جو سٹیزن لیگل ہیلپ کے کسی مخصوص گائیڈ میں شامل نہیں۔",
    aboutLabel: "یہ نوٹس کس بارے میں ہے؟",
    whatHappenedLabel: "کیا ہوا؟",
    whatHappenedPlaceholder: "متعلقہ تاریخوں کے ساتھ صورتحال بیان کریں",
    demandLabel: "آپ کیا مطالبہ کر رہے ہیں؟",
    demandPlaceholder: "بالکل واضح کریں کہ دوسرے فریق سے کیا چاہتے ہیں",
    deadlineLabel: "ڈیڈ لائن (دن)",
  },
  roman: {
    title: "Legal notice bhejein",
    intro:
      "Adalat jane se pehle aik bazabta, record shuda warning — un maamlat ke liye jo Citizen Legal Help ke kisi khaas guide mein shamil nahi.",
    aboutLabel: "Yeh notice kis bare mein hai?",
    whatHappenedLabel: "Kya hua?",
    whatHappenedPlaceholder: "Mutalliqa tareekhon ke sath soorat-e-haal bayan karein",
    demandLabel: "Aap kya mutaliba kar rahay hain?",
    demandPlaceholder: "Bilkul wazeh karein keh dusray fareeq se kya chahte hain",
    deadlineLabel: "Deadline (din)",
  },
} satisfies Record<Lang, Record<string, string>>;

const emptyForm: GeneralLegalNoticeInput = {
  purpose: "Demand for payment",
  senderName: "",
  senderAddress: "",
  recipientName: "",
  recipientAddress: "",
  facts: "",
  demand: "",
  deadlineDays: 14,
  city: "",
};

function LegalNoticePage() {
  const [lang, setLang] = usePersistedLang();
  const topic = TOPICS.find((tp) => tp.id === "legal-notice")!;
  const dir = dirFor(lang);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = usePersistedState<GeneralLegalNoticeInput>(
    "legalpak:help-desk-legal-notice",
    emptyForm,
  );

  function set<K extends keyof GeneralLegalNoticeInput>(k: K, v: GeneralLegalNoticeInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const out = useMemo(() => generateGeneralLegalNotice(form), [form]);

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
              <Field label={COPY[lang].aboutLabel} className="sm:col-span-2">
                <Select
                  value={form.purpose}
                  onChange={(e) => set("purpose", e.target.value as GeneralLegalNoticeInput["purpose"])}
                >
                  {LEGAL_NOTICE_PURPOSES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={COPY[lang].whatHappenedLabel} className="sm:col-span-2">
                <Textarea
                  value={form.facts}
                  onChange={(e) => set("facts", e.target.value)}
                  placeholder={COPY[lang].whatHappenedPlaceholder}
                />
              </Field>
              <Field label={COPY[lang].demandLabel} className="sm:col-span-2">
                <Textarea
                  value={form.demand}
                  onChange={(e) => set("demand", e.target.value)}
                  placeholder={COPY[lang].demandPlaceholder}
                />
              </Field>
              <Field label={COPY[lang].deadlineLabel}>
                <Input
                  type="number"
                  value={form.deadlineDays || ""}
                  onChange={(e) => set("deadlineDays", Number(e.target.value) || 14)}
                />
              </Field>
              <Field label={t(lang, UI.city)}>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
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
            topicId="legal-notice"
            escalationCity={form.city || undefined}
            escalationSpecialty="General Legal Notice"
            documentSlot={
              <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                  <Field label="Your name">
                    <Input
                      value={form.senderName}
                      onChange={(e) => set("senderName", e.target.value)}
                    />
                  </Field>
                  <Field label="Your address">
                    <Input
                      value={form.senderAddress}
                      onChange={(e) => set("senderAddress", e.target.value)}
                    />
                  </Field>
                  <Field label="Recipient's name">
                    <Input
                      value={form.recipientName}
                      onChange={(e) => set("recipientName", e.target.value)}
                    />
                  </Field>
                  <Field label="Recipient's address">
                    <Input
                      value={form.recipientAddress}
                      onChange={(e) => set("recipientAddress", e.target.value)}
                    />
                  </Field>
                </section>
                <div className="lg:sticky lg:top-20">
                  <PackOutput text={out} filename="legal-notice.txt" />
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
