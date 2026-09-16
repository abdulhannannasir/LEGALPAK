import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Landmark } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useCompanyContext } from "@/lib/legalpak/company-context";
import { listWorkspaceMattersFn, type MatterWithCompany } from "@/lib/legalpak/matters";
import { STATUS_LABEL } from "@/lib/legalpak/workflow";
import { formatDateLong } from "@/lib/legal/accounts";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/tax/")({
  component: TaxHubPage,
  head: () => ({
    meta: [
      { title: "Tax — LegalPak" },
      {
        name: "description",
        content: "FBR income tax filing guidance and income tax matters for your Pakistani companies, in one place.",
      },
    ],
  }),
});

function TaxHubPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <TaxHubBody />;
}

function TaxHubBody() {
  const { workspace, selectedCompanyId, selectedCompany } = useCompanyContext();
  const [matters, setMatters] = useState<MatterWithCompany[] | null>(null);
  const [scopeToCompany, setScopeToCompany] = useState(true);

  useEffect(() => {
    setScopeToCompany(true);
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!workspace) return;
    listWorkspaceMattersFn({ data: workspace.id })
      .then(setMatters)
      .catch(() => setMatters([]));
  }, [workspace]);

  const taxMatters = useMemo(() => {
    const all = (matters ?? []).filter((m) => m.type === "INCOME_TAX_RETURN");
    if (scopeToCompany && selectedCompanyId) return all.filter((m) => m.company_id === selectedCompanyId);
    return all;
  }, [matters, scopeToCompany, selectedCompanyId]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Tax</p>
        <h1 className="font-display mt-1 text-3xl md:text-4xl">FBR income tax</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Guidance for what needs filing with FBR, and every income tax matter open across your
          companies.
        </p>
      </div>

      <Link
        to="/tax-assistant"
        className="group flex flex-col justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-colors hover:border-accent sm:max-w-md"
      >
        <div>
          <Landmark className="size-5 text-accent" strokeWidth={1.75} />
          <h2 className="mt-3 font-display text-xl">FBR Assistant</h2>
          <p className="mt-1 text-sm text-muted">
            A deterministic decision tree for what needs filing — not a guess.
          </p>
        </div>
        <span className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
          Open <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-xl">Income tax matters</h2>
          {selectedCompany && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScopeToCompany(true)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  scopeToCompany ? "border-primary bg-primary text-primary-fg" : "border-border text-muted",
                )}
              >
                {selectedCompany.name}
              </button>
              <button
                type="button"
                onClick={() => setScopeToCompany(false)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  !scopeToCompany ? "border-primary bg-primary text-primary-fg" : "border-border text-muted",
                )}
              >
                All companies
              </button>
            </div>
          )}
        </div>
        {!workspace ? (
          <p className="mt-3 text-sm text-muted">
            Create a workspace on the{" "}
            <Link to="/dashboard" className="underline">
              dashboard
            </Link>{" "}
            first.
          </p>
        ) : matters === null ? (
          <div className="mt-3 space-y-2" aria-hidden="true">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-[var(--radius-md)] border border-border bg-surface" />
            ))}
          </div>
        ) : taxMatters.length === 0 ? (
          <p className="mt-3 rounded-[var(--radius-md)] border border-dashed border-border bg-surface p-5 text-sm text-muted">
            No income tax matters yet — start one from a company page.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {taxMatters.map((m) => (
              <Link
                key={m.id}
                to="/matters/$matterId"
                params={{ matterId: m.id }}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 hover:border-accent"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted">{m.company_name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium",
                      m.status === "closed" || m.status === "filed"
                        ? "border-success text-success"
                        : "border-border text-muted",
                    )}
                  >
                    {STATUS_LABEL[m.status]}
                  </span>
                  {m.due_date && <span className="text-xs text-muted">{formatDateLong(m.due_date)}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
