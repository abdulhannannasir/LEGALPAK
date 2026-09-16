import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, PlayCircle, ShieldAlert } from "lucide-react";
import { RequireSubscription } from "@/components/billing/RequireSubscription";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { DocumentVault } from "@/components/document-vault";
import { ActivityTimeline } from "@/components/activity-timeline";
import { ObligationNotes } from "@/components/compliance/obligation-notes";
import { ObligationPriorityBadge, ObligationStatusBadge } from "@/components/compliance/obligation-badge";
import { COMPLIANCE_CATEGORIES, COMPLIANCE_CATEGORY_LABEL } from "@/lib/legalpak/compliance-rules";
import {
  changeObligationDeadlineFn,
  changeObligationStatusFn,
  computeObligationEffectiveStatus,
  getComplianceObligationFn,
  isConfigurationRequired,
  updateComplianceObligationFn,
  COMPLIANCE_OBLIGATION_STATUSES,
  COMPLIANCE_OBLIGATION_STATUS_LABEL,
  COMPLIANCE_PRIORITIES,
  COMPLIANCE_PRIORITY_LABEL,
  type ComplianceObligationWithCompany,
} from "@/lib/legalpak/compliance-obligations";
import { formatShort } from "@/lib/legal/date";

export const Route = createFileRoute("/compliance_/$obligationId")({
  component: ObligationPage,
  head: () => ({
    meta: [{ title: "Compliance obligation — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function ObligationPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return (
    <RequireSubscription>
      <ObligationBody />
    </RequireSubscription>
  );
}

function ObligationBody() {
  const { obligationId } = useParams({ from: "/compliance_/$obligationId" });
  const [obligation, setObligation] = useState<ComplianceObligationWithCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{
    title: string;
    description: string;
    category: ComplianceObligationWithCompany["category"];
    authority: string;
    priority: ComplianceObligationWithCompany["priority"];
  } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deadlineDraft, setDeadlineDraft] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const o = await getComplianceObligationFn({ data: obligationId });
      setObligation(o);
      setDeadlineDraft(o.due_date ?? "");
    } catch {
      toast.error("Could not load this obligation");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obligationId]);

  function startEdit() {
    if (!obligation) return;
    setDraft({
      title: obligation.title,
      description: obligation.description,
      category: obligation.category,
      authority: obligation.authority,
      priority: obligation.priority,
    });
    setEditing(true);
  }

  async function saveEdit() {
    if (!obligation || !draft) return;
    setSavingEdit(true);
    try {
      const updated = await updateComplianceObligationFn({
        data: {
          obligationId: obligation.id,
          title: draft.title,
          description: draft.description,
          category: draft.category,
          authority: draft.authority,
          priority: draft.priority,
        },
      });
      setObligation((o) => (o ? { ...o, ...updated } : o));
      setEditing(false);
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save changes");
    } finally {
      setSavingEdit(false);
    }
  }

  async function changeStatus(status: (typeof COMPLIANCE_OBLIGATION_STATUSES)[number]) {
    if (!obligation) return;
    setBusy(true);
    try {
      const updated = await changeObligationStatusFn({ data: { obligationId: obligation.id, status } });
      setObligation((o) => (o ? { ...o, ...updated } : o));
      toast.success(`Marked ${COMPLIANCE_OBLIGATION_STATUS_LABEL[status].toLowerCase()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change status");
    } finally {
      setBusy(false);
    }
  }

  async function saveDeadline() {
    if (!obligation) return;
    setBusy(true);
    try {
      const updated = await changeObligationDeadlineFn({ data: { obligationId: obligation.id, dueDate: deadlineDraft || null } });
      setObligation((o) => (o ? { ...o, ...updated } : o));
      toast.success("Deadline updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change the deadline");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;
  if (!obligation) return <p className="text-sm text-muted">Obligation not found.</p>;

  const effectiveStatus = computeObligationEffectiveStatus(obligation.status, obligation.due_date);
  const configRequired = isConfigurationRequired(obligation);
  const canStart = obligation.status !== "in_progress" && obligation.status !== "completed";
  const canComplete = obligation.status !== "completed";

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/companies/$companyId"
          params={{ companyId: obligation.company_id }}
          className="text-xs font-medium uppercase tracking-widest text-muted underline"
        >
          ← {obligation.company_name}
        </Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-3xl">{obligation.title}</h1>
          <div className="flex items-center gap-2">
            <ObligationPriorityBadge priority={obligation.priority} />
            <ObligationStatusBadge
              status={effectiveStatus}
              dueDate={obligation.due_date}
              configurationRequired={configRequired}
            />
          </div>
        </div>
        <p className="mt-1 text-sm text-muted">
          {COMPLIANCE_CATEGORY_LABEL[obligation.category]}
          {obligation.authority ? ` · ${obligation.authority}` : ""}
          {obligation.recurring ? ` · Recurring (${obligation.recurrence_rule ?? "?"})` : ""}
        </p>
      </div>

      {configRequired && (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-warn bg-flag-med px-4 py-3 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warn" strokeWidth={1.75} />
          <p>
            No due date has been computed for this obligation yet. Set one manually with "Change deadline" below, or
            complete this rule's <code>deadline_logic</code> and mark it verified on the{" "}
            <Link to="/compliance/rules" className="underline">
              Rules
            </Link>{" "}
            page.
          </p>
        </div>
      )}

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Details</h2>
          {!editing && (
            <Button type="button" variant="ghost" onClick={startEdit}>
              Edit
            </Button>
          )}
        </div>

        {editing && draft ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2">
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="Category">
              <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as typeof draft.category })}>
                {COMPLIANCE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {COMPLIANCE_CATEGORY_LABEL[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Authority">
              <Input value={draft.authority} onChange={(e) => setDraft({ ...draft, authority: e.target.value })} />
            </Field>
            <Field label="Priority">
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as typeof draft.priority })}>
                {COMPLIANCE_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {COMPLIANCE_PRIORITY_LABEL[p]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="button" disabled={savingEdit} onClick={saveEdit}>
                {savingEdit ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Description</dt>
              <dd className="mt-0.5 text-sm">{obligation.description || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Status</dt>
              <dd className="mt-0.5 text-sm">{COMPLIANCE_OBLIGATION_STATUS_LABEL[effectiveStatus]}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Completed</dt>
              <dd className="mt-0.5 text-sm">
                {obligation.completed_at ? formatShort(obligation.completed_at.slice(0, 10)) : "—"}
              </dd>
            </div>
            {obligation.required_documents.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">Required documents</dt>
                <dd className="mt-1 text-sm">
                  <ul className="list-inside list-disc space-y-0.5">
                    {obligation.required_documents.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        )}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-xl">Deadline &amp; status</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Field label="Deadline">
            <Input type="date" value={deadlineDraft} onChange={(e) => setDeadlineDraft(e.target.value)} />
          </Field>
          <Button type="button" variant="secondary" disabled={busy} onClick={saveDeadline}>
            Change deadline
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Field label="Set status">
            <Select
              value={obligation.status}
              disabled={busy}
              onChange={(e) => changeStatus(e.target.value as (typeof COMPLIANCE_OBLIGATION_STATUSES)[number])}
            >
              {COMPLIANCE_OBLIGATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {COMPLIANCE_OBLIGATION_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
          {canStart && (
            <Button type="button" variant="secondary" disabled={busy} onClick={() => changeStatus("in_progress")}>
              <PlayCircle className="size-4" strokeWidth={1.75} />
              Start
            </Button>
          )}
          {canComplete && (
            <Button type="button" disabled={busy} onClick={() => changeStatus("completed")}>
              <CheckCircle2 className="size-4" strokeWidth={1.75} />
              Mark complete
            </Button>
          )}
        </div>
      </section>

      <DocumentVault scope={{ type: "company", companyId: obligation.company_id, obligationId: obligation.id }} />
      <ObligationNotes obligationId={obligation.id} />
      <ActivityTimeline obligationId={obligation.id} />
    </div>
  );
}
