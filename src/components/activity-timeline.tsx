import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { listCompanyActivityFn, listMatterActivityFn, type AuditLogRow } from "@/lib/legalpak/audit";
import { listObligationActivityFn } from "@/lib/legalpak/compliance-obligations";
import { listTaskActivityFn } from "@/lib/legalpak/tasks";

const ACTION_LABEL: Record<string, (m: Record<string, unknown>) => string> = {
  MATTER_CREATED: (m) => `Matter created${m.type ? ` (${String(m.type).replace(/_/g, " ").toLowerCase()})` : ""}`,
  MATTER_DRAFT_SAVED: () => "Draft saved",
  MATTER_STATUS_CHANGED: (m) => `Status changed: ${m.from ?? "?"} → ${m.to ?? "?"}`,
  DOCUMENT_UPLOADED: (m) => `Uploaded ${m.name ?? "a document"}`,
  DOCUMENT_RENAMED: (m) => `Renamed to ${m.name ?? "?"}`,
  DOCUMENT_REPLACED: (m) => `Replaced ${m.name ?? "a document"} with v${m.version ?? "?"}`,
  DOCUMENT_DOWNLOADED: (m) => `Downloaded ${m.name ?? "a document"}`,
  DOCUMENT_DETAILS_UPDATED: (m) => `Updated details for ${m.name ?? "a document"}`,
  DOCUMENT_LINKED: (m) => `Linked ${m.name ?? "a document"} to ${m.matterTitle ?? "a matter"}`,
  DOCUMENT_UNLINKED: (m) => `Unlinked ${m.name ?? "a document"}`,
  DOCUMENT_DELETED: (m) => `Deleted ${m.name ?? "a document"}`,
  COMPANY_CREATED: (m) => `Company created${m.name ? ` (${m.name})` : ""}`,
  COMPANY_UPDATED: () => "Company profile updated",
  COMPANY_ARCHIVED: (m) => `Company archived${m.name ? ` (${m.name})` : ""}`,
  COMPANY_RESTORED: (m) => `Company restored${m.name ? ` (${m.name})` : ""}`,
  WORKSPACE_CREATED: (m) => `Workspace created${m.name ? ` (${m.name})` : ""}`,
  WORKSPACE_RENAMED: (m) => `Workspace renamed${m.name ? ` (${m.name})` : ""}`,
  APPROVAL_REQUESTED: (m) => `Client approval requested${m.clientEmail ? ` (${m.clientEmail})` : ""}`,
  CLIENT_APPROVED: () => "Client approved",
  CLIENT_REJECTED: () => "Client rejected",
  CONTRACT_VERSION_SAVED: (m) => `Contract version v${m.version ?? "?"} saved${m.note ? `: ${m.note}` : ""}`,
  MATTER_MARKED_COMPLETE: () => "Marked complete",
  MATTER_REOPENED: () => "Reopened",
  COMPLIANCE_NOTE_ADDED: () => "Note added",
  COMPLIANCE_REMINDER_SET: (m) => `Reminder set${m.remindOn ? ` for ${m.remindOn}` : ""}`,
  OBLIGATION_CREATED: (m) => `Obligation created${m.title ? ` (${m.title})` : ""}${m.fromRule ? " — from a compliance rule" : ""}`,
  OBLIGATION_UPDATED: () => "Obligation details updated",
  OBLIGATION_STATUS_CHANGED: (m) => `Status changed: ${m.from ?? "?"} → ${m.to ?? "?"}`,
  OBLIGATION_DEADLINE_CHANGED: (m) => `Deadline changed${m.to ? ` to ${m.to}` : " (cleared)"}`,
  OBLIGATION_COMPLETED: () => "Marked complete",
  OBLIGATION_NOTE_ADDED: () => "Note added",
  OBLIGATION_DOCUMENT_UPLOADED: (m) => `Uploaded ${m.name ?? "a document"}`,
  TASK_CREATED: (m) => `Task created${m.title ? ` (${m.title})` : ""}`,
  TASK_UPDATED: () => "Task details updated",
  TASK_STATUS_CHANGED: (m) => `Status changed: ${m.from ?? "?"} → ${m.to ?? "?"}`,
  TASK_COMPLETED: () => "Marked done",
  TASK_ASSIGNED: (m) => (m.assigneeName ? `Assigned to ${m.assigneeName}` : "Unassigned"),
  TASK_DUE_DATE_CHANGED: (m) => `Due date changed${m.to ? ` to ${m.to}` : " (cleared)"}`,
  TASK_LINKED: () => "Related company/document updated",
  TASK_DELETED: () => "Task deleted",
  TASK_STEP_ADDED: (m) => `Step added${m.title ? ` (${m.title})` : ""}`,
  TASK_STEP_TOGGLED: (m) => `${m.done ? "Checked off" : "Reopened"} step${m.title ? ` "${m.title}"` : ""}`,
  TASK_STEP_DELETED: (m) => `Step removed${m.title ? ` (${m.title})` : ""}`,
  TASK_COMMENT_ADDED: () => "Comment added",
  EMPLOYEE_ADDED: (m) => `Employee added${m.name ? ` (${m.name}${m.jobTitle ? `, ${m.jobTitle}` : ""})` : ""}`,
  EMPLOYEE_UPDATED: (m) => `Employee details updated${m.name ? ` (${m.name})` : ""}`,
  EMPLOYEE_STATUS_CHANGED: (m) =>
    `${m.name ?? "Employee"} marked as ${m.status === "former" ? "having left" : "active again"}`,
  EMPLOYEE_REMOVED: (m) => `Employee removed${m.name ? ` (${m.name})` : ""}`,
  EMPLOYEE_CONTRACT_SAVED: (m) =>
    `Employment contract v${m.version ?? "?"} saved${m.name ? ` for ${m.name}` : ""}`,
};

export function describeAuditRow(row: AuditLogRow): string {
  const fn = ACTION_LABEL[row.action];
  return fn ? fn(row.metadata) : row.action;
}

export function formatAuditTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ActivityTimeline({
  matterId,
  companyId,
  obligationId,
  taskId,
  title = "Activity",
}: {
  matterId?: string;
  companyId?: string;
  obligationId?: string;
  taskId?: string;
  title?: string;
}) {
  const [rows, setRows] = useState<AuditLogRow[] | null>(null);

  useEffect(() => {
    const request = taskId
      ? listTaskActivityFn({ data: taskId })
      : obligationId
        ? listObligationActivityFn({ data: obligationId })
        : matterId
          ? listMatterActivityFn({ data: matterId })
          : companyId
            ? listCompanyActivityFn({ data: companyId })
            : Promise.resolve([]);
    request.then(setRows).catch(() => setRows([]));
  }, [matterId, companyId, obligationId, taskId]);

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="flex items-center gap-2 font-display text-xl">
        <History className="size-5 text-accent" strokeWidth={1.75} />
        {title}
      </h2>
      {rows === null ? (
        <p className="mt-3 text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No activity recorded yet.</p>
      ) : (
        <ol className="mt-3 space-y-3 border-l border-border pl-4">
          {rows.map((row) => (
            <li key={row.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-accent" />
              <p className="text-sm font-medium">{describeAuditRow(row)}</p>
              <p className="text-xs text-muted">
                {formatAuditTimestamp(row.created_at)}
                {row.user_name || row.user_email ? ` · ${row.user_name ?? row.user_email}` : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
