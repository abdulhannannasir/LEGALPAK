import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PackOutput } from "@/components/pack-output";
import { SplitScreen } from "@/components/split-screen";
import { usePersistedState } from "@/lib/use-persisted-state";
import {
  CITIZEN_DOCUMENT_TYPES,
  generate489FNotice,
  generateAffidavit,
  generateConsumerComplaint,
  generateTenancyDeed,
  type CitizenDocumentId,
} from "@/lib/citizen/documents";

export const Route = createFileRoute("/citizen/documents")({
  component: CitizenDocumentsPage,
  head: () => ({
    meta: [
      { title: "Citizen documents — LegalPak" },
      {
        name: "description",
        content:
          "Free plain-language drafts for common situations in Pakistan — affidavits, tenancy deeds, a 489-F cheque-dishonour notice, and consumer complaints.",
      },
    ],
  }),
});

type Draft = Record<string, string>;
const empty: Draft = {};

const FIELDS_BY_TYPE: Record<
  CitizenDocumentId,
  { key: string; label: string; type?: string; area?: boolean }[]
> = {
  affidavit: [
    { key: "deponentName", label: "Your full name" },
    { key: "cnic", label: "CNIC" },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "statement", label: "What are you affirming?", area: true },
  ],
  tenancy_deed: [
    { key: "landlordName", label: "Landlord's name" },
    { key: "tenantName", label: "Tenant's name" },
    { key: "propertyAddress", label: "Property address" },
    { key: "city", label: "City" },
    { key: "monthlyRent", label: "Monthly rent (PKR)", type: "number" },
    { key: "securityDeposit", label: "Security deposit (PKR)", type: "number" },
    { key: "leaseStartDate", label: "Lease start date", type: "date" },
    { key: "leaseDurationMonths", label: "Duration (months)", type: "number" },
  ],
  "489f_notice": [
    { key: "senderName", label: "Your name" },
    { key: "senderAddress", label: "Your address" },
    { key: "recipientName", label: "Cheque issuer's name" },
    { key: "recipientAddress", label: "Cheque issuer's address" },
    { key: "chequeNumber", label: "Cheque number" },
    { key: "chequeAmount", label: "Cheque amount (PKR)", type: "number" },
    { key: "bankName", label: "Bank name" },
    { key: "chequeDate", label: "Cheque date", type: "date" },
    { key: "dishonorReason", label: "Reason given by bank" },
    { key: "city", label: "City" },
  ],
  consumer_complaint: [
    { key: "complainantName", label: "Your name" },
    { key: "complainantAddress", label: "Your address" },
    { key: "respondentName", label: "Business / seller name" },
    { key: "respondentAddress", label: "Business address" },
    { key: "productOrService", label: "Product / service" },
    { key: "purchaseDate", label: "Purchase date", type: "date" },
    { key: "amountPaid", label: "Amount paid (PKR)", type: "number" },
    { key: "issueDescription", label: "What went wrong?", area: true },
    { key: "reliefSought", label: "What outcome do you want?", area: true },
    { key: "city", label: "City" },
  ],
};

function generate(id: CitizenDocumentId, draft: Draft): string {
  const num = (k: string) => Number(draft[k] || 0);
  if (id === "affidavit") return generateAffidavit(draft as never);
  if (id === "tenancy_deed")
    return generateTenancyDeed({
      ...draft,
      monthlyRent: num("monthlyRent"),
      securityDeposit: num("securityDeposit"),
      leaseDurationMonths: num("leaseDurationMonths"),
    } as never);
  if (id === "489f_notice")
    return generate489FNotice({ ...draft, chequeAmount: num("chequeAmount") } as never);
  return generateConsumerComplaint({ ...draft, amountPaid: num("amountPaid") } as never);
}

function CitizenDocumentsPage() {
  const [typeId, setTypeId] = usePersistedState<CitizenDocumentId>(
    "legalpak:citizen-doc-type",
    "affidavit",
  );
  const [drafts, setDrafts] = usePersistedState<Record<string, Draft>>(
    "legalpak:citizen-documents",
    {},
  );
  const draft = drafts[typeId] ?? empty;
  const fields = FIELDS_BY_TYPE[typeId];
  const hasAnyValue = Object.values(draft).some((v) => v.trim() !== "");
  const out = useMemo(
    () => (hasAnyValue ? generate(typeId, draft) : ""),
    [typeId, draft, hasAnyValue],
  );

  function set(key: string, value: string) {
    setDrafts((d) => ({ ...d, [typeId]: { ...(d[typeId] ?? empty), [key]: value } }));
  }
  function reset() {
    setDrafts((d) => ({ ...d, [typeId]: empty }));
    toast.success("Cleared — draft removed from this browser");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Citizen legal help
        </p>
        <h1 className="font-display text-3xl">Draft a document</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Plain-language drafts for common situations. These are starting points, not filed
          documents — an affidavit needs a notary/oath commissioner, and a legal notice should go by
          registered post. For anything contested, use the{" "}
          <a className="text-accent underline" href="/citizen/lawyers">
            lawyer directory
          </a>
          .
        </p>
      </div>

      <SplitScreen
        form={
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <Field label="Document type">
              <Select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value as CitizenDocumentId)}
              >
                {CITIZEN_DOCUMENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <Field key={f.key} label={f.label} className={f.area ? "sm:col-span-2" : undefined}>
                  {f.area ? (
                    <Textarea
                      value={draft[f.key] ?? ""}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      type={f.type ?? "text"}
                      value={draft[f.key] ?? ""}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                  )}
                </Field>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={reset}>
                Clear draft
              </Button>
            </div>
          </section>
        }
        preview={
          out ? (
            <PackOutput text={out} filename={`${typeId}.txt`} />
          ) : (
            <section className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
              Fill in the fields to see the draft appear here.
            </section>
          )
        }
      />
    </div>
  );
}
