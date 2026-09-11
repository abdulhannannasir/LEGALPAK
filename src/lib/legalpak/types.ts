import { z } from "zod";
import { MATTER_TYPES, type MatterStatus } from "./workflow";

/**
 * Shared row/input shapes, kept in a plain (non-`.server.`) module so routes can
 * import them directly. The DB-touching implementations live in the sibling
 * `*.server.ts` files, reached only via dynamic `import()` inside a
 * `createServerFn().handler()` — TanStack Start's import-protection plugin
 * refuses ANY static import (even type-only) of a `*.server.*` path from
 * client-reachable code, so these types must not live there.
 */

export type Workspace = { id: string; name: string; role: string };

export type Company = {
  id: string;
  workspace_id: string;
  name: string;
  cuin: string | null;
  ntn: string | null;
  company_type: string | null;
  paid_up_capital: string | null;
  turnover: string | null;
  employees: number | null;
  incorporation_date: string | null;
  financial_year_end: string | null;
  agm_date: string | null;
  public_linked: boolean;
  has_subsidiary: boolean;
};

export const companyInputSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().trim().min(1, "Company name is required"),
  cuin: z.string().trim().optional(),
  ntn: z.string().trim().optional(),
  companyType: z.string().trim().optional(),
  paidUpCapital: z.number().nonnegative().optional(),
  turnover: z.number().nonnegative().optional(),
  employees: z.number().int().nonnegative().optional(),
  incorporationDate: z.string().optional(),
  financialYearEnd: z.string().optional(),
  agmDate: z.string().optional(),
  publicLinked: z.boolean().optional(),
  hasSubsidiary: z.boolean().optional(),
});
export type CompanyInput = z.infer<typeof companyInputSchema>;

/** Recursive JSON value — `unknown` fails TanStack Start's serializable-return check. */
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type Matter = {
  id: string;
  workspace_id: string;
  company_id: string;
  type: (typeof MATTER_TYPES)[number];
  title: string;
  status: MatterStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type MatterWithData = Matter & { data: Record<string, Json> };

export const createMatterSchema = z.object({
  companyId: z.string().min(1),
  type: z.enum(MATTER_TYPES),
  title: z.string().trim().min(1, "Give this matter a title"),
  dueDate: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});
export type CreateMatterInput = z.infer<typeof createMatterSchema>;
