import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import { useCompanyContext } from "@/lib/legalpak/company-context";
import { cn } from "@/lib/cn";

/**
 * Global "which company" control, rendered in the app header. Selecting a
 * company here becomes the default scope every company-aware page (Dashboard,
 * Compliance, Documents, Tax, Contracts, AI Counsel) reads on mount and
 * whenever this changes — see useCompanyContext().
 */
export function CompanySwitcher() {
  const { companies, loading, selectedCompany, selectedCompanyId, setSelectedCompanyId } = useCompanyContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (loading) return null;

  if (companies.length === 0) {
    return (
      <Link
        to="/companies/new"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-primary-fg/25 px-3 text-sm font-medium text-primary-fg hover:bg-primary-fg/10"
      >
        <Plus className="size-4" strokeWidth={1.75} />
        Add company
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex min-h-9 max-w-48 items-center gap-1.5 rounded-[var(--radius-sm)] border border-primary-fg/25 px-3 text-sm font-medium text-primary-fg hover:bg-primary-fg/10"
      >
        <Building2 className="size-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate">{selectedCompany?.name ?? "All companies"}</span>
        <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")} strokeWidth={1.75} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-64 rounded-[var(--radius-md)] border border-border bg-surface py-1.5 text-fg shadow-lg sm:left-0 sm:right-auto"
        >
          <button
            type="button"
            role="option"
            aria-selected={selectedCompanyId === null}
            onClick={() => {
              setSelectedCompanyId(null);
              setOpen(false);
            }}
            className="flex min-h-10 w-full items-center gap-2 px-3 text-sm hover:bg-bg"
          >
            <span className="size-4 shrink-0">{selectedCompanyId === null && <Check className="size-4 text-accent" strokeWidth={2} />}</span>
            All companies
          </button>
          <div className="my-1 border-t border-border" />
          {companies.map((c) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={selectedCompanyId === c.id}
              onClick={() => {
                setSelectedCompanyId(c.id);
                setOpen(false);
              }}
              className="flex min-h-10 w-full items-center gap-2 px-3 text-left text-sm hover:bg-bg"
            >
              <span className="size-4 shrink-0">
                {selectedCompanyId === c.id && <Check className="size-4 text-accent" strokeWidth={2} />}
              </span>
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
            </button>
          ))}
          <div className="my-1 border-t border-border" />
          <Link
            to="/companies/new"
            onClick={() => setOpen(false)}
            className="flex min-h-10 items-center gap-2 px-3 text-sm font-medium text-accent hover:bg-bg"
          >
            <Plus className="size-4" strokeWidth={1.75} />
            New company
          </Link>
          <Link
            to="/companies"
            onClick={() => setOpen(false)}
            className="flex min-h-10 items-center gap-2 px-3 text-sm text-muted hover:bg-bg"
          >
            Manage companies →
          </Link>
        </div>
      )}
    </div>
  );
}
