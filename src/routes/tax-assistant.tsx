import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Flags } from "@/components/flags";
import { recommendFilings, type IncomeSource, type TaxpayerKind } from "@/lib/tax/tax-assistant";

export const Route = createFileRoute("/tax-assistant")({
  component: TaxAssistantPage,
  head: () => ({
    meta: [
      { title: "Tax Assistant — LegalPak" },
      {
        name: "description",
        content:
          "FBR income tax filing guidance for Pakistan — a deterministic decision tree that tells you exactly what needs filing, not a guess.",
      },
    ],
  }),
});

const INCOME_SOURCES: { id: IncomeSource; label: string }[] = [
  { id: "salary", label: "Salary" },
  { id: "business", label: "Business" },
  { id: "property", label: "Rent / property" },
  { id: "investments", label: "Investments" },
  { id: "freelancing", label: "Freelancing" },
  { id: "foreign_clients", label: "Foreign clients" },
  { id: "agriculture", label: "Agriculture" },
  { id: "capital_gains", label: "Capital gains" },
  { id: "other", label: "Other" },
];

function TaxAssistantPage() {
  const [taxpayerKind, setTaxpayerKind] = useState<TaxpayerKind>("individual");
  const [hasNtn, setHasNtn] = useState<boolean | null>(null);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [salesTaxRegistered, setSalesTaxRegistered] = useState<boolean | null>(null);
  const [show, setShow] = useState(false);

  const recommendation = useMemo(
    () => recommendFilings({ taxpayerKind, hasNtn, incomeSources, salesTaxRegistered }),
    [taxpayerKind, hasNtn, incomeSources, salesTaxRegistered],
  );

  function toggleSource(id: IncomeSource) {
    setIncomeSources((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">FBR · Tax Assistant</p>
        <h1 className="font-display text-3xl">What do you need to file?</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Answer a few questions and LegalPak points you to the filings that commonly apply. This is
          guidance, not tax advice — confirm current thresholds and rates with a licensed tax consultant or
          FBR before relying on it.
        </p>
      </div>

      <section className="space-y-5 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wide text-muted">
            Are you an individual or a business?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["individual", "company", "aop", "sole_proprietor", "other"] as TaxpayerKind[]).map((k) => (
              <label
                key={k}
                className={`min-h-11 cursor-pointer rounded-[var(--radius-sm)] border px-3 py-2 text-sm capitalize ${
                  taxpayerKind === k ? "border-accent bg-bg font-medium" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="taxpayerKind"
                  className="sr-only"
                  checked={taxpayerKind === k}
                  onChange={() => setTaxpayerKind(k)}
                />
                {k.replace("_", " ")}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wide text-muted">Do you currently have an NTN?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { v: true, label: "Yes" },
              { v: false, label: "No" },
              { v: null, label: "Not sure" },
            ].map((opt) => (
              <label
                key={String(opt.v)}
                className={`min-h-11 cursor-pointer rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${
                  hasNtn === opt.v ? "border-accent bg-bg font-medium" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="hasNtn"
                  className="sr-only"
                  checked={hasNtn === opt.v}
                  onChange={() => setHasNtn(opt.v)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wide text-muted">
            Do you earn income from any of these?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {INCOME_SOURCES.map((s) => (
              <label
                key={s.id}
                className={`min-h-11 cursor-pointer rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${
                  incomeSources.includes(s.id) ? "border-accent bg-bg font-medium" : "border-border"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={incomeSources.includes(s.id)}
                  onChange={() => toggleSource(s.id)}
                />
                {s.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wide text-muted">Are you registered for Sales Tax?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { v: true, label: "Yes" },
              { v: false, label: "No" },
              { v: null, label: "Don't know" },
            ].map((opt) => (
              <label
                key={String(opt.v)}
                className={`min-h-11 cursor-pointer rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${
                  salesTaxRegistered === opt.v ? "border-accent bg-bg font-medium" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="salesTaxRegistered"
                  className="sr-only"
                  checked={salesTaxRegistered === opt.v}
                  onChange={() => setSalesTaxRegistered(opt.v)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={() => setShow(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-accent"
        >
          <Sparkles className="size-4" strokeWidth={1.75} />
          Show my recommendation
        </button>
      </section>

      {show && (
        <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h2 className="font-display text-xl">Based on your answers</h2>
          {recommendation.required.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-success">Commonly required</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {recommendation.required.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {recommendation.consider.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-warn">Worth considering</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {recommendation.consider.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          <Flags flags={recommendation.notes.map((n) => ({ level: "low" as const, title: "Note", detail: n }))} />
          <Link
            to="/dashboard"
            className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] border border-border bg-bg px-4 text-sm font-medium hover:border-accent"
          >
            Go to a company to start filing
          </Link>
        </section>
      )}
    </div>
  );
}
