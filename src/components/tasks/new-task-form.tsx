import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { listWorkspaceMembersFn, type WorkspaceMember } from "@/lib/legalpak/workspaces";
import { listComplianceObligationsFn, type ComplianceObligationWithCompany } from "@/lib/legalpak/compliance-obligations";
import { listDocumentsFn, type DocumentWithLink } from "@/lib/legalpak/documents";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABEL,
  TASK_TEMPLATES,
  createTaskFn,
  type CreateTaskInput,
} from "@/lib/legalpak/tasks";

export function NewTaskForm({
  workspaceId,
  companies,
  defaultCompanyId,
  onCreated,
  onCancel,
}: {
  workspaceId: string;
  companies: [string, string][];
  defaultCompanyId?: string | null;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [companyId, setCompanyId] = useState(defaultCompanyId || companies[0]?.[0] || "");
  const [templateKey, setTemplateKey] = useState(TASK_TEMPLATES[0].key);
  const [title, setTitle] = useState(TASK_TEMPLATES[0].label);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<CreateTaskInput["priority"]>("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [obligationId, setObligationId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [steps, setSteps] = useState<string[]>(TASK_TEMPLATES[0].steps);
  const [newStep, setNewStep] = useState("");
  const [saving, setSaving] = useState(false);

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [obligations, setObligations] = useState<ComplianceObligationWithCompany[]>([]);
  const [documents, setDocuments] = useState<DocumentWithLink[]>([]);

  useEffect(() => {
    listWorkspaceMembersFn({ data: workspaceId })
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [workspaceId]);

  useEffect(() => {
    listComplianceObligationsFn({ data: workspaceId })
      .then((rows) => setObligations(rows.filter((r) => r.company_id === companyId)))
      .catch(() => setObligations([]));
  }, [workspaceId, companyId]);

  useEffect(() => {
    if (!companyId) {
      setDocuments([]);
      return;
    }
    listDocumentsFn({ data: { companyId } })
      .then(setDocuments)
      .catch(() => setDocuments([]));
  }, [companyId]);

  function applyTemplate(key: string) {
    setTemplateKey(key);
    const t = TASK_TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    setTitle(t.label);
    setSteps(t.steps);
  }

  function addStep() {
    if (!newStep.trim()) return;
    setSteps((s) => [...s, newStep.trim()]);
    setNewStep("");
  }

  function removeStep(index: number) {
    setSteps((s) => s.filter((_, i) => i !== index));
  }

  async function submit() {
    if (!companyId || !title.trim()) {
      toast.error("Pick a company and give the task a title");
      return;
    }
    setSaving(true);
    try {
      await createTaskFn({
        data: {
          companyId,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || undefined,
          assigneeId: assigneeId || undefined,
          obligationId: obligationId || undefined,
          documentId: documentId || undefined,
          steps: steps.length > 0 ? steps : undefined,
        },
      });
      toast.success("Task created");
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="font-display text-xl">New task</h2>
      <p className="mt-1 text-sm text-muted">
        Start from a common workflow, or build a custom checklist — every field stays editable after creation.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Workflow template">
          <Select value={templateKey} onChange={(e) => applyTemplate(e.target.value)}>
            {TASK_TEMPLATES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Company">
          <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            {companies.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Title" className="sm:col-span-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. SECP Annual Return" />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Assignee">
          <Select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name || m.email}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Due date">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {TASK_PRIORITY_LABEL[p]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Related compliance item">
          <Select value={obligationId} onChange={(e) => setObligationId(e.target.value)}>
            <option value="">None</option>
            {obligations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Related document" className="sm:col-span-2">
          <Select value={documentId} onChange={(e) => setDocumentId(e.target.value)}>
            <option value="">None</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Checklist</p>
        {steps.length > 0 && (
          <ol className="mt-2 space-y-1.5">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-bg px-3 py-1.5 text-sm">
                <span className="text-xs text-muted">{i + 1}.</span>
                <span className="flex-1">{s}</span>
                <button type="button" onClick={() => removeStep(i)} aria-label={`Remove "${s}"`} className="text-muted hover:text-danger">
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-2 flex gap-2">
          <Input
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addStep();
              }
            }}
            placeholder="Add a checklist step"
          />
          <Button type="button" variant="ghost" onClick={addStep} disabled={!newStep.trim()}>
            Add
          </Button>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button type="button" disabled={saving} onClick={submit}>
          {saving ? "Creating…" : "Create task"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
