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
  generateCivilPartitionBrief,
  generateNadraSfuChecklist,
  successionRoute,
  type SuccessionInput,
} from "@/lib/citizen/help-desk";

export const Route = createFileRoute("/help-desk/succession")({
  component: SuccessionPage,
  head: () => ({
    meta: [
      { title: "Inheritance & Succession — Help Desk — LegalPak" },
      {
        name: "description",
        content:
          "Find out whether your inheritance case in Pakistan needs the NADRA Succession Facilitation Unit or a civil court partition suit, and get the right checklist.",
      },
    ],
  }),
});

const COPY = {
  en: {
    title: "NADRA Succession vs. Civil Court Partition",
    intro:
      "Two questions decide the route: are all heirs alive and biometrically available, and is any title disputed or any heir an unrepresented minor?",
    heirsAvailableLabel: "Are all legal heirs alive and biometrically available in Pakistan?",
    disputedLabel: "Is any property title disputed, or any heir an unrepresented minor?",
    routeDecision: "Route decision:",
    nadraRoute: "NADRA Succession Facilitation Unit (clean case)",
    civilRoute: "Civil court partition suit (disputed / minor heir)",
  },
  ur: {
    title: "نادرا سکسیشن بمقابلہ عدالتی تقسیم کا مقدمہ",
    intro:
      "دو سوالات راستہ طے کرتے ہیں: کیا تمام ورثاء زندہ اور بائیومیٹرک کے لیے دستیاب ہیں، اور کیا کوئی ملکیت متنازع ہے یا کوئی وارث بلا نمائندگی نابالغ ہے؟",
    heirsAvailableLabel: "کیا تمام قانونی ورثاء زندہ اور پاکستان میں بائیومیٹرک کے لیے دستیاب ہیں؟",
    disputedLabel: "کیا کوئی ملکیت متنازع ہے، یا کوئی وارث بلا نمائندگی نابالغ ہے؟",
    routeDecision: "راستے کا فیصلہ:",
    nadraRoute: "نادرا سکسیشن فسیلیٹیشن یونٹ (واضح کیس)",
    civilRoute: "عدالتی تقسیم کا مقدمہ (متنازع / نابالغ وارث)",
  },
  roman: {
    title: "NADRA Succession bamuqabla Civil Court Partition",
    intro:
      "Do sawalat raasta tay karte hain: kya tamam warasa zinda aur biometric ke liye dastyab hain, aur kya koi milkiyat mutanaza hai ya koi waris bila numaindagi nabaligh hai?",
    heirsAvailableLabel: "Kya tamam qanooni warasa zinda aur Pakistan mein biometric ke liye dastyab hain?",
    disputedLabel: "Kya koi milkiyat mutanaza hai, ya koi waris bila numaindagi nabaligh hai?",
    routeDecision: "Raaste ka faisla:",
    nadraRoute: "NADRA Succession Facilitation Unit (wazeh case)",
    civilRoute: "Adalati taqseem ka muqadma (mutanaza / nabaligh waris)",
  },
} satisfies Record<Lang, Record<string, string>>;

const emptyForm: SuccessionInput = {
  deceasedName: "",
  allHeirsAliveAndBiometric: "yes",
  disputedTitleOrMinorHeir: "no",
  heirs: "",
  city: "",
};

function SuccessionPage() {
  const [lang, setLang] = usePersistedLang();
  const topic = TOPICS.find((tp) => tp.id === "succession")!;
  const dir = dirFor(lang);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = usePersistedState<SuccessionInput>(
    "legalpak:help-desk-succession",
    emptyForm,
  );

  function set<K extends keyof SuccessionInput>(k: K, v: SuccessionInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const route = successionRoute(form);
  const out = useMemo(
    () => (route === "nadra" ? generateNadraSfuChecklist(form) : generateCivilPartitionBrief(form)),
    [form, route],
  );

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
              <Field label={t(lang, UI.city)}>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label={COPY[lang].heirsAvailableLabel}>
                <Select
                  value={form.allHeirsAliveAndBiometric}
                  onChange={(e) =>
                    set(
                      "allHeirsAliveAndBiometric",
                      e.target.value as SuccessionInput["allHeirsAliveAndBiometric"],
                    )
                  }
                >
                  <option value="yes">{t(lang, UI.yes)}</option>
                  <option value="no">{t(lang, UI.no)}</option>
                </Select>
              </Field>
              <Field label={COPY[lang].disputedLabel}>
                <Select
                  value={form.disputedTitleOrMinorHeir}
                  onChange={(e) =>
                    set(
                      "disputedTitleOrMinorHeir",
                      e.target.value as SuccessionInput["disputedTitleOrMinorHeir"],
                    )
                  }
                >
                  <option value="no">{t(lang, UI.no)}</option>
                  <option value="yes">{t(lang, UI.yes)}</option>
                </Select>
              </Field>
            </div>

            <div className="mt-4 rounded-[var(--radius-md)] border border-border bg-bg p-3 text-xs text-muted">
              {COPY[lang].routeDecision}{" "}
              <span className="font-medium text-fg">
                {route === "nadra" ? COPY[lang].nadraRoute : COPY[lang].civilRoute}
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
            topicId="succession"
            escalationCity={form.city || undefined}
            escalationSpecialty="Succession / Partition"
            documentSlot={
              <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                  <Field label="Deceased's name">
                    <Input
                      value={form.deceasedName}
                      onChange={(e) => set("deceasedName", e.target.value)}
                    />
                  </Field>
                  <Field label="Heirs (names and relationship)">
                    <Textarea value={form.heirs} onChange={(e) => set("heirs", e.target.value)} />
                  </Field>
                </section>
                <div className="lg:sticky lg:top-20">
                  <PackOutput
                    text={out}
                    filename={route === "nadra" ? "nadra-sfu-checklist.txt" : "civil-partition-brief.txt"}
                  />
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
