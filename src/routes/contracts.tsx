import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Home,
  Landmark,
  Search,
  Send,
  Stamp,
  Users,
} from "lucide-react";
import { RequireSubscription } from "@/components/billing/RequireSubscription";
import {
  CONTRACT_CATEGORIES,
  CONTRACT_CATEGORY_LABEL,
  CONTRACT_TYPES,
  searchContractTypes,
  type ContractCategory,
} from "@/lib/legal/contracts";

export const Route = createFileRoute("/contracts")({
  component: () => (
    <RequireSubscription>
      <ContractLibraryPage />
    </RequireSubscription>
  ),
  head: () => ({
    meta: [
      { title: "Contracts — LegalPak" },
      {
        name: "description",
        content:
          "Browse and draft NDAs, service, vendor, employment, lease, loan, shareholders', power of attorney and other agreements under Pakistan's Contract Act 1872 — with risk flags, clause explanations and a Draft → Review → Final → Signed workflow.",
      },
    ],
  }),
});

const CATEGORY_ICON: Record<ContractCategory, typeof Briefcase> = {
  commercial: Briefcase,
  employment: Users,
  corporate: Building2,
  property: Home,
  finance: Landmark,
  authority: Stamp,
  notices: Send,
};

function ContractLibraryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ContractCategory | "all">("all");

  const results = useMemo(() => {
    const base = query.trim() ? searchContractTypes(query) : CONTRACT_TYPES;
    return category === "all" ? base : base.filter((t) => t.category === category);
  }, [query, category]);

  const grouped = useMemo(() => {
    const map = new Map<ContractCategory, typeof CONTRACT_TYPES>();
    for (const t of results) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return CONTRACT_CATEGORIES.filter((c) => map.has(c)).map((c) => ({ category: c, items: map.get(c)! }));
  }, [results]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Contract Act 1872
        </p>
        <h1 className="font-display text-3xl">Contract library</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {CONTRACT_TYPES.length} agreement, authority and notice types — each with a smart
          questionnaire, live risk flags, clause-by-clause explanations, and a
          Draft → Review → Final → Signed workflow once you save it to your workspace.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            strokeWidth={1.75}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search — e.g. NDA, bayana, cheque, tenancy, shareholders…"
            className="w-full min-h-11 rounded-[var(--radius-sm)] border border-border bg-bg py-2 pl-10 pr-3 text-sm text-fg outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            category === "all" ? "border-primary bg-primary text-primary-fg" : "border-border text-muted"
          }`}
        >
          All
        </button>
        {CONTRACT_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              category === c ? "border-primary bg-primary text-primary-fg" : "border-border text-muted"
            }`}
          >
            {CONTRACT_CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
          Nothing matches "{query}" — try a different term or clear the search.
        </p>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ category: cat, items }) => {
            const Icon = CATEGORY_ICON[cat];
            return (
              <section key={cat}>
                <h2 className="flex items-center gap-2 font-display text-xl">
                  <Icon className="size-5 text-accent" strokeWidth={1.75} />
                  {CONTRACT_CATEGORY_LABEL[cat]}
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((t) =>
                    t.externalRoute ? (
                      <Link
                        key={t.id}
                        to={t.externalRoute}
                        className="group flex flex-col justify-between rounded-[var(--radius-md)] border border-border bg-surface p-4 hover:border-accent"
                      >
                        <div>
                          <p className="font-medium">{t.title}</p>
                          <p className="mt-1 text-sm text-muted">{t.description}</p>
                        </div>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent">
                          Open Legal Notices <ArrowRight className="size-3.5" strokeWidth={2} />
                        </span>
                      </Link>
                    ) : (
                      <Link
                        key={t.id}
                        to="/contracts/$typeId"
                        params={{ typeId: t.id }}
                        className="group flex flex-col justify-between rounded-[var(--radius-md)] border border-border bg-surface p-4 hover:border-accent"
                      >
                        <div>
                          <p className="font-medium">{t.title}</p>
                          <p className="mt-1 text-sm text-muted">{t.description}</p>
                        </div>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent">
                          Start drafting <ArrowRight className="size-3.5" strokeWidth={2} />
                        </span>
                      </Link>
                    ),
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
