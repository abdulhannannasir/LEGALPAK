import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FolderOpen } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useCompanyContext } from "@/lib/legalpak/company-context";
import { DocumentVault } from "@/components/document-vault";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/documents")({
  component: DocumentsPage,
  head: () => ({
    meta: [
      { title: "Document Vault — LegalPak" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Every document across your companies — corporate records, SECP filings, tax, contracts, and legal notices — in one place.",
      },
    ],
  }),
});

function DocumentsPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <DocumentsBody />;
}

function DocumentsBody() {
  const { workspace, companies, selectedCompanyId } = useCompanyContext();
  const [scopeToCompany, setScopeToCompany] = useState(true);

  // Re-scope to the header switcher's choice whenever it changes — a local
  // "All companies" toggle here is a temporary view, not an override.
  useEffect(() => {
    setScopeToCompany(true);
  }, [selectedCompanyId]);

  if (workspace === undefined) return null;

  if (!workspace) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-3xl">Document Vault</h1>
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

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) ?? null;
  const scoped = scopeToCompany && selectedCompany;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">{workspace.name}</p>
        <h1 className="font-display text-3xl">Document Vault</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Every document across every company in this workspace — corporate records, SECP filings,
          tax, contracts, and legal notices. Uploads happen from a company's own page; from here you
          can view, download, rename, replace, or delete anything, and check its version history.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <FolderOpen className="size-4" strokeWidth={1.75} />
          To add a document, open a company page and upload it there — it'll appear here automatically.
        </div>
        {selectedCompany && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setScopeToCompany(true)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                scoped ? "border-primary bg-primary text-primary-fg" : "border-border text-muted",
              )}
            >
              {selectedCompany.name}
            </button>
            <button
              type="button"
              onClick={() => setScopeToCompany(false)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                !scoped ? "border-primary bg-primary text-primary-fg" : "border-border text-muted",
              )}
            >
              All companies
            </button>
          </div>
        )}
      </div>

      {scoped ? (
        <DocumentVault
          key={scoped.id}
          scope={{ type: "company", companyId: scoped.id }}
          title={`${scoped.name} documents`}
        />
      ) : (
        <DocumentVault scope={{ type: "workspace", workspaceId: workspace.id }} title="All documents" />
      )}
    </div>
  );
}
