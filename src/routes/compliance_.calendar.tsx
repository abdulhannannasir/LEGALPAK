import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { RequireSubscription } from "@/components/billing/RequireSubscription";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listWorkspacesFn, type Workspace } from "@/lib/legalpak/workspaces";
import { listCompaniesFn, type Company } from "@/lib/legalpak/companies";
import { listComplianceItemsFn } from "@/lib/legalpak/compliance";
import { listComplianceObligationsFn } from "@/lib/legalpak/compliance-obligations";
import {
  matterItemToUnified,
  obligationToUnified,
  filterUnifiedItems,
  EMPTY_UNIFIED_FILTERS,
  type UnifiedComplianceItem,
  type UnifiedFilters,
} from "@/lib/legalpak/compliance-unified";
import { UnifiedFilterBar } from "@/components/compliance/unified-filter-bar";
import { UnifiedComplianceCalendar } from "@/components/compliance/unified-calendar";

export const Route = createFileRoute("/compliance_/calendar")({
  component: () => (
    <RequireSubscription>
      <ComplianceCalendarPage />
    </RequireSubscription>
  ),
  head: () => ({
    meta: [{ title: "Compliance calendar — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function ComplianceCalendarPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <ComplianceCalendarBody />;
}

function ComplianceCalendarBody() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [items, setItems] = useState<UnifiedComplianceItem[] | null>(null);
  const [filters, setFilters] = useState<UnifiedFilters>(EMPTY_UNIFIED_FILTERS);

  useEffect(() => {
    listWorkspacesFn()
      .then((rows) => setWorkspace(rows[0] ?? null))
      .catch(() => setWorkspace(null));
  }, []);

  useEffect(() => {
    if (!workspace) return;
    Promise.all([
      listComplianceItemsFn({ data: workspace.id }),
      listComplianceObligationsFn({ data: workspace.id }),
      listCompaniesFn({ data: workspace.id }),
    ])
      .then(([matterItems, obligations, companyRows]) => {
        setItems([
          ...matterItems.map(matterItemToUnified).filter((x): x is UnifiedComplianceItem => x !== null),
          ...obligations.map(obligationToUnified),
        ]);
        setCompanies(companyRows);
      })
      .catch(() => toast.error("Could not load the compliance calendar"));
  }, [workspace]);

  const companyOptions = useMemo<[string, string][]>(() => companies.map((c) => [c.id, c.name]), [companies]);
  const filtered = useMemo(() => filterUnifiedItems(items ?? [], filters), [items, filters]);

  if (!workspace) return null;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/compliance" className="text-xs font-medium uppercase tracking-widest text-muted underline">
          <ArrowLeft className="mr-1 inline size-3" strokeWidth={1.75} />
          Compliance center
        </Link>
        <h1 className="mt-1 font-display text-3xl">Compliance calendar</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Every scheduled compliance deadline this month and beyond, across all your companies.
        </p>
      </div>

      <UnifiedFilterBar filters={filters} onChange={setFilters} companies={companyOptions} />

      {items === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <UnifiedComplianceCalendar items={filtered} />
      )}
    </div>
  );
}
