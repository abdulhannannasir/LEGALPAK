import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Circle, Clock } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listWorkspacesFn, type Workspace } from "@/lib/legalpak/workspaces";
import { listWorkspaceMattersFn, type MatterWithCompany } from "@/lib/legalpak/matters";
import { MATTER_TYPE_LABEL, STATUS_LABEL } from "@/lib/legalpak/workflow";
import { formatDateLong } from "@/lib/legal/accounts";

export const Route = createFileRoute("/compliance")({
  component: CompliancePage,
  head: () => ({
    meta: [
      { title: "Compliance calendar — LegalPak" },
      {
        name: "description",
        content:
          "Every statutory deadline for your Pakistani company in one place — SECP, tax, and labour filings — with reminders before the clock runs out.",
      },
    ],
  }),
});

type Urgency = "overdue" | "soon" | "upcoming" | "none" | "done";

function urgencyOf(m: MatterWithCompany): Urgency {
  if (m.status === "closed") return "done";
  if (!m.due_date) return "none";
  const today = new Date().toISOString().slice(0, 10);
  const soonCutoff = new Date();
  soonCutoff.setDate(soonCutoff.getDate() + 7);
  const soon = soonCutoff.toISOString().slice(0, 10);
  if (m.due_date < today) return "overdue";
  if (m.due_date <= soon) return "soon";
  return "upcoming";
}

const URGENCY_STYLE: Record<Urgency, { label: string; badge: string; icon: typeof AlertTriangle }> = {
  overdue: { label: "Overdue", badge: "border-danger bg-flag-high text-fg", icon: AlertTriangle },
  soon: { label: "Due soon", badge: "border-warn bg-flag-med text-fg", icon: Clock },
  upcoming: { label: "Upcoming", badge: "border-border bg-surface text-muted", icon: Circle },
  none: { label: "No deadline set", badge: "border-border bg-surface text-muted", icon: Circle },
  done: { label: "Closed", badge: "border-success bg-flag-low text-fg", icon: CheckCircle2 },
};

function CompliancePage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <ComplianceBody />;
}

function ComplianceBody() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [matters, setMatters] = useState<MatterWithCompany[] | null>(null);

  useEffect(() => {
    listWorkspacesFn()
      .then((rows) => setWorkspace(rows[0] ?? null))
      .catch(() => setWorkspace(null));
  }, []);

  useEffect(() => {
    if (!workspace) return;
    listWorkspaceMattersFn({ data: workspace.id })
      .then(setMatters)
      .catch(() => toast.error("Could not load the compliance calendar"));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the workspace id changes
  }, [workspace?.id]);

  const counts = useMemo(() => {
    const c = { overdue: 0, soon: 0, upcoming: 0, done: 0 };
    for (const m of matters ?? []) {
      const u = urgencyOf(m);
      if (u === "overdue" || u === "soon" || u === "upcoming" || u === "done") c[u] += 1;
    }
    return c;
  }, [matters]);

  const sorted = useMemo(() => {
    if (!matters) return [];
    const rank: Record<Urgency, number> = { overdue: 0, soon: 1, upcoming: 2, none: 3, done: 4 };
    return [...matters].sort((a, b) => rank[urgencyOf(a)] - rank[urgencyOf(b)]);
  }, [matters]);

  if (workspace === null && matters === null) return null;

  if (!workspace) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-3xl">Compliance calendar</h1>
        <p className="text-sm text-muted">
          Create a workspace on the{" "}
          <Link to="/dashboard" className="underline">
            dashboard
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">{workspace.name}</p>
        <h1 className="font-display text-3xl">Compliance calendar</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Every open matter across your companies, sorted by how soon it's due. Deadlines are recalculated
          automatically from each matter's saved draft.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Overdue" value={counts.overdue} tone="danger" />
        <StatTile label="Due this week" value={counts.soon} tone="warn" />
        <StatTile label="Upcoming" value={counts.upcoming} tone="muted" />
        <StatTile label="Closed" value={counts.done} tone="success" />
      </div>

      {matters === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted">No matters yet — create one from a company page.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((m) => {
            const u = urgencyOf(m);
            const style = URGENCY_STYLE[u];
            const Icon = style.icon;
            return (
              <Link
                key={m.id}
                to="/matters/$matterId"
                params={{ matterId: m.id }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 hover:border-accent"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted">
                    {m.company_name} · {MATTER_TYPE_LABEL[m.type]} · {STATUS_LABEL[m.status]}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${style.badge}`}
                >
                  <Icon className="size-3.5" strokeWidth={2} />
                  {m.due_date ? `${style.label} · ${formatDateLong(m.due_date)}` : style.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "warn" | "muted" | "success";
}) {
  const toneClass = {
    danger: "text-danger",
    warn: "text-warn",
    muted: "text-fg",
    success: "text-success",
  }[tone];
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-display text-3xl ${toneClass}`}>{value}</p>
    </div>
  );
}
