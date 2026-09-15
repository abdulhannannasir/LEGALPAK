import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GuidancePanel } from "@/components/citizen/guidance-panel";
import { LanguageSwitcher } from "@/components/citizen/language-switcher";
import { StepProgress } from "@/components/citizen/step-progress";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PackOutput } from "@/components/pack-output";
import { usePersistedState } from "@/lib/use-persisted-state";
import { t, UI, dirFor, usePersistedLang, type Lang } from "@/lib/citizen/i18n";
import { TOPICS } from "@/lib/citizen/topics";
import { generate489FNotice, type Notice489FInput } from "@/lib/citizen/documents";

const COPY = {
  en: {
    title: "Someone's Cheque to You Bounced",
    intro:
      "A dishonoured cheque given toward a genuine debt is both a criminal offence under Section 489-F PPC and a recoverable civil debt.",
    chequeAmount: "Cheque amount (PKR)",
    chequeDate: "Cheque date",
    bankName: "Bank name",
    reasonGiven: "Reason given by bank",
    reasonPlaceholder: "e.g. insufficient funds",
  },
  ur: {
    title: "کسی کا آپ کو دیا گیا چیک باؤنس ہو گیا",
    intro:
      "کسی حقیقی قرض کے عوض دیا گیا باؤنس شدہ چیک بیک وقت دفعہ 489-ایف تعزیراتِ پاکستان کے تحت فوجداری جرم اور قابلِ وصول دیوانی قرض دونوں ہے۔",
    chequeAmount: "چیک کی رقم (روپے)",
    chequeDate: "چیک کی تاریخ",
    bankName: "بینک کا نام",
    reasonGiven: "بینک کی جانب سے دی گئی وجہ",
    reasonPlaceholder: "مثلاً ناکافی رقم",
  },
  roman: {
    title: "Kisi ka aap ko diya gaya cheque bounce ho gaya",
    intro:
      "Kisi haqiqi qarz ke ewaz diya gaya bounce shuda cheque bik waqt Section 489-F PPC ke tehat criminal jurm aur qabil-e-wasool civil qarz dono hai.",
    chequeAmount: "Cheque ki raqam (PKR)",
    chequeDate: "Cheque ki tareekh",
    bankName: "Bank ka naam",
    reasonGiven: "Bank ki janib se di gayi wajah",
    reasonPlaceholder: "maslan na-kafi raqam",
  },
} satisfies Record<Lang, Record<string, string>>;

export const Route = createFileRoute("/help-desk/bounced-cheque")({
  component: BouncedChequePage,
  head: () => ({
    meta: [
      { title: "Bounced Cheque — Help Desk — LegalPak" },
      {
        name: "description",
        content:
          "Someone's cheque to you was dishonoured — generate a Section 489-F legal notice and understand the criminal and civil recovery routes in Pakistan.",
      },
    ],
  }),
});

const emptyForm: Notice489FInput = {
  senderName: "",
  senderAddress: "",
  recipientName: "",
  recipientAddress: "",
  chequeNumber: "",
  chequeAmount: 0,
  bankName: "",
  chequeDate: "",
  dishonorReason: "",
  city: "",
};

function BouncedChequePage() {
  const [lang, setLang] = usePersistedLang();
  const topic = TOPICS.find((tp) => tp.id === "bounced-cheque")!;
  const dir = dirFor(lang);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = usePersistedState<Notice489FInput>(
    "legalpak:help-desk-cheque",
    emptyForm,
  );

  function set<K extends keyof Notice489FInput>(k: K, v: Notice489FInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const out = useMemo(() => generate489FNotice(form), [form]);

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
              <Field label={COPY[lang].chequeAmount}>
                <Input
                  type="number"
                  value={form.chequeAmount || ""}
                  onChange={(e) => set("chequeAmount", Number(e.target.value) || 0)}
                />
              </Field>
              <Field label={COPY[lang].chequeDate}>
                <Input
                  type="date"
                  value={form.chequeDate}
                  onChange={(e) => set("chequeDate", e.target.value)}
                />
              </Field>
              <Field label={COPY[lang].bankName}>
                <Input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} />
              </Field>
              <Field label={COPY[lang].reasonGiven}>
                <Input
                  placeholder={COPY[lang].reasonPlaceholder}
                  value={form.dishonorReason}
                  onChange={(e) => set("dishonorReason", e.target.value)}
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
            topicId="bounced-cheque"
            escalationCity={form.city || undefined}
            escalationSpecialty="Cheque / Recovery"
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
                  <Field label="Cheque issuer's name">
                    <Input
                      value={form.recipientName}
                      onChange={(e) => set("recipientName", e.target.value)}
                    />
                  </Field>
                  <Field label="Cheque issuer's address">
                    <Input
                      value={form.recipientAddress}
                      onChange={(e) => set("recipientAddress", e.target.value)}
                    />
                  </Field>
                  <Field label="Cheque number">
                    <Input
                      value={form.chequeNumber}
                      onChange={(e) => set("chequeNumber", e.target.value)}
                    />
                  </Field>
                </section>
                <div className="lg:sticky lg:top-20">
                  <PackOutput text={out} filename="489f-legal-notice.txt" />
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
