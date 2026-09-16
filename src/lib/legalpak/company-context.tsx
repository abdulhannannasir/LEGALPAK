import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { listWorkspacesFn, type Workspace } from "./workspaces";
import { listCompaniesFn, type Company } from "./companies";

/**
 * The single "which company am I looking at" selection, shared across the
 * whole functional app shell — the header's CompanySwitcher writes it, and
 * every company-aware page (Dashboard, Compliance, Documents, Tax, Contracts,
 * AI Counsel) reads it as the default scope for its own data. Persisted per
 * workspace in localStorage so a reload doesn't lose the selection.
 */
type CompanyContextValue = {
  /** `undefined` while the workspace is still loading; `null` once loaded and confirmed there isn't one yet. */
  workspace: Workspace | null | undefined;
  companies: Company[];
  loading: boolean;
  selectedCompanyId: string | null;
  selectedCompany: Company | null;
  setSelectedCompanyId: (id: string | null) => void;
  refresh: () => void;
  /** Re-fetches the workspace itself — call after creating one so the header switcher picks it up without a full reload. */
  refreshWorkspace: () => void;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);

function storageKey(workspaceId: string): string {
  return `legalpak:selected-company:${workspaceId}`;
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null | undefined>(undefined);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoaded, setCompaniesLoaded] = useState(false);
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(null);

  function refreshWorkspace() {
    listWorkspacesFn()
      .then((rows) => setWorkspace(rows[0] ?? null))
      .catch(() => setWorkspace(null));
  }

  useEffect(refreshWorkspace, []);

  function refresh() {
    if (!workspace) return;
    listCompaniesFn({ data: workspace.id })
      .then(setCompanies)
      .catch(() => setCompanies([]))
      .finally(() => setCompaniesLoaded(true));
  }

  useEffect(() => {
    if (!workspace) return;
    refresh();
    try {
      const raw = window.localStorage.getItem(storageKey(workspace.id));
      if (raw) setSelectedCompanyIdState(raw);
    } catch {
      // storage unavailable — selection just won't persist across reloads
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the workspace id changes
  }, [workspace?.id]);

  // A persisted id that no longer refers to a real (active) company — deleted or archived elsewhere — falls back to "all".
  useEffect(() => {
    if (!companiesLoaded) return;
    if (selectedCompanyId && !companies.some((c) => c.id === selectedCompanyId)) {
      setSelectedCompanyId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-check when the company list changes
  }, [companiesLoaded, companies]);

  function setSelectedCompanyId(id: string | null) {
    setSelectedCompanyIdState(id);
    if (!workspace) return;
    try {
      if (id) window.localStorage.setItem(storageKey(workspace.id), id);
      else window.localStorage.removeItem(storageKey(workspace.id));
    } catch {
      // storage unavailable — selection just won't persist across reloads
    }
  }

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId],
  );

  return (
    <CompanyContext.Provider
      value={{
        workspace,
        companies,
        loading: !companiesLoaded,
        selectedCompanyId,
        selectedCompany,
        setSelectedCompanyId,
        refresh,
        refreshWorkspace,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext(): CompanyContextValue {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompanyContext must be used within a CompanyProvider");
  return ctx;
}
