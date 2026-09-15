import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FolderOpen } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listWorkspacesFn, type Workspace } from "@/lib/legalpak/workspaces";
import { DocumentVault } from "@/components/document-vault";

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
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    listWorkspacesFn()
      .then((rows) => setWorkspace(rows[0] ?? null))
      .catch(() => setWorkspace(null))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

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

      <div className="flex items-center gap-2 text-sm text-muted">
        <FolderOpen className="size-4" strokeWidth={1.75} />
        To add a document, open a company page and upload it there — it'll appear here automatically.
      </div>
      <DocumentVault scope={{ type: "workspace", workspaceId: workspace.id }} title="All documents" />
    </div>
  );
}
