import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RequireSubscription } from "@/components/billing/RequireSubscription";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listWorkspacesFn, type Workspace } from "@/lib/legalpak/workspaces";
import {
  deriveCompliance,
  listComplianceItemsFn,
  type ComplianceHealth,
  type ComplianceItem,
} from "@/lib/legalpak/compliance";
import { Select } from "@/components/ui/field";
import { ComplianceHealthTiles } from "@/components/compliance/health-tiles";
import { ComplianceListView } from "@/components/compliance/list-view";
import { ComplianceCalendarView } from "@/components/compliance/calendar-view";

export const Route = createFileRoute("/compliance")({
  component: () => (
    <RequireSubscription>
      <CompliancePage />
    </RequireSubscription>
  ),
  head: () => ({
    meta: [
      { title: "Compliance center — LegalPak" },
      {
        name: "description",
        content:
          "Every SECP and FBR compliance requirement for your Pakistani companies in one place — health status, a monthly calendar, and a full list — with notes, reminders and document attachments per item.",
      },
    ],
  }),
});

const EMPTY_COUNTS: Record<ComplianceHealth, number> = {
  overdue: 0,
  due_soon: 0,
  upcoming: 0,
  unscheduled: 0,
  completed: 0,
};

function healthRank(item: ComplianceItem): number {
  const derived = deriveCompliance(item);
  if (!derived) return 99;
  const rank: Record<ComplianceHealth, number> = { overdue: 0, due_soon: 1, unscheduled: 2, upcoming: 3, completed: 4 };
  return rank[derived.health];
}

function CompliancePage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <ComplianceBody />;
}

function ComplianceBody() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [items, setItems] = useState<ComplianceItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  useEffect(() => {
    listWorkspacesFn()
      .then((rows) => setWorkspace(rows[0] ?? null))
      .catch(() => setWorkspace(null));
  }, []);

  function loadItems() {
    if (!workspace) return;
    setLoadError(false);
    listComplianceItemsFn({ data: workspace.id })
      .then(setItems)
      .catch(() => {
        setLoadError(true);
        toast.error("Could not load the compliance center");
      });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the workspace id changes
  useEffect(loadItems, [workspace?.id]);

  const counts = useMemo(() => {
    const c = { ...EMPTY_COUNTS };
    for (const item of items ?? []) {
      const derived = deriveCompliance(item);
      if (derived) c[derived.health] += 1;
    }
    return c;
  }, [items]);

  const companies = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items ?? []) map.set(item.company_id, item.company_name);
    return [...map.entries()];
  }, [items]);

  const filtered = useMemo(() => {
    const rows = items ?? [];
    const scoped = companyFilter === "all" ? rows : rows.filter((i) => i.company_id === companyFilter);
    return [...scoped].sort((a, b) => healthRank(a) - healthRank(b));
  }, [items, companyFilter]);

  if (workspace === null && items === null) return null;

  if (!workspace) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-3xl">Compliance center</h1>
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
        <h1 className="font-display text-3xl">Compliance center</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Every SECP and FBR requirement tracked across your companies — health, deadlines and paperwork in one
          place. Deadlines are computed from each matter's saved draft using the same calculators the matter itself
          uses, never invented here.
        </p>
      </div>

      <ComplianceHealthTiles counts={counts} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              view === "list" ? "border-primary bg-primary text-primary-fg" : "border-border text-muted"
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setView("calendar")}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              view === "calendar" ? "border-primary bg-primary text-primary-fg" : "border-border text-muted"
            }`}
          >
            Calendar
          </button>
        </div>
        {companies.length > 1 && (
          <Select
            aria-label="Filter by company"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="w-auto"
          >
            <option value="all">All companies</option>
            {companies.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {items === null && loadError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-danger bg-flag-high px-4 py-3 text-sm text-danger">
          <span>Could not load the compliance center.</span>
          <button type="button" onClick={loadItems} className="font-medium underline">
            Try again
          </button>
        </div>
      ) : items === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">
          No compliance matters yet — create a Financial Statements, Form A, Form 9 or Income Tax matter from a
          company page.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">Nothing for this company.</p>
      ) : view === "list" ? (
        <ComplianceListView items={filtered} />
      ) : (
        <ComplianceCalendarView items={filtered} />
      )}
    </div>
  );
}
