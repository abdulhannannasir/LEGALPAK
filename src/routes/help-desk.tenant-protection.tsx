import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { EmergencyRibbon } from "@/components/citizen/emergency-ribbon";
import { AdvocateEscalationCard } from "@/components/citizen/advocate-escalation-card";
import { Field, Input, Select } from "@/components/ui/field";
import { PackOutput } from "@/components/pack-output";
import { SplitScreen } from "@/components/split-screen";
import { usePersistedState } from "@/lib/use-persisted-state";
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
  const [form, setForm] = usePersistedState<TenantProtectionInput>(
    "legalpak:help-desk-tenant",
    emptyForm,
  );

  function set<K extends keyof TenantProtectionInput>(k: K, v: TenantProtectionInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const hasAnyValue = form.tenantName.trim() !== "" || form.landlordReason.trim() !== "";
  const out = useMemo(
    () => (hasAnyValue ? generateUrgentObjectionNotice(form) : ""),
    [form, hasAnyValue],
  );

  return (
    <div className="space-y-6">
      <EmergencyRibbon />
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Help Desk / کرایہ داری و بے دخلی
        </p>
        <h1 className="font-display text-3xl">Residential Tenant Eviction Shield</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {tenancyGroundsExplainer(form)}
        </p>
      </div>

      <SplitScreen
        form={
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Province / territory">
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
              <Field label="City">
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
              <Field label="Your name (tenant)">
                <Input value={form.tenantName} onChange={(e) => set("tenantName", e.target.value)} />
              </Field>
              <Field label="Landlord's name">
                <Input
                  value={form.landlordName}
                  onChange={(e) => set("landlordName", e.target.value)}
                />
              </Field>
              <Field label="Property address" className="sm:col-span-2">
                <Input
                  value={form.propertyAddress}
                  onChange={(e) => set("propertyAddress", e.target.value)}
                />
              </Field>
              <Field label="Reason cited by landlord for eviction" className="sm:col-span-2">
                <Input
                  value={form.landlordReason}
                  onChange={(e) => set("landlordReason", e.target.value)}
                />
              </Field>
            </div>
          </section>
        }
        preview={
          out ? (
            <PackOutput text={out} filename="urgent-objection-notice.txt" />
          ) : (
            <section className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
              Fill in your name and the landlord's stated reason to generate the objection notice.
            </section>
          )
        }
      />

      <AdvocateEscalationCard city={form.city || undefined} specialty="Tenancy / Property" />
    </div>
  );
}
