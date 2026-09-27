import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getCompanyFn, type Company } from "@/lib/legalpak/companies";
import { DocumentVault } from "@/components/document-vault";
import { ActivityTimeline } from "@/components/activity-timeline";

export const Route = createFileRoute("/companies/$companyId_/documents")({
  component: CompanyDocumentsPage,
  head: () => ({
    meta: [
      { title: "Documents — LegalPak" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Every document for this company — corporate records, SECP filings, directors, shareholders, contracts, tax and employment paperwork — with versioning, linking and search.",
      },
    ],
  }),
});

function CompanyDocumentsPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <CompanyDocumentsBody />;
}

function CompanyDocumentsBody() {
  const { companyId } = useParams({ from: "/companies/$companyId_/documents" });
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompanyFn({ data: companyId })
      .then(setCompany)
      .catch(() => toast.error("Could not load this company"))
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading) return null;
  if (!company) return <p className="text-sm text-muted">Company not found.</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/companies/$companyId"
          params={{ companyId }}
          className="text-xs font-medium uppercase tracking-widest text-muted underline"
        >
          ← {company.name}
        </Link>
        <h1 className="mt-1 font-display text-3xl">Document Vault</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Every document for {company.name} — corporate records, SECP filings, directors, shareholders,
          contracts, tax and employment paperwork — in one place. Categorize, search, version, and link
          a document straight to the compliance obligation or contract it belongs to.
        </p>
      </div>

      <DocumentVault scope={{ type: "company", companyId }} title="All documents" />
      <ActivityTimeline companyId={companyId} title="Document activity" />
    </div>
  );
}
