import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Flags } from "@/components/flags";
import {
  classifyAccounts,
  generateAccountsPack,
  type AccountsInput,
  type CompanyKind,
} from "@/lib/legal/accounts";

export const Route = createFileRoute("/accounts")({ component: AccountsPage });

const empty: AccountsInput = {
  companyName: "",
  cuin: "",
  kind: "private",
  paidUp: 0,
  publicLinked: false,
  fyEnd: "",
  agmDate: "",
  incorporationDate: "",
  turnover: 0,
  employees: 0,
  hasSubsidiary: false,
};

function AccountsPage() {
  const [form, setForm] = useState<AccountsInput>(empty);
  const [show, setShow] = useState(false);

  const advice = useMemo(() => classifyAccounts(form), [form]);
  const pack = useMemo(() => generateAccountsPack(form, advice), [form, advice]);

  function set<K extends keyof AccountsInput>(key: K, value: AccountsInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function sample() {
    setForm({
      companyName: "Horizon Manufacturing (Pvt) Ltd",
      cuin: "0071234",
      kind: "private",
      paidUp: 15_000_000,
      publicLinked: false,
      fyEnd: "2026-06-30",
      agmDate: "2026-10-20",
      incorporationDate: "2022-04-12",
      turnover: 80_000_000,
      employees: 42,
      hasSubsidiary: false,
    });
    setShow(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">s. 223 · 232 · 233</p>
        <h1 className="font-display text-3xl">Financial statement filing</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Classifies audit, directors’ report and whether the pack must go to the registrar. Generates a
          board resolution and eZfile memo. Does not submit to SECP.
        </p>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name">
            <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
          </Field>
          <Field label="CUIN">
            <Input value={form.cuin} onChange={(e) => set("cuin", e.target.value)} />
          </Field>
          <Field label="Company type">
            <Select
              value={form.kind}
              onChange={(e) => set("kind", e.target.value as CompanyKind)}
            >
              <option value="smc">Single member company</option>
              <option value="private">Private limited</option>
              <option value="public">Public unlisted</option>
              <option value="listed">Listed</option>
              <option value="s42">Section 42 / NPO</option>
            </Select>
          </Field>
          <Field label="Paid-up capital (PKR)">
            <Input
              type="number"
              min={0}
              value={form.paidUp || ""}
              onChange={(e) => set("paidUp", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Financial year end">
            <Input type="date" value={form.fyEnd} onChange={(e) => set("fyEnd", e.target.value)} />
          </Field>
          <Field label="AGM date">
            <Input type="date" value={form.agmDate} onChange={(e) => set("agmDate", e.target.value)} />
          </Field>
          <Field label="Incorporation date">
            <Input
              type="date"
              value={form.incorporationDate}
              onChange={(e) => set("incorporationDate", e.target.value)}
            />
          </Field>
          <Field label="Turnover (PKR, last year)">
            <Input
              type="number"
              min={0}
              value={form.turnover || ""}
              onChange={(e) => set("turnover", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Employees (average)">
            <Input
              type="number"
              min={0}
              value={form.employees || ""}
              onChange={(e) => set("employees", Number(e.target.value) || 0)}
            />
          </Field>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.publicLinked}
              onChange={(e) => set("publicLinked", e.target.checked)}
            />
            Public-linked (PIC, public subsidiary, or holding of a public company)
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.hasSubsidiary}
              onChange={(e) => set("hasSubsidiary", e.target.checked)}
            />
            Has a subsidiary (consolidation)
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" onClick={() => setShow(true)}>
            Classify and generate pack
          </Button>
          <Button type="button" variant="secondary" onClick={sample}>
            Load sample (Rs 15m Pvt Ltd)
          </Button>
        </div>
      </section>

      {show && (
        <>
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <h2 className="font-display text-2xl">{advice.bucket}</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-muted">Audit</dt>
                <dd className="font-medium">{advice.auditRequired ? "Required" : "Exempt"}</dd>
              </div>
              <div>
                <dt className="text-muted">File with SECP</dt>
                <dd className="font-medium">
                  {advice.fileWithSecp
                    ? `Yes — ${advice.filingDaysAfterAgm} days after AGM`
                    : "Generally no"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Directors’ report</dt>
                <dd className="font-medium">{advice.directorsReport ? "Required" : "Exempt"}</dd>
              </div>
              <div>
                <dt className="text-muted">AGM due (120 days)</dt>
                <dd className="font-medium">{advice.agmDue ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Accounts due</dt>
                <dd className="font-medium">{advice.accountsDue ?? "Not a registrar filing"}</dd>
              </div>
              <div>
                <dt className="text-muted">Form A due</dt>
                <dd className="font-medium">{advice.formADue ?? "—"}</dd>
              </div>
            </dl>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
              {advice.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <a
              className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-accent underline"
              href="https://leap.secp.gov.pk/"
              target="_blank"
              rel="noreferrer"
            >
              Open eZfile
            </a>
          </section>
          <Flags flags={advice.flags} />
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigator.clipboard.writeText(pack)}
              >
                Copy memorandum
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const blob = new Blob([pack], { type: "text/plain" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "secp-financial-statements-memo.txt";
                  a.click();
                }}
              >
                Download .txt
              </Button>
            </div>
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed">
              {pack}
            </pre>
          </section>
        </>
      )}
    </div>
  );
}
