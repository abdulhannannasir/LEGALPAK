import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, ListChecks, Plus, RefreshCw, Settings2 } from "lucide-react";
import { RequireSubscription } from "@/components/billing/RequireSubscription";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listWorkspacesFn, type Workspace } from "@/lib/legalpak/workspaces";
import { listCompaniesFn, type Company } from "@/lib/legalpak/companies";
import { useCompanyContext } from "@/lib/legalpak/company-context";
import { listComplianceItemsFn } from "@/lib/legalpak/compliance";
import { listComplianceObligationsFn, evaluateRulesForWorkspaceFn, type ComplianceObligationStatus } from "@/lib/legalpak/compliance-obligations";
import {
  matterItemToUnified,
  obligationToUnified,
  filterUnifiedItems,
  EMPTY_UNIFIED_FILTERS,
  STATUS_RANK,
  type UnifiedComplianceItem,
  type UnifiedFilters,
} from "@/lib/legalpak/compliance-unified";
import { Button } from "@/components/ui/button";
import { ComplianceDashboardTiles } from "@/components/compliance/obligation-dashboard-tiles";
import { UnifiedFilterBar } from "@/components/compliance/unified-filter-bar";
import { UnifiedComplianceList } from "@/components/compliance/unified-list";
import { NewObligationForm } from "@/components/compliance/new-obligation-form";
import { addDaysISO, todayISO } from "@/lib/legal/date";

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
          "Every corporate compliance obligation for your Pakistani companies in one place — health status, a monthly calendar, and a full list — with notes, documents and an audit trail per item.",
      },
    ],
  }),
});

const EMPTY_COUNTS: Record<ComplianceObligationStatus, number> = {
  overdue: 0,
  due_soon: 0,
  upcoming: 0,
  in_progress: 0,
  completed: 0,
};

function CompliancePage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <ComplianceBody />;
}

function ComplianceBody() {
  const { selectedCompanyId } = useCompanyContext();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [items, setItems] = useState<UnifiedComplianceItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filters, setFilters] = useState<UnifiedFilters>(EMPTY_UNIFIED_FILTERS);
  const [showNewForm, setShowNewForm] = useState(false);
  const [checkingRules, setCheckingRules] = useState(false);

  // The header company switcher sets the default scope here too — same
  // "re-assert on change, browse freely in between" rule as the other pages.
  useEffect(() => {
    setFilters((f) => ({ ...f, companyId: selectedCompanyId ?? "all" }));
  }, [selectedCompanyId]);

  useEffect(() => {
    listWorkspacesFn()
      .then((rows) => setWorkspace(rows[0] ?? null))
      .catch(() => setWorkspace(null));
  }, []);

  function loadItems() {
    if (!workspace) return;
    setLoadError(false);
    Promise.all([
      listComplianceItemsFn({ data: workspace.id }),
      listComplianceObligationsFn({ data: workspace.id }),
      listCompaniesFn({ data: workspace.id }),
    ])
      .then(([matterItems, obligations, companyRows]) => {
        const unified = [
          ...matterItems.map(matterItemToUnified).filter((x): x is UnifiedComplianceItem => x !== null),
          ...obligations.map(obligationToUnified),
        ];
        setItems(unified);
        setCompanies(companyRows);
      })
      .catch(() => {
        setLoadError(true);
        toast.error("Could not load the compliance center");
      });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the workspace id changes
  useEffect(loadItems, [workspace?.id]);

  const counts = useMemo(() => {
    const c = { ...EMPTY_COUNTS };
    for (const item of items ?? []) c[item.status] += 1;
    return c;
  }, [items]);

  const configurationRequiredCount = useMemo(
    () => (items ?? []).filter((i) => i.configurationRequired).length,
    [items],
  );

  const thisMonthCount = useMemo(() => {
    const today = todayISO();
    const monthPrefix = today.slice(0, 7);
    return (items ?? []).filter((i) => i.dueDate?.startsWith(monthPrefix) && i.status !== "completed").length;
  }, [items]);

  const next30Count = useMemo(() => {
    const today = todayISO();
    const cutoff = addDaysISO(today, 30) ?? today;
    return (items ?? []).filter((i) => i.dueDate && i.dueDate >= today && i.dueDate <= cutoff && i.status !== "completed")
      .length;
  }, [items]);

  const companyOptions = useMemo<[string, string][]>(() => companies.map((c) => [c.id, c.name]), [companies]);

  const filtered = useMemo(() => {
    const rows = filterUnifiedItems(items ?? [], filters);
    return [...rows].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
  }, [items, filters]);

  async function checkRequirements() {
    if (!workspace) return;
    setCheckingRules(true);
    try {
      const { created } = await evaluateRulesForWorkspaceFn({ data: workspace.id });
      toast.success(created > 0 ? `Generated ${created} obligation${created === 1 ? "" : "s"}` : "Everything's up to date");
      loadItems();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not check requirements");
    } finally {
      setCheckingRules(false);
    }
  }

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">{workspace.name}</p>
          <h1 className="font-display text-3xl">Compliance center</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            What corporate/legal things do you need to do this month? Every SECP/FBR filing and every other
            compliance obligation across your companies, in one place. A deadline is only ever shown once it's been
            computed from a saved matter or a rule a human has verified — see "Configuration required" below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={checkingRules} onClick={checkRequirements}>
            <RefreshCw className={`size-4 ${checkingRules ? "animate-spin" : ""}`} strokeWidth={1.75} />
            Check requirements
          </Button>
          <Button type="button" onClick={() => setShowNewForm((v) => !v)}>
            <Plus className="size-4" strokeWidth={1.75} />
            New obligation
          </Button>
        </div>
      </div>

      {showNewForm && (
        <NewObligationForm
          companies={companyOptions}
          onCreated={() => {
            setShowNewForm(false);
            loadItems();
          }}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      <ComplianceDashboardTiles
        counts={counts}
        configurationRequiredCount={configurationRequiredCount}
        thisMonthCount={thisMonthCount}
        next30Count={next30Count}
        active={filters.status}
        onSelect={(status) => setFilters((f) => ({ ...f, status }))}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <UnifiedFilterBar filters={filters} onChange={setFilters} companies={companyOptions} />
        <div className="flex gap-2">
          <Link
            to="/compliance/calendar"
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-border px-4 text-sm font-medium text-muted hover:bg-bg"
          >
            <CalendarDays className="size-4" strokeWidth={1.75} />
            Calendar
          </Link>
          <Link
            to="/compliance/rules"
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-border px-4 text-sm font-medium text-muted hover:bg-bg"
          >
            <Settings2 className="size-4" strokeWidth={1.75} />
            Rules
          </Link>
        </div>
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
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-border py-10 text-center">
          <ListChecks className="size-8 text-muted" strokeWidth={1.5} />
          <p className="text-sm font-medium">No compliance obligations yet</p>
          <p className="max-w-sm text-xs text-muted">
            Create one manually, or run "Check requirements" once a compliance rule has been configured and verified.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">Nothing matches these filters.</p>
      ) : (
        <UnifiedComplianceList items={filtered} />
      )}
    </div>
  );
}
