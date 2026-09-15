import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  DEBT_BASES,
  generateMoneyRecoveryNotice,
  moneyRecoverySuitRoute,
  type MoneyRecoveryInput,
} from "@/lib/citizen/help-desk";

export const Route = createFileRoute("/help-desk/recover-money")({
  component: RecoverMoneyPage,
  head: () => ({
    meta: [
      { title: "Recover Money — Help Desk — LegalPak" },
      {
        name: "description",
        content:
          "Owed money on a loan, invoice, or agreement in Pakistan? Generate a legal demand notice and see whether a summary or regular civil suit fits your case.",
      },
    ],
  }),
});

const COPY = {
  en: {
    title: "Recover Money Owed to You",
    intro:
      "Unpaid loans, invoices, or agreements — a formal demand often resolves it before court is ever needed.",
    debtBasisLabel: "How did this debt arise?",
    amountLabel: "Amount owed (PKR)",
    dueDateLabel: "Due date",
    suitRoute: "Likely suit route if unpaid:",
    summarySuit: "Summary suit (Order XXXVII CPC) — faster, since this is based on a written agreement",
    regularSuit: "Regular civil recovery suit",
  },
  ur: {
    title: "اپنی واجب الادا رقم واپس لیں",
    intro:
      "غیر ادا شدہ قرض، انوائس، یا معاہدے — ایک باضابطہ مطالبہ اکثر عدالت جانے سے پہلے ہی معاملہ حل کر دیتا ہے۔",
    debtBasisLabel: "یہ قرض کیسے وجود میں آیا؟",
    amountLabel: "واجب الادا رقم (روپے)",
    dueDateLabel: "ادائیگی کی تاریخ",
    suitRoute: "عدم ادائیگی کی صورت میں ممکنہ مقدمے کا راستہ:",
    summarySuit: "سمری سوٹ (آرڈر 37 سی پی سی) — تیز تر، کیونکہ یہ تحریری معاہدے پر مبنی ہے",
    regularSuit: "عام دیوانی وصولی کا مقدمہ",
  },
  roman: {
    title: "Apni wajib-ul-ada raqam wapas lein",
    intro:
      "Ghair ada shuda qarz, invoice, ya muahiday — aik bazabta mutaliba aksar adalat jane se pehle hi mamla hal kar deta hai.",
    debtBasisLabel: "Yeh qarz kaise wajood mein aaya?",
    amountLabel: "Wajib-ul-ada raqam (PKR)",
    dueDateLabel: "Adaigi ki tareekh",
    suitRoute: "Adam adaigi ki surat mein mumkina muqadme ka raasta:",
    summarySuit: "Summary suit (Order XXXVII CPC) — tez tar, kyunkeh yeh tehreeri muahide par mabni hai",
    regularSuit: "Aam civil wasooli ka muqadma",
  },
} satisfies Record<Lang, Record<string, string>>;

const emptyForm: MoneyRecoveryInput = {
  claimantName: "",
  claimantAddress: "",
  debtorName: "",
  debtorAddress: "",
  basisOfDebt: "Loan / borrowed money",
  amountOwed: 0,
  dueDate: "",
  city: "",
};

function RecoverMoneyPage() {
  const [lang, setLang] = usePersistedLang();
  const topic = TOPICS.find((tp) => tp.id === "recover-money")!;
  const dir = dirFor(lang);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = usePersistedState<MoneyRecoveryInput>(
    "legalpak:help-desk-recover-money",
    emptyForm,
  );

  function set<K extends keyof MoneyRecoveryInput>(k: K, v: MoneyRecoveryInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const route = moneyRecoverySuitRoute(form);
  const out = useMemo(() => generateMoneyRecoveryNotice(form), [form]);

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
              <Field label={COPY[lang].debtBasisLabel} className="sm:col-span-2">
                <Select
                  value={form.basisOfDebt}
                  onChange={(e) => set("basisOfDebt", e.target.value as MoneyRecoveryInput["basisOfDebt"])}
                >
                  {DEBT_BASES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={COPY[lang].amountLabel}>
                <Input
                  type="number"
                  value={form.amountOwed || ""}
                  onChange={(e) => set("amountOwed", Number(e.target.value) || 0)}
                />
              </Field>
              <Field label={COPY[lang].dueDateLabel}>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set("dueDate", e.target.value)}
                />
              </Field>
              <Field label={t(lang, UI.city)}>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
            </div>
            <div className="mt-4 rounded-[var(--radius-md)] border border-border bg-bg p-3 text-xs text-muted">
              {COPY[lang].suitRoute}{" "}
              <span className="font-medium text-fg">
                {route === "summary" ? COPY[lang].summarySuit : COPY[lang].regularSuit}
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
            topicId="recover-money"
            escalationCity={form.city || undefined}
            escalationSpecialty="Recovery of Money"
            documentSlot={
              <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                  <Field label="Your name">
                    <Input
                      value={form.claimantName}
                      onChange={(e) => set("claimantName", e.target.value)}
                    />
                  </Field>
                  <Field label="Your address">
                    <Input
                      value={form.claimantAddress}
                      onChange={(e) => set("claimantAddress", e.target.value)}
                    />
                  </Field>
                  <Field label="Debtor's name">
                    <Input
                      value={form.debtorName}
                      onChange={(e) => set("debtorName", e.target.value)}
                    />
                  </Field>
                  <Field label="Debtor's address">
                    <Input
                      value={form.debtorAddress}
                      onChange={(e) => set("debtorAddress", e.target.value)}
                    />
                  </Field>
                </section>
                <div className="lg:sticky lg:top-20">
                  <PackOutput text={out} filename="money-recovery-notice.txt" />
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
