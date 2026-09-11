import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { EmergencyRibbon } from "@/components/citizen/emergency-ribbon";
import { AdvocateEscalationCard } from "@/components/citizen/advocate-escalation-card";
import { Field, Input, Select } from "@/components/ui/field";
import { PackOutput } from "@/components/pack-output";
import { SplitScreen } from "@/components/split-screen";
import { usePersistedState } from "@/lib/use-persisted-state";
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
  const [form, setForm] = usePersistedState<UtilityDisputeInput>(
    "legalpak:help-desk-utility",
    emptyForm,
  );

  function set<K extends keyof UtilityDisputeInput>(k: K, v: UtilityDisputeInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const flagged = isLikelyDetectionBill(form);
  const hasAnyValue = form.referenceNumber.trim() !== "" || form.disputedUnitsBilled > 0;
  const out = useMemo(
    () => (hasAnyValue ? generateUtilityRepresentationLetter(form) : ""),
    [form, hasAnyValue],
  );

  return (
    <div className="space-y-6">
      <EmergencyRibbon />
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Help Desk / بجلی گیس اوور بلنگ
        </p>
        <h1 className="font-display text-3xl">Utility Overbilling & Detection Bills</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          For LESCO, K-Electric, IESCO, MEPCO or SNGPL detection/tampering bills that look
          disproportionate to your actual usage.
        </p>
      </div>

      <SplitScreen
        form={
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Utility provider">
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
              <Field label="Reference / consumer number">
                <Input
                  value={form.referenceNumber}
                  onChange={(e) => set("referenceNumber", e.target.value)}
                />
              </Field>
              <Field label="Your name">
                <Input
                  value={form.consumerName}
                  onChange={(e) => set("consumerName", e.target.value)}
                />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <Input
                  value={form.consumerAddress}
                  onChange={(e) => set("consumerAddress", e.target.value)}
                />
              </Field>
              <Field label="Average monthly units (normal bill)">
                <Input
                  type="number"
                  value={form.averageMonthlyUnits || ""}
                  onChange={(e) => set("averageMonthlyUnits", Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="Disputed units billed">
                <Input
                  type="number"
                  value={form.disputedUnitsBilled || ""}
                  onChange={(e) => set("disputedUnitsBilled", Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="Detection surcharge (PKR)" className="sm:col-span-2">
                <Input
                  type="number"
                  value={form.detectionSurcharge || ""}
                  onChange={(e) => set("detectionSurcharge", Number(e.target.value) || 0)}
                />
              </Field>
            </div>

            {hasAnyValue && (
              <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-border bg-bg p-3 text-xs">
                <AlertTriangle
                  className={`mt-0.5 size-4 shrink-0 ${flagged ? "text-danger" : "text-muted"}`}
                  strokeWidth={1.75}
                />
                <span className={flagged ? "text-danger" : "text-muted"}>
                  {flagged
                    ? "This looks like an unauthorized detection/tampering claim — Section 26(6) of the Electricity Act, 1910 requires a proper inspection report before such a charge is valid."
                    : "This doesn't clearly look like a detection bill, but the letter below still requests re-verification of the reading."}
                </span>
              </div>
            )}
          </section>
        }
        preview={
          out ? (
            <PackOutput text={out} filename="utility-representation-letter.txt" />
          ) : (
            <section className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
              Fill in the reference number and disputed units to generate your representation
              letter.
            </section>
          )
        }
      />

      <AdvocateEscalationCard city={form.city || undefined} specialty="Utility / Consumer" />
    </div>
  );
}
