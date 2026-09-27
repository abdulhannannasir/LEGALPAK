import { Select } from "@/components/ui/field";
import { COMPLIANCE_CATEGORIES, COMPLIANCE_CATEGORY_LABEL } from "@/lib/legalpak/compliance-rules";
import {
  COMPLIANCE_OBLIGATION_STATUSES,
  COMPLIANCE_OBLIGATION_STATUS_LABEL,
  COMPLIANCE_PRIORITIES,
  COMPLIANCE_PRIORITY_LABEL,
} from "@/lib/legalpak/compliance-obligations";
import type { UnifiedFilters } from "@/lib/legalpak/compliance-unified";

/** Filters shared by the Compliance Center's list and calendar views: status, category, priority, company and a due-date range. */
export function UnifiedFilterBar({
  filters,
  onChange,
  companies,
}: {
  filters: UnifiedFilters;
  onChange: (next: UnifiedFilters) => void;
  companies: [string, string][];
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {companies.length > 1 && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Company</span>
          <Select
            value={filters.companyId}
            onChange={(e) => onChange({ ...filters, companyId: e.target.value })}
            className="w-auto"
          >
            <option value="all">All companies</option>
            {companies.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </label>
      )}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Status</span>
        <Select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as UnifiedFilters["status"] })}
          className="w-auto"
        >
          <option value="all">All statuses</option>
          {COMPLIANCE_OBLIGATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {COMPLIANCE_OBLIGATION_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Category</span>
        <Select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value as UnifiedFilters["category"] })}
          className="w-auto"
        >
          <option value="all">All categories</option>
          {COMPLIANCE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {COMPLIANCE_CATEGORY_LABEL[c]}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Priority</span>
        <Select
          value={filters.priority}
          onChange={(e) => onChange({ ...filters, priority: e.target.value as UnifiedFilters["priority"] })}
          className="w-auto"
        >
          <option value="all">All priorities</option>
          {COMPLIANCE_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {COMPLIANCE_PRIORITY_LABEL[p]}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Due from</span>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
          className="min-h-11 w-auto rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Due to</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
          className="min-h-11 w-auto rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
        />
      </label>
      {(filters.companyId !== "all" ||
        filters.status !== "all" ||
        filters.category !== "all" ||
        filters.priority !== "all" ||
        filters.dateFrom ||
        filters.dateTo) && (
        <button
          type="button"
          onClick={() =>
            onChange({ companyId: "all", status: "all", category: "all", priority: "all", dateFrom: "", dateTo: "" })
          }
          className="min-h-11 text-xs font-medium text-accent underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
