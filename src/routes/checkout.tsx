import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, MessageCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { buildWhatsAppProofLink, EASYPAISA_ACCOUNT } from "@/lib/payments/easypaisa";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

const PLANS = [
  { id: "single", label: "Single filing pack", price: "1,500" },
  { id: "contract", label: "Contract drafting", price: "2,500" },
  { id: "desk", label: "Monthly filing desk", price: "6,000" },
];

function CheckoutPage() {
  const [plan, setPlan] = useState(PLANS[0].id);
  const [name, setName] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedPlan = PLANS.find((p) => p.id === plan) ?? PLANS[0];
  const canSubmit = name.trim().length > 0 && transactionId.trim().length > 0;

  function copyNumber() {
    navigator.clipboard.writeText(EASYPAISA_ACCOUNT.numberRaw);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function sendProof() {
    const link = buildWhatsAppProofLink({
      name,
      amount: selectedPlan.price,
      transactionId,
      plan: selectedPlan.label,
    });
    window.open(link, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Payment</p>
        <h1 className="mt-1 font-display text-3xl">Pay with EasyPaisa</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Send your payment to our EasyPaisa account, then share the transaction ID so we can confirm it. This is a
          manual transfer — there is no automatic checkout yet.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <Field label="Choose a plan">
          <Select value={plan} onChange={(e) => setPlan(e.target.value)}>
            {PLANS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} — PKR {p.price}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
            <Smartphone className="size-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold">EasyPaisa account</h2>
            <p className="mt-1 text-sm text-muted">Account title: {EASYPAISA_ACCOUNT.title}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-lg border border-border bg-bg px-3 py-2 font-display text-lg tracking-wide">
                {EASYPAISA_ACCOUNT.number}
              </span>
              <Button type="button" variant="ghost" onClick={copyNumber} className="px-3">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="mt-3 text-sm font-medium">
              Amount to send: <span className="text-primary">PKR {selectedPlan.price}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Confirm your payment</h2>
        <p className="mt-1 text-sm text-muted">
          After sending the money, fill this in and we'll open WhatsApp with your details pre-filled — just hit send.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </Field>
          <Field label="EasyPaisa transaction ID">
            <Input
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. 8842213456"
            />
          </Field>
        </div>
        <Button type="button" onClick={sendProof} disabled={!canSubmit} className="mt-4 w-full sm:w-auto">
          <MessageCircle className="size-4" />
          Send confirmation on WhatsApp
        </Button>
      </div>
    </div>
  );
}
