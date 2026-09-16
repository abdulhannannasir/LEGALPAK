import { deriveCompliance, type ComplianceItem } from "./compliance";
import {
  computeObligationEffectiveStatus,
  isConfigurationRequired,
  type ComplianceObligationStatus,
  type ComplianceObligationWithCompany,
  type CompliancePriority,
} from "./compliance-obligations";
import type { ComplianceCategory } from "./compliance-rules";

/**
 * A single shape the Compliance Center's dashboard/list/calendar render,
 * combining the two sources of a compliance duty in this app: a
 * document-generator matter (FINANCIAL_STATEMENTS/FORM_A/FORM_9/
 * INCOME_TAX_RETURN — see compliance.ts) and a general compliance_obligation
 * row (compliance-obligations.ts). Nothing here writes to the database —
 * it's pure presentation glue, kept out of both domain modules so neither
 * has to import the other.
 */
export type UnifiedComplianceItem = {
  id: string;
  kind: "matter" | "obligation";
  companyId: string;
  companyName: string;
  title: string;
  category: ComplianceCategory;
  authority: string;
  dueDate: string | null;
  status: ComplianceObligationStatus;
  priority: CompliancePriority;
  recurring: boolean;
  configurationRequired: boolean;
  href: string;
};

const MATTER_CATEGORY: Record<string, ComplianceCategory> = {
  FINANCIAL_STATEMENTS: "secp",
  FORM_A: "secp",
  FORM_9: "secp",
  INCOME_TAX_RETURN: "tax",
};

export function matterItemToUnified(item: ComplianceItem): UnifiedComplianceItem | null {
  const derived = deriveCompliance(item);
  if (!derived) return null;
  const status: ComplianceObligationStatus = derived.health === "unscheduled" ? "upcoming" : derived.health;
  return {
    id: item.id,
    kind: "matter",
    companyId: item.company_id,
    companyName: item.company_name,
    title: derived.requirement,
    category: MATTER_CATEGORY[item.type] ?? "other",
    authority: derived.authority,
    dueDate: item.due_date,
    status,
    priority: "medium",
    recurring: false,
    configurationRequired: derived.health === "unscheduled",
    href: `/matters/${item.id}`,
  };
}

export function obligationToUnified(o: ComplianceObligationWithCompany): UnifiedComplianceItem {
  return {
    id: o.id,
    kind: "obligation",
    companyId: o.company_id,
    companyName: o.company_name,
    title: o.title,
    category: o.category,
    authority: o.authority,
    dueDate: o.due_date,
    status: computeObligationEffectiveStatus(o.status, o.due_date),
    priority: o.priority,
    recurring: o.recurring,
    configurationRequired: isConfigurationRequired(o),
    href: `/compliance/${o.id}`,
  };
}

export const STATUS_RANK: Record<ComplianceObligationStatus, number> = {
  overdue: 0,
  due_soon: 1,
  in_progress: 2,
  upcoming: 3,
  completed: 4,
};

export type UnifiedFilters = {
  companyId: string | "all";
  status: ComplianceObligationStatus | "all";
  category: ComplianceCategory | "all";
  priority: CompliancePriority | "all";
  dateFrom: string;
  dateTo: string;
};

export const EMPTY_UNIFIED_FILTERS: UnifiedFilters = {
  companyId: "all",
  status: "all",
  category: "all",
  priority: "all",
  dateFrom: "",
  dateTo: "",
};

export function filterUnifiedItems(items: UnifiedComplianceItem[], filters: UnifiedFilters): UnifiedComplianceItem[] {
  return items.filter((item) => {
    if (filters.companyId !== "all" && item.companyId !== filters.companyId) return false;
    if (filters.status !== "all" && item.status !== filters.status) return false;
    if (filters.category !== "all" && item.category !== filters.category) return false;
    if (filters.priority !== "all" && item.priority !== filters.priority) return false;
    if (filters.dateFrom && (!item.dueDate || item.dueDate < filters.dateFrom)) return false;
    if (filters.dateTo && (!item.dueDate || item.dueDate > filters.dateTo)) return false;
    return true;
  });
}
