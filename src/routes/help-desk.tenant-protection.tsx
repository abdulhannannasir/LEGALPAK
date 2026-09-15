import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EmergencyRibbon } from "@/components/citizen/emergency-ribbon";
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
  TENANCY_PROVINCES,
  generateUrgentObjectionNotice,
  tenancyGroundsExplainer,
  type TenantProtectionInput,
} from "@/lib/citizen/help-desk";

export const Route = createFileRoute("/help-desk/tenant-protection")({
  component: TenantProtectionPage,
  head: () => ({
    meta: [
      { title: "Tenancy & Eviction — Help Desk — LegalPak" },
      {
        name: "description",
        content:
          "Know your eviction rights as a tenant in Pakistan and generate an urgent objection notice against an illegal lockout or utility disconnection.",
      },
    ],
  }),
});

const COPY = {
  en: {
    title: "Residential Tenant Eviction Shield",
    agreementLabel: "Written agreement exists?",
    rentStatusLabel: "Rent paid status",
    receiptsOption: "Receipts available",
    cashOption: "Paid in cash, no receipts",
    landlordReasonLabel: "Reason cited by landlord for eviction",
  },
  ur: {
    title: "رہائشی کرایہ دار کی بے دخلی سے تحفظ",
    agreementLabel: "تحریری معاہدہ موجود ہے؟",
    rentStatusLabel: "کرایہ کی ادائیگی کی صورتحال",
    receiptsOption: "رسیدیں دستیاب ہیں",
    cashOption: "نقد ادا کیا، رسیدیں نہیں",
    landlordReasonLabel: "بے دخلی کے لیے مکان مالک کی بیان کردہ وجہ",
  },
  roman: {
    title: "Rihaishi Kirayadar ki Bedakhli se Tahaffuz",
    agreementLabel: "Tehreeri muahida mojood hai?",
    rentStatusLabel: "Kiraya adaigi ki soorat-e-haal",
    receiptsOption: "Raseedain dastyab hain",
    cashOption: "Naqad ada kiya, raseedain nahi",
    landlordReasonLabel: "Bedakhli ke liye makan malik ki bayan karda wajah",
  },
} satisfies Record<Lang, Record<string, string>>;

const emptyForm: TenantProtectionInput = {
  province: "Punjab",
  hasWrittenAgreement: "yes",
  rentPaidStatus: "receipts",
  landlordReason: "",
  tenantName: "",
  landlordName: "",
  propertyAddress: "",
  city: "",
};

function TenantProtectionPage() {
  const [lang, setLang] = usePersistedLang();
  const topic = TOPICS.find((tp) => tp.id === "tenant-protection")!;
  const dir = dirFor(lang);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = usePersistedState<TenantProtectionInput>(
    "legalpak:help-desk-tenant",
    emptyForm,
  );

  function set<K extends keyof TenantProtectionInput>(k: K, v: TenantProtectionInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const out = useMemo(() => generateUrgentObjectionNotice(form), [form]);

  return (
    <div className="space-y-6" dir={dir}>
      <EmergencyRibbon lang={lang} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            {t(lang, UI.eyebrow)} / {t(lang, topic.title)}
          </p>
          <h1 className="font-display text-3xl">Residential Tenant Eviction Shield</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{tenancyGroundsExplainer(form)}</p>
        </div>
        <LanguageSwitcher lang={lang} onChange={setLang} />
      </div>

      <StepProgress step={step} labels={[t(lang, UI.step1Title), t(lang, UI.step2Title)]} />

      {step === 1 && (
        <>
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t(lang, UI.province)}>
                <Select
                  value={form.province}
                  onChange={(e) => set("province", e.target.value as TenantProtectionInput["province"])}
                >
                  {TENANCY_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t(lang, UI.city)}>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label="Written agreement exists?">
                <Select
                  value={form.hasWrittenAgreement}
                  onChange={(e) =>
                    set("hasWrittenAgreement", e.target.value as TenantProtectionInput["hasWrittenAgreement"])
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
              </Field>
              <Field label="Rent paid status">
                <Select
                  value={form.rentPaidStatus}
                  onChange={(e) =>
                    set("rentPaidStatus", e.target.value as TenantProtectionInput["rentPaidStatus"])
                  }
                >
                  <option value="receipts">Receipts available</option>
                  <option value="cash">Paid in cash, no receipts</option>
                </Select>
              </Field>
              <Field label="Reason cited by landlord for eviction" className="sm:col-span-2">
                <Input
                  value={form.landlordReason}
                  onChange={(e) => set("landlordReason", e.target.value)}
                />
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
            topicId="tenant-protection"
            escalationCity={form.city || undefined}
            escalationSpecialty="Tenancy / Property"
            documentSlot={
              <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                  <Field label="Your name (tenant)">
                    <Input
                      value={form.tenantName}
                      onChange={(e) => set("tenantName", e.target.value)}
                    />
                  </Field>
                  <Field label="Landlord's name">
                    <Input
                      value={form.landlordName}
                      onChange={(e) => set("landlordName", e.target.value)}
                    />
                  </Field>
                  <Field label="Property address">
                    <Input
                      value={form.propertyAddress}
                      onChange={(e) => set("propertyAddress", e.target.value)}
                    />
                  </Field>
                </section>
                <div className="lg:sticky lg:top-20">
                  <PackOutput text={out} filename="urgent-objection-notice.txt" />
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
