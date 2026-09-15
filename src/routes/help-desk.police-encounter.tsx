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
  OFFENSE_LOOKUP,
  POLICE_ENCOUNTER_STATUSES,
  POLICE_RIGHTS_NOTES,
  findOffense,
  generatePoliceEncounterBrief,
  type PoliceEncounterInput,
} from "@/lib/citizen/help-desk";

export const Route = createFileRoute("/help-desk/police-encounter")({
  component: PoliceEncounterPage,
  head: () => ({
    meta: [
      { title: "Police Stop & Bail Rights — Help Desk — LegalPak" },
      {
        name: "description",
        content:
          "Your rights during a police stop in Pakistan — search and checkpoint rights, FIR vs. non-cognizable offences, and pre-arrest bail under Section 498 CrPC.",
      },
    ],
  }),
});

const COPY = {
  en: {
    title: "Police Stop, Remand & Bailable Rights",
    intro:
      "A quick, plain-language guide — not a substitute for an advocate once a case is actually registered against you.",
    statusLabel: "Where are things right now?",
    offenseLabel: "Offense involved (as you understand it)",
  },
  ur: {
    title: "پولیس کی روک تھام، ریمانڈ اور ضمانت کے حقوق",
    intro:
      "ایک فوری، آسان زبان میں رہنما — اگر آپ کے خلاف واقعی مقدمہ درج ہو جائے تو یہ وکیل کا متبادل نہیں۔",
    statusLabel: "اس وقت معاملہ کس مرحلے پر ہے؟",
    offenseLabel: "جرم کی نوعیت (جیسا آپ سمجھتے ہیں)",
  },
  roman: {
    title: "Police Stop, Remand aur Bailable Rights",
    intro:
      "Aik fori, asaan zaban mein rehnuma — agar aap ke khilaf waqai muqadma darj ho jaye to yeh wakeel ka mutabadil nahi.",
    statusLabel: "Is waqt mamla kis marhale par hai?",
    offenseLabel: "Jurm ki nauiyat (jaisa aap samajhte hain)",
  },
} satisfies Record<Lang, Record<string, string>>;

const emptyForm: PoliceEncounterInput = {
  personName: "",
  city: "",
  offense: OFFENSE_LOOKUP[0].offense,
  currentStatus: "Stopped / questioned only",
  incidentDescription: "",
};

function PoliceEncounterPage() {
  const [lang, setLang] = usePersistedLang();
  const topic = TOPICS.find((tp) => tp.id === "police-encounter")!;
  const dir = dirFor(lang);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = usePersistedState<PoliceEncounterInput>(
    "legalpak:help-desk-police",
    emptyForm,
  );

  function set<K extends keyof PoliceEncounterInput>(k: K, v: PoliceEncounterInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const entry = findOffense(form.offense);
  const out = useMemo(() => generatePoliceEncounterBrief(form), [form]);

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
              <Field label={COPY[lang].statusLabel}>
                <Select
                  value={form.currentStatus}
                  onChange={(e) =>
                    set("currentStatus", e.target.value as PoliceEncounterInput["currentStatus"])
                  }
                >
                  {POLICE_ENCOUNTER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={COPY[lang].offenseLabel}>
                <Select value={form.offense} onChange={(e) => set("offense", e.target.value)}>
                  {OFFENSE_LOOKUP.map((o) => (
                    <option key={o.offense} value={o.offense}>
                      {o.offense}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t(lang, UI.city)}>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
            </div>
            {entry && (
              <div
                className={`mt-4 rounded-[var(--radius-md)] border p-4 text-sm ${
                  entry.cognizable ? "border-border bg-bg" : "border-danger bg-flag-high text-danger"
                }`}
              >
                <p className="font-medium">
                  {entry.cognizable
                    ? "Cognizable (Section 154 CrPC) — police can register an FIR directly."
                    : "Non-cognizable (Section 155 CrPC) — needs a Magistrate's order first."}
                </p>
                <p className="mt-1 text-xs">{entry.note}</p>
              </div>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <h3 className="text-sm font-medium">Search & checkpoint rights</h3>
              <p className="mt-1.5 text-xs text-muted">{POLICE_RIGHTS_NOTES.checkpoint}</p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <h3 className="text-sm font-medium">FIR vs. non-cognizable</h3>
              <p className="mt-1.5 text-xs text-muted">{POLICE_RIGHTS_NOTES.firVsComplaint}</p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <h3 className="text-sm font-medium">Pre-arrest bail</h3>
              <p className="mt-1.5 text-xs text-muted">{POLICE_RIGHTS_NOTES.preArrestBail}</p>
            </div>
          </section>
          <p className="text-xs text-muted">
            This offense list is representative, not exhaustive — always confirm classification
            against the First Schedule of the Code of Criminal Procedure, 1898.
          </p>

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
            topicId="police-encounter"
            escalationCity={form.city || undefined}
            escalationSpecialty="Criminal"
            documentSlot={
              <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                  <Field label="Your name">
                    <Input
                      value={form.personName}
                      onChange={(e) => set("personName", e.target.value)}
                    />
                  </Field>
                  <Field label="What happened?">
                    <Textarea
                      value={form.incidentDescription}
                      onChange={(e) => set("incidentDescription", e.target.value)}
                      placeholder="Date, time, location, and what officers said/did"
                    />
                  </Field>
                </section>
                <div className="lg:sticky lg:top-20">
                  <PackOutput text={out} filename="police-encounter-brief.txt" />
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
