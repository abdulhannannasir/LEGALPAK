import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { EmergencyRibbon } from "@/components/citizen/emergency-ribbon";
import { AdvocateEscalationCard } from "@/components/citizen/advocate-escalation-card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PackOutput } from "@/components/pack-output";
import { SplitScreen } from "@/components/split-screen";
import { usePersistedState } from "@/lib/use-persisted-state";
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
  const [form, setForm] = usePersistedState<CyberReportInput>(
    "legalpak:help-desk-cyber",
    emptyForm,
  );

  function set<K extends keyof CyberReportInput>(k: K, v: CyberReportInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const hasAnyValue = form.incidentDescription.trim() !== "" || form.culpritIdentifier.trim() !== "";
  const out = useMemo(
    () => (hasAnyValue ? generateCyberComplaintPacket(form) : ""),
    [form, hasAnyValue],
  );

  return (
    <div className="space-y-6">
      <EmergencyRibbon />
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Help Desk / سائبر ہراسانی و فراڈ
        </p>
        <h1 className="font-display text-3xl">Cyber Harassment, Blackmail & Online Scams</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Do not pay demanded money and do not delete evidence — describe the incident below to
          generate a complaint packet for the National Cyber Crime Investigation Agency
          (NCCIA)/FIA Cybercrime Wing.
        </p>
      </div>

      <SplitScreen
        form={
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nature of offense">
                <Select
                  value={form.offenseType}
                  onChange={(e) => set("offenseType", e.target.value as CyberReportInput["offenseType"])}
                >
                  {CYBER_OFFENSE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Platform">
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
              <Field label="Culprit identifier" className="sm:col-span-2">
                <Input
                  placeholder="Phone number, profile link, or account title"
                  value={form.culpritIdentifier}
                  onChange={(e) => set("culpritIdentifier", e.target.value)}
                />
              </Field>
              <Field label="Your name">
                <Input value={form.victimName} onChange={(e) => set("victimName", e.target.value)} />
              </Field>
              <Field label="Your CNIC">
                <Input value={form.victimCnic} onChange={(e) => set("victimCnic", e.target.value)} />
              </Field>
              <Field label="Your phone">
                <Input value={form.victimPhone} onChange={(e) => set("victimPhone", e.target.value)} />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label="Your address" className="sm:col-span-2">
                <Input
                  value={form.victimAddress}
                  onChange={(e) => set("victimAddress", e.target.value)}
                />
              </Field>
              <Field label="What happened?" className="sm:col-span-2">
                <Textarea
                  value={form.incidentDescription}
                  onChange={(e) => set("incidentDescription", e.target.value)}
                />
              </Field>
            </div>

            <p className="mt-4 text-xs text-muted">
              Likely applicable law: <span className="font-medium">{cyberApplicableLaw(form.offenseType)}</span>
            </p>
          </section>
        }
        preview={
          out ? (
            <PackOutput text={out} filename="cyber-complaint-packet.txt" />
          ) : (
            <section className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
              Describe the incident and the culprit identifier to generate your complaint packet.
            </section>
          )
        }
      />

      <AdvocateEscalationCard city={form.city || undefined} specialty="Cyber Crime" />
    </div>
  );
}
