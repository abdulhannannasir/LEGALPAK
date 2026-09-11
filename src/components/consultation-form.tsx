import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { createConsultationRequestFn } from "@/lib/legalpak/consultations";

export function ConsultationForm({
  workspaceId,
  companyId,
  matterId,
  defaultTopic,
}: {
  workspaceId?: string;
  companyId?: string;
  matterId?: string;
  defaultTopic?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState(defaultTopic ?? "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createConsultationRequestFn({
        data: { name, email, phone: phone || undefined, topic, message: message || undefined, workspaceId, companyId, matterId },
      });
      setSubmitted(true);
      toast.success("Request sent");
    } catch {
      toast.error("Could not send your request — try again in a moment");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-success bg-flag-low p-5 text-center">
        <p className="font-medium">Thanks — your request has been received.</p>
        <p className="mt-1 text-sm text-muted">We'll get back to you at {email} shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone (optional)">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="What do you need help with?">
          <Input required value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Share restructuring" />
        </Field>
        <Field label="Details (optional)" className="sm:col-span-2">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Sending…" : "Request consultation"}
      </Button>
    </form>
  );
}
