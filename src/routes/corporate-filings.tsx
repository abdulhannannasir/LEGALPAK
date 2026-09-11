import { createFileRoute } from "@tanstack/react-router";
import { CompanyProfileTools } from "@/components/incorporation/CompanyProfileTools";
import { Form21Panel } from "@/components/incorporation/Form21Panel";
import { Form45Panel } from "@/components/incorporation/Form45Panel";
import { usePersistedState } from "@/lib/use-persisted-state";
import type { Form21Input, Form45Input } from "@/lib/incorporation/corporate-filings";
import { emptyBeneficialOwner } from "@/lib/incorporation/corporate-filings";
import { createId } from "@/lib/legalpak/id";

export const Route = createFileRoute("/corporate-filings")({
  component: CorporateFilingsPage,
  head: () => ({
    meta: [
      { title: "Form 21 & Form 45 — LegalPak" },
      {
        name: "description",
        content:
          "Generate SECP Form 21 (change of registered office) and Form 45 (Ultimate Beneficial Ownership declaration under Section 123A) for an existing Pakistani company.",
      },
    ],
  }),
});

const emptyForm21: Form21Input = {
  companyName: "",
  cuin: "",
  oldAddress: "",
  newAddress: "",
  province: "",
  boardResolutionDate: "",
  effectiveDate: "",
};

const emptyForm45: Form45Input = {
  companyName: "",
  cuin: "",
  ntn: "",
  owners: [],
};

function CorporateFilingsPage() {
  const [tab, setTab] = usePersistedState<"form21" | "form45">("legalpak:corporate-filings-tab", "form21");
  const [form21, setForm21] = usePersistedState<Form21Input>("legalpak:corporate-filings-form21", emptyForm21);
  const [form45, setForm45] = usePersistedState<Form45Input>("legalpak:corporate-filings-form45", emptyForm45);

  function importProfile(profile: { name: string; cuin: string; ntn: string; registeredAddress: string }) {
    setForm21((f) => ({ ...f, companyName: profile.name, cuin: profile.cuin, oldAddress: profile.registeredAddress }));
    setForm45((f) => ({
      ...f,
      companyName: profile.name,
      cuin: profile.cuin,
      ntn: profile.ntn,
      owners: f.owners.length ? f.owners : [emptyBeneficialOwner(createId("ubo"))],
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Corporate Suite</p>
        <h1 className="font-display text-3xl">Form 21 & Form 45</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Post-incorporation filings for an existing company — change of registered office, and the
          statutory beneficial-ownership declaration.
        </p>
      </div>

      <CompanyProfileTools mode="import" onImport={importProfile} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("form21")}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
            tab === "form21" ? "border-accent bg-surface text-accent" : "border-border bg-bg text-muted"
          }`}
        >
          Form 21 — Registered office
        </button>
        <button
          type="button"
          onClick={() => setTab("form45")}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
            tab === "form45" ? "border-accent bg-surface text-accent" : "border-border bg-bg text-muted"
          }`}
        >
          Form 45 — UBO declaration
        </button>
      </div>

      {tab === "form21" ? (
        <Form21Panel form={form21} onChange={setForm21} />
      ) : (
        <Form45Panel form={form45} onChange={setForm45} />
      )}
    </div>
  );
}
