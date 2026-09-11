import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, Landmark, Pencil, Plus, Scale, Users } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getCompanyFn, type Company } from "@/lib/legalpak/companies";
import { listMattersFn, createMatterFn, type Matter } from "@/lib/legalpak/matters";
import { MATTER_TYPE_LABEL, STATUS_LABEL, type MatterType } from "@/lib/legalpak/workflow";
import { Button } from "@/components/ui/button";
import { DocumentVault } from "@/components/document-vault";
import { formatDateLong, pkr } from "@/lib/legal/accounts";

export const Route = createFileRoute("/companies/$companyId")({
  component: CompanyPage,
  head: () => ({
    meta: [{ title: "Company — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

const MATTER_KINDS: { type: MatterType; icon: typeof FileSpreadsheet }[] = [
  { type: "FINANCIAL_STATEMENTS", icon: FileSpreadsheet },
  { type: "FORM_A", icon: FileText },
  { type: "FORM_9", icon: Users },
  { type: "CONTRACT", icon: Scale },
  { type: "INCOME_TAX_RETURN", icon: Landmark },
];

function CompanyPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <CompanyBody />;
}

function CompanyBody() {
  const { companyId } = useParams({ from: "/companies/$companyId" });
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<MatterType | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([getCompanyFn({ data: companyId }), listMattersFn({ data: companyId })]);
      setCompany(c);
      setMatters(m);
    } catch {
      toast.error("Could not load this company");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  async function newMatter(type: MatterType) {
    setCreating(type);
    try {
      const matter = await createMatterFn({
        data: { companyId, type, title: `${MATTER_TYPE_LABEL[type]} — ${company?.name ?? ""}` },
      });
      navigate({ to: "/matters/$matterId", params: { matterId: matter.id } });
    } catch {
      toast.error("Could not create matter");
    } finally {
      setCreating(null);
    }
  }

  if (loading) return null;
  if (!company) return <p className="text-sm text-muted">Company not found.</p>;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/dashboard" className="text-xs font-medium uppercase tracking-widest text-muted underline">
          ← Companies
        </Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl">{company.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {company.cuin ? `CUIN ${company.cuin}` : "No CUIN on file"}
              {company.ntn ? ` · NTN ${company.ntn}` : ""}
            </p>
          </div>
          <Link
            to="/companies/$companyId/edit"
            params={{ companyId }}
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm font-medium hover:border-accent"
          >
            <Pencil className="size-4" strokeWidth={1.75} />
            Edit company
          </Link>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Paid-up capital</dt>
            <dd className="font-medium">
              {company.paid_up_capital ? pkr(Number(company.paid_up_capital)) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Financial year end</dt>
            <dd className="font-medium">
              {company.financial_year_end ? formatDateLong(company.financial_year_end) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">AGM date</dt>
            <dd className="font-medium">{company.agm_date ? formatDateLong(company.agm_date) : "—"}</dd>
          </div>
        </dl>
      </div>

      <section>
        <h2 className="font-display text-xl">Start a matter</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MATTER_KINDS.map(({ type, icon: Icon }) => (
            <Button
              key={type}
              type="button"
              variant="secondary"
              disabled={creating !== null}
              onClick={() => newMatter(type)}
              className="h-auto flex-col items-start gap-2 whitespace-normal p-4 text-left"
            >
              <Icon className="size-5 text-accent" strokeWidth={1.75} />
              <span className="font-medium">
                {creating === type ? "Creating…" : MATTER_TYPE_LABEL[type]}
              </span>
              <Plus className="size-4 self-end text-muted" strokeWidth={1.75} />
            </Button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          Registered office changed, or need to declare beneficial owners?{" "}
          <Link to="/corporate-filings" className="text-accent underline">
            Form 21 & Form 45
          </Link>
          . Chasing a dishonoured cheque or overdue invoice?{" "}
          <Link to="/notices" className="text-accent underline">
            Legal Notices
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl">Matters</h2>
        {matters.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No matters yet — start one above.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {matters.map((m) => (
              <Link
                key={m.id}
                to="/matters/$matterId"
                params={{ matterId: m.id }}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 hover:border-accent"
              >
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted">
                    {MATTER_TYPE_LABEL[m.type]}
                    {m.due_date ? ` · due ${m.due_date}` : ""}
                  </p>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
                  {STATUS_LABEL[m.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <DocumentVault companyId={companyId} />
    </div>
  );
}
