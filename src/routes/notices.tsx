import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PackOutput } from "@/components/pack-output";
import { SplitScreen } from "@/components/split-screen";
import { usePersistedState } from "@/lib/use-persisted-state";
import { createId } from "@/lib/legalpak/id";
import {
  NOTICE_TYPES,
  emptyPostalTracking,
  generate489FCommercialNotice,
  generateDebtRecoveryNotice,
  type DebtRecoveryInput,
  type Notice489FCommercialInput,
  type NoticeLogEntry,
  type NoticeTypeId,
  type PostalTracking,
} from "@/lib/notices/notices";

export const Route = createFileRoute("/notices")({
  component: NoticesPage,
  head: () => ({
    meta: [
      { title: "Pre-Litigation Legal Notices — LegalPak" },
      {
        name: "description",
        content:
          "Generate a Section 489-F dishonoured-cheque notice or a commercial debt recovery notice for Pakistan, with postal registration tracking to prove service.",
      },
    ],
  }),
});

const empty489F: Notice489FCommercialInput = {
  creditorCompanyName: "",
  creditorAddress: "",
  debtorName: "",
  debtorAddress: "",
  chequeNumber: "",
  chequeAmount: 0,
  bankName: "",
  chequeDate: "",
  dishonorReason: "",
  underlyingTransaction: "",
  city: "",
  tracking: emptyPostalTracking(),
};

const emptyDebtRecovery: DebtRecoveryInput = {
  creditorCompanyName: "",
  creditorAddress: "",
  debtorName: "",
  debtorAddress: "",
  invoiceOrContractRef: "",
  principalAmount: 0,
  interestOrLateFee: 0,
  dueDate: "",
  natureOfDebt: "",
  city: "",
  tracking: emptyPostalTracking(),
};

function TrackingFields({
  tracking,
  onChange,
}: {
  tracking: PostalTracking;
  onChange: (t: PostalTracking) => void;
}) {
  function set<K extends keyof PostalTracking>(k: K, v: PostalTracking[K]) {
    onChange({ ...tracking, [k]: v });
  }
  return (
    <div className="mt-4 rounded-[var(--radius-md)] border border-border bg-bg p-4">
      <h3 className="text-sm font-medium">Postal registration tracking</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Dispatch method">
          <Select value={tracking.dispatchMethod} onChange={(e) => set("dispatchMethod", e.target.value as PostalTracking["dispatchMethod"])}>
            <option value="Registered Post (AD)">Registered Post (AD)</option>
            <option value="Courier">Courier</option>
            <option value="Email + Registered Post">Email + Registered Post</option>
          </Select>
        </Field>
        <Field label="Delivery status">
          <Select value={tracking.deliveryStatus} onChange={(e) => set("deliveryStatus", e.target.value as PostalTracking["deliveryStatus"])}>
            <option value="Not yet dispatched">Not yet dispatched</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
            <option value="Returned / undelivered">Returned / undelivered</option>
          </Select>
        </Field>
        <Field label="Tracking / receipt number">
          <Input value={tracking.trackingNumber} onChange={(e) => set("trackingNumber", e.target.value)} />
        </Field>
        <Field label="Dispatch date">
          <Input type="date" value={tracking.dispatchDate} onChange={(e) => set("dispatchDate", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function NoticesPage() {
  const [noticeType, setNoticeType] = usePersistedState<NoticeTypeId>("legalpak:notices-type", "489f");
  const [form489F, setForm489F] = usePersistedState<Notice489FCommercialInput>("legalpak:notices-489f", empty489F);
  const [formDebt, setFormDebt] = usePersistedState<DebtRecoveryInput>("legalpak:notices-debt", emptyDebtRecovery);
  const [log, setLog] = usePersistedState<NoticeLogEntry[]>("legalpak:notices-log", []);

  function set489F<K extends keyof Notice489FCommercialInput>(k: K, v: Notice489FCommercialInput[K]) {
    setForm489F((f) => ({ ...f, [k]: v }));
  }
  function setDebt<K extends keyof DebtRecoveryInput>(k: K, v: DebtRecoveryInput[K]) {
    setFormDebt((f) => ({ ...f, [k]: v }));
  }

  const is489F = noticeType === "489f";
  const hasAnyValue = is489F
    ? form489F.debtorName.trim() !== "" && form489F.chequeAmount > 0
    : formDebt.debtorName.trim() !== "" && formDebt.principalAmount > 0;

  const out = useMemo(() => {
    if (!hasAnyValue) return "";
    return is489F ? generate489FCommercialNotice(form489F) : generateDebtRecoveryNotice(formDebt);
  }, [is489F, form489F, formDebt, hasAnyValue]);

  function logDispatch() {
    const entry: NoticeLogEntry = is489F
      ? {
          id: createId("notice"),
          noticeType,
          debtorName: form489F.debtorName,
          amount: form489F.chequeAmount,
          tracking: form489F.tracking,
          createdAt: new Date().toISOString(),
        }
      : {
          id: createId("notice"),
          noticeType,
          debtorName: formDebt.debtorName,
          amount: formDebt.principalAmount + formDebt.interestOrLateFee,
          tracking: formDebt.tracking,
          createdAt: new Date().toISOString(),
        };
    setLog((l) => [entry, ...l]);
    toast.success("Logged — tracked in the dispatch log below");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Corporate Suite</p>
        <h1 className="font-display text-3xl">Pre-Litigation Legal Notice Builder</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Guided notices for a business pursuing a debtor — with postal registration tracking so
          you can prove service if the matter proceeds to court.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {NOTICE_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setNoticeType(t.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              noticeType === t.id ? "border-accent bg-surface text-accent" : "border-border bg-bg text-muted"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      <SplitScreen
        form={
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            {is489F ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your company name">
                  <Input value={form489F.creditorCompanyName} onChange={(e) => set489F("creditorCompanyName", e.target.value)} />
                </Field>
                <Field label="Your address">
                  <Input value={form489F.creditorAddress} onChange={(e) => set489F("creditorAddress", e.target.value)} />
                </Field>
                <Field label="Debtor's name">
                  <Input value={form489F.debtorName} onChange={(e) => set489F("debtorName", e.target.value)} />
                </Field>
                <Field label="Debtor's address">
                  <Input value={form489F.debtorAddress} onChange={(e) => set489F("debtorAddress", e.target.value)} />
                </Field>
                <Field label="Cheque number">
                  <Input value={form489F.chequeNumber} onChange={(e) => set489F("chequeNumber", e.target.value)} />
                </Field>
                <Field label="Cheque amount (PKR)">
                  <Input
                    type="number"
                    value={form489F.chequeAmount || ""}
                    onChange={(e) => set489F("chequeAmount", Number(e.target.value) || 0)}
                  />
                </Field>
                <Field label="Bank name">
                  <Input value={form489F.bankName} onChange={(e) => set489F("bankName", e.target.value)} />
                </Field>
                <Field label="Cheque date">
                  <Input type="date" value={form489F.chequeDate} onChange={(e) => set489F("chequeDate", e.target.value)} />
                </Field>
                <Field label="Reason given by bank">
                  <Input value={form489F.dishonorReason} onChange={(e) => set489F("dishonorReason", e.target.value)} />
                </Field>
                <Field label="City">
                  <Input value={form489F.city} onChange={(e) => set489F("city", e.target.value)} />
                </Field>
                <Field label="Underlying transaction" className="sm:col-span-2">
                  <Textarea
                    value={form489F.underlyingTransaction}
                    onChange={(e) => set489F("underlyingTransaction", e.target.value)}
                  />
                </Field>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your company name">
                  <Input value={formDebt.creditorCompanyName} onChange={(e) => setDebt("creditorCompanyName", e.target.value)} />
                </Field>
                <Field label="Your address">
                  <Input value={formDebt.creditorAddress} onChange={(e) => setDebt("creditorAddress", e.target.value)} />
                </Field>
                <Field label="Debtor's name">
                  <Input value={formDebt.debtorName} onChange={(e) => setDebt("debtorName", e.target.value)} />
                </Field>
                <Field label="Debtor's address">
                  <Input value={formDebt.debtorAddress} onChange={(e) => setDebt("debtorAddress", e.target.value)} />
                </Field>
                <Field label="Invoice / contract reference">
                  <Input
                    value={formDebt.invoiceOrContractRef}
                    onChange={(e) => setDebt("invoiceOrContractRef", e.target.value)}
                  />
                </Field>
                <Field label="Due date">
                  <Input type="date" value={formDebt.dueDate} onChange={(e) => setDebt("dueDate", e.target.value)} />
                </Field>
                <Field label="Principal amount (PKR)">
                  <Input
                    type="number"
                    value={formDebt.principalAmount || ""}
                    onChange={(e) => setDebt("principalAmount", Number(e.target.value) || 0)}
                  />
                </Field>
                <Field label="Interest / late fee accrued (PKR)">
                  <Input
                    type="number"
                    value={formDebt.interestOrLateFee || ""}
                    onChange={(e) => setDebt("interestOrLateFee", Number(e.target.value) || 0)}
                  />
                </Field>
                <Field label="City">
                  <Input value={formDebt.city} onChange={(e) => setDebt("city", e.target.value)} />
                </Field>
                <Field label="Nature of the debt" className="sm:col-span-2">
                  <Textarea value={formDebt.natureOfDebt} onChange={(e) => setDebt("natureOfDebt", e.target.value)} />
                </Field>
              </div>
            )}

            <TrackingFields
              tracking={is489F ? form489F.tracking : formDebt.tracking}
              onChange={(t) => (is489F ? set489F("tracking", t) : setDebt("tracking", t))}
            />

            <Button type="button" variant="secondary" className="mt-4" onClick={logDispatch} disabled={!hasAnyValue}>
              <Send className="size-4" strokeWidth={1.75} />
              Log this dispatch
            </Button>
          </section>
        }
        preview={
          out ? (
            <PackOutput text={out} filename={is489F ? "489f-notice.txt" : "debt-recovery-notice.txt"} />
          ) : (
            <section className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
              Fill in the debtor and amount to generate the notice.
            </section>
          )
        }
      />

      {log.length > 0 && (
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h2 className="font-display text-lg">Dispatch log</h2>

          {/* Below `sm`, a fixed-width table hides Status/Tracking # off-screen with no scroll
              affordance — stack each entry as a card instead. */}
          <div className="mt-3 space-y-3 sm:hidden">
            {log.map((entry) => (
              <div key={entry.id} className="rounded-[var(--radius-md)] border border-border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{entry.debtorName || "—"}</span>
                  <span>PKR {entry.amount.toLocaleString("en-PK")}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted">
                  <span>{entry.tracking.deliveryStatus}</span>
                  <span>{entry.tracking.trackingNumber || "No tracking #"}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[500px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4">Debtor</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Tracking #</th>
                </tr>
              </thead>
              <tbody>
                {log.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/60">
                    <td className="py-2 pr-4">{entry.debtorName || "—"}</td>
                    <td className="py-2 pr-4">PKR {entry.amount.toLocaleString("en-PK")}</td>
                    <td className="py-2 pr-4">{entry.tracking.deliveryStatus}</td>
                    <td className="py-2">{entry.tracking.trackingNumber || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
