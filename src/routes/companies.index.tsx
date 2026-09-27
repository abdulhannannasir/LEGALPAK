import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, Plus } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listCompaniesFn, registrationStatus, COMPANY_TYPE_LABEL, type Company } from "@/lib/legalpak/companies";
import { useCompanyContext } from "@/lib/legalpak/company-context";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/companies/")({
  component: CompaniesPage,
  head: () => ({
    meta: [{ title: "Companies — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function CompaniesPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <CompaniesBody />;
}

type StatusFilter = "active" | "archived" | "all";

function CompaniesBody() {
  const { workspace } = useCompanyContext();
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

  useEffect(() => {
    if (!workspace) return;
    listCompaniesFn({ data: { workspaceId: workspace.id, includeArchived: true } })
      .then(setCompanies)
      .catch(() => {
        setCompanies([]);
        toast.error("Could not load companies");
      });
  }, [workspace]);

  const filtered = useMemo(() => {
    if (!companies) return null;
    if (statusFilter === "all") return companies;
    return companies.filter((c) => c.status === statusFilter);
  }, [companies, statusFilter]);

  const archivedCount = useMemo(() => (companies ?? []).filter((c) => c.status === "archived").length, [companies]);

  if (workspace === undefined) return null;

  if (!workspace) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-3xl">Companies</h1>
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">{workspace.name}</p>
          <h1 className="font-display text-3xl">Companies</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Every Pakistani company registered in this workspace — profile, CUIN/NTN, filings and
            documents live on each company's own page.
          </p>
        </div>
        <Link
          to="/companies/new"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-accent"
        >
          <Plus className="size-4" strokeWidth={1.75} />
          New company
        </Link>
      </div>

      {companies !== null && companies.length > 0 && (
        <div className="flex gap-2">
          {(
            [
              { id: "active", label: "Active" },
              { id: "archived", label: `Archived${archivedCount > 0 ? ` (${archivedCount})` : ""}` },
              { id: "all", label: "All" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatusFilter(t.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                statusFilter === t.id ? "border-primary bg-primary text-primary-fg" : "border-border text-muted",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {filtered === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface" />
          ))}
        </div>
      ) : filtered.length === 0 && statusFilter === "active" && companies?.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center">
          <Building2 className="mx-auto size-6 text-muted" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-muted">
            No companies yet. Add one to start SECP filings, compliance tracking, contracts and
            documents.
          </p>
          <Link
            to="/companies/new"
            className="mt-4 inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-primary px-4 text-sm font-medium text-primary-fg"
          >
            Add your first company
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
          No {statusFilter === "all" ? "" : statusFilter} companies.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const status = registrationStatus(c);
            return (
              <Link
                key={c.id}
                to="/companies/$companyId"
                params={{ companyId: c.id }}
                className={cn(
                  "flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-colors hover:border-accent",
                  c.status === "archived" && "opacity-70",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <Building2 className="size-5 text-accent" strokeWidth={1.75} />
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {c.status === "archived" && (
                      <span className="shrink-0 rounded-full border border-muted px-2.5 py-0.5 text-[11px] font-medium text-muted">
                        Archived
                      </span>
                    )}
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                        status.tone === "success" ? "border-success text-success" : "border-warn text-warn",
                      )}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
                <h2 className="mt-3 truncate font-display text-lg">{c.name}</h2>
                <p className="mt-1 text-xs text-muted">
                  {(c.company_type && COMPANY_TYPE_LABEL[c.company_type as keyof typeof COMPANY_TYPE_LABEL]) ||
                    c.company_type ||
                    "—"}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-3 text-xs">
                  <div>
                    <dt className="text-muted">CUIN</dt>
                    <dd className="mt-0.5 truncate font-medium">{c.cuin || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">NTN</dt>
                    <dd className="mt-0.5 truncate font-medium">{c.ntn || "—"}</dd>
                  </div>
                </dl>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
