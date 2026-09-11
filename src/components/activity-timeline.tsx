import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { listMatterActivityFn, type AuditLogRow } from "@/lib/legalpak/audit";

const ACTION_LABEL: Record<string, (m: Record<string, unknown>) => string> = {
  MATTER_CREATED: (m) => `Matter created${m.type ? ` (${String(m.type).replace(/_/g, " ").toLowerCase()})` : ""}`,
  MATTER_DRAFT_SAVED: () => "Draft saved",
  MATTER_STATUS_CHANGED: (m) => `Status changed: ${m.from ?? "?"} → ${m.to ?? "?"}`,
  DOCUMENT_UPLOADED: (m) => `Uploaded ${m.name ?? "a document"}`,
  DOCUMENT_DELETED: (m) => `Deleted ${m.name ?? "a document"}`,
  COMPANY_CREATED: (m) => `Company created${m.name ? ` (${m.name})` : ""}`,
  COMPANY_UPDATED: () => "Company profile updated",
  WORKSPACE_CREATED: (m) => `Workspace created${m.name ? ` (${m.name})` : ""}`,
  APPROVAL_REQUESTED: (m) => `Client approval requested${m.clientEmail ? ` (${m.clientEmail})` : ""}`,
  CLIENT_APPROVED: () => "Client approved",
  CLIENT_REJECTED: () => "Client rejected",
};

function describe(row: AuditLogRow): string {
  const fn = ACTION_LABEL[row.action];
  return fn ? fn(row.metadata) : row.action;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ActivityTimeline({ matterId }: { matterId: string }) {
  const [rows, setRows] = useState<AuditLogRow[] | null>(null);

  useEffect(() => {
    listMatterActivityFn({ data: matterId })
      .then(setRows)
      .catch(() => setRows([]));
  }, [matterId]);

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="flex items-center gap-2 font-display text-xl">
        <History className="size-5 text-accent" strokeWidth={1.75} />
        Activity
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
              <p className="text-sm font-medium">{describe(row)}</p>
              <p className="text-xs text-muted">
                {formatTimestamp(row.created_at)}
                {row.user_name || row.user_email ? ` · ${row.user_name ?? row.user_email}` : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
