import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Pencil } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  archiveCompanyFn,
  getCompanyFn,
  registrationStatus,
  restoreCompanyFn,
  COMPANY_TYPE_LABEL,
  type Company,
} from "@/lib/legalpak/companies";
import { useCompanyContext } from "@/lib/legalpak/company-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/companies/$companyId_/settings")({
  component: CompanySettingsPage,
  head: () => ({
    meta: [{ title: "Company settings — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function CompanySettingsPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <CompanySettingsBody />;
}

function CompanySettingsBody() {
  const { companyId } = useParams({ from: "/companies/$companyId_/settings" });
  const { refresh: refreshSwitcher, selectedCompanyId, setSelectedCompanyId } = useCompanyContext();
  const [company, setCompany] = useState<Company | null>(null);
  const [working, setWorking] = useState(false);

  function load() {
    getCompanyFn({ data: companyId })
      .then(setCompany)
      .catch(() => toast.error("Could not load this company"));
  }

  useEffect(load, [companyId]);

  async function toggleArchive() {
    if (!company) return;
    const archiving = company.status === "active";
    if (archiving && !window.confirm(`Archive "${company.name}"? You can restore it any time — nothing is deleted.`)) {
      return;
    }
    setWorking(true);
    try {
      const updated = archiving ? await archiveCompanyFn({ data: companyId }) : await restoreCompanyFn({ data: companyId });
      setCompany(updated);
      refreshSwitcher();
      if (archiving && selectedCompanyId === companyId) setSelectedCompanyId(null);
      toast.success(archiving ? "Company archived" : "Company restored");
    } catch {
      toast.error("Could not update this company's status");
    } finally {
      setWorking(false);
    }
  }

  if (!company) return null;

  const reg = registrationStatus(company);
  const archived = company.status === "archived";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to="/companies/$companyId"
          params={{ companyId }}
          className="text-xs font-medium uppercase tracking-widest text-muted underline"
        >
          ← Back to {company.name}
        </Link>
        <h1 className="mt-1 font-display text-3xl">Company settings</h1>
      </div>

      <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Overview</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Company name</dt>
            <dd className="mt-0.5 text-sm font-medium">{company.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Company type</dt>
            <dd className="mt-0.5 text-sm font-medium">
              {(company.company_type && COMPANY_TYPE_LABEL[company.company_type as keyof typeof COMPANY_TYPE_LABEL]) ||
                company.company_type ||
                "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Registration status</dt>
            <dd className="mt-0.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  reg.tone === "success" ? "border-success text-success" : "border-warn text-warn",
                )}
              >
                {reg.label}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Record status</dt>
            <dd className="mt-0.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  archived ? "border-muted text-muted" : "border-success text-success",
                )}
              >
                {archived ? "Archived" : "Active"}
              </span>
            </dd>
          </div>
        </dl>
        <Link
          to="/companies/$companyId/edit"
          params={{ companyId }}
          className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-border px-4 text-sm font-medium hover:border-accent"
        >
          <Pencil className="size-4" strokeWidth={1.75} />
          Edit company profile
        </Link>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-danger/40 bg-surface p-5">
        <h2 className="font-display text-lg">Danger zone</h2>
        {archived ? (
          <>
            <p className="text-sm text-muted">
              This company is archived — it's hidden from the company switcher and matter-creation pickers, but
              nothing was deleted. Restore it to use it again.
            </p>
            <Button type="button" variant="secondary" onClick={toggleArchive} disabled={working}>
              <ArchiveRestore className="size-4" strokeWidth={1.75} />
              {working ? "Restoring…" : "Restore company"}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">
              Archiving hides this company from the switcher and "start a matter" pickers. Its matters, documents
              and history stay exactly as they are, and you can restore it any time.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={toggleArchive}
              disabled={working}
              className="border-danger text-danger hover:bg-flag-high"
            >
              <Archive className="size-4" strokeWidth={1.75} />
              {working ? "Archiving…" : "Archive company"}
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
