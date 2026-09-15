import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, FolderInput } from "lucide-react";
import { RequireSubscription } from "@/components/billing/RequireSubscription";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import {
  ContractWorkspace,
  emptyContractDraft,
  normalizeContractDraft,
  type ContractDraftState,
} from "@/components/contracts/contract-workspace";
import { usePersistedState } from "@/lib/use-persisted-state";
import { CONTRACT_CATEGORY_LABEL, contractType } from "@/lib/legal/contracts";
import { listWorkspacesFn, type Workspace } from "@/lib/legalpak/workspaces";
import { listCompaniesFn, type Company } from "@/lib/legalpak/companies";
import { createMatterFn } from "@/lib/legalpak/matters";

export const Route = createFileRoute("/contracts_/$typeId")({
  component: () => (
    <RequireSubscription>
      <ContractDraftPage />
    </RequireSubscription>
  ),
  head: () => ({
    meta: [{ title: "Draft a contract — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function ContractDraftPage() {
  const { typeId } = useParams({ from: "/contracts_/$typeId" });
  const type = contractType(typeId);

  if (!type || type.externalRoute) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">That contract type wasn't found.</p>
        <Link to="/contracts" className="text-sm font-medium text-accent underline">
          ← Back to the contract library
        </Link>
      </div>
    );
  }

  return <ContractDraftBody typeId={typeId} title={type.title} category={type.category} description={type.description} />;
}

function ContractDraftBody({
  typeId,
  title,
  category,
  description,
}: {
  typeId: string;
  title: string;
  category: keyof typeof CONTRACT_CATEGORY_LABEL;
  description: string;
}) {
  const navigate = useNavigate();
  const [draft, setDraft] = usePersistedState<ContractDraftState>(
    `legalpak:contracts:${typeId}`,
    emptyContractDraft(),
  );
  const state = normalizeContractDraft(draft);

  const [workspace, setWorkspace] = useState<Workspace | null | undefined>(undefined);
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listWorkspacesFn()
      .then(async (rows: Workspace[]) => {
        const ws = rows[0] ?? null;
        if (cancelled) return;
        setWorkspace(ws);
        if (!ws) {
          setCompanies([]);
          return;
        }
        const rows2 = await listCompaniesFn({ data: ws.id });
        if (cancelled) return;
        setCompanies(rows2);
        if (rows2[0]) setCompanyId(rows2[0].id);
      })
      .catch(() => {
        if (!cancelled) {
          setWorkspace(null);
          setCompanies([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function onChange(updater: (s: ContractDraftState) => ContractDraftState) {
    setDraft((s) => updater(normalizeContractDraft(s)));
  }

  function reset() {
    setDraft(emptyContractDraft());
    toast.success("Cleared — draft removed from this browser");
  }

  async function saveToWorkspace() {
    if (!companyId) {
      toast.error("Pick a company first");
      return;
    }
    setSaving(true);
    try {
      const matter = await createMatterFn({
        data: {
          companyId,
          type: "CONTRACT",
          title: `${title} — ${state.a || state.b || "Untitled"}`,
          data: { contractTypeId: typeId, ...state } as Record<string, unknown>,
        },
      });
      toast.success("Saved to your workspace");
      navigate({ to: "/matters/$matterId", params: { matterId: matter.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save this contract");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/contracts"
          className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-muted underline"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2} />
          Contract library
        </Link>
        <p className="mt-2 text-xs font-medium uppercase tracking-widest text-muted">
          {CONTRACT_CATEGORY_LABEL[category]}
        </p>
        <h1 className="font-display text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
      </div>

      <ContractWorkspace
        typeId={typeId}
        state={state}
        onChange={onChange}
        actionsSlot={
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-lg">
              <FolderInput className="size-5 text-accent" strokeWidth={1.75} />
              Save to workspace
            </h2>
            <p className="mt-1 text-xs text-muted">
              This draft only lives in this browser until you save it. Saving unlocks version
              history, client review links, attorney review requests, and the
              Draft → Review → Final → Signed workflow.
            </p>

            {workspace === undefined || companies === null ? (
              <p className="mt-3 text-sm text-muted">Loading your workspace…</p>
            ) : !workspace ? (
              <p className="mt-3 text-sm text-muted">
                You'll need a workspace first.{" "}
                <Link to="/dashboard" className="text-accent underline">
                  Create one from the dashboard
                </Link>
                .
              </p>
            ) : companies.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Add a company first.{" "}
                <Link to="/companies/new" className="text-accent underline">
                  Add a company
                </Link>
                .
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <Field label="Company" className="min-w-[220px]">
                  <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button type="button" disabled={saving} onClick={saveToWorkspace}>
                  {saving ? "Saving…" : "Save to workspace"}
                </Button>
              </div>
            )}

            <Button type="button" variant="ghost" className="mt-3" onClick={reset}>
              Clear this draft
            </Button>
          </section>
        }
      />
    </div>
  );
}
