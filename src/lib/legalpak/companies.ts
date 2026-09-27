import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { createId } from "./id";
import { requireCompanyAccess, requireWorkspaceAccess } from "./access";
import { logAudit } from "./audit";
import { companyInputSchema, type Company, type CompanyInput } from "./types";

export type { Company, CompanyInput, CompanyStatus, CompanyType } from "./types";
export { COMPANY_STATUSES, COMPANY_TYPES, COMPANY_TYPE_LABEL } from "./types";

const COMPANY_COLUMNS = `
  id, workspace_id, name, cuin, ntn, company_type,
  paid_up_capital, turnover, employees,
  incorporation_date::text as incorporation_date,
  financial_year_end::text as financial_year_end,
  agm_date::text as agm_date,
  public_linked, has_subsidiary, status,
  registered_address, business_activity, province, city,
  archived_at::text as archived_at
`;

/** Registration status derived from incorporation_date — a plain read of whether the company has one on file, not a registrar lookup. */
export function registrationStatus(c: Pick<Company, "incorporation_date">): { label: string; tone: "success" | "warn" } {
  return c.incorporation_date
    ? { label: "Incorporated", tone: "success" }
    : { label: "Registration in progress", tone: "warn" };
}

const listCompaniesSchema = z.object({
  workspaceId: z.string().min(1),
  includeArchived: z.boolean().optional(),
});

export const listCompaniesFn = createServerFn({ method: "GET" })
  .validator((input: string | z.infer<typeof listCompaniesSchema>) =>
    typeof input === "string" ? { workspaceId: input, includeArchived: false } : listCompaniesSchema.parse(input),
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireWorkspaceAccess(context.userId, input.workspaceId);
    const sql = await getSql();
    if (input.includeArchived) {
      return sql.query<Company>(
        `select ${COMPANY_COLUMNS} from company where workspace_id = $1 order by created_at desc`,
        [input.workspaceId],
      );
    }
    return sql.query<Company>(
      `select ${COMPANY_COLUMNS} from company where workspace_id = $1 and status = 'active' order by created_at desc`,
      [input.workspaceId],
    );
  });

export const getCompanyFn = createServerFn({ method: "GET" })
  .validator((companyId: string) => z.string().min(1).parse(companyId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: companyId }) => {
    await requireCompanyAccess(context.userId, companyId);
    const sql = await getSql();
    const rows = await sql.query<Company>(`select ${COMPANY_COLUMNS} from company where id = $1`, [companyId]);
    return rows[0];
  });

export const createCompanyFn = createServerFn({ method: "POST" })
  .validator((input: CompanyInput) => companyInputSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireWorkspaceAccess(context.userId, input.workspaceId);
    const sql = await getSql();
    const id = createId("company");
    const rows = await sql.query<Company>(
      `insert into company (
        id, workspace_id, name, cuin, ntn, company_type,
        paid_up_capital, turnover, employees,
        incorporation_date, financial_year_end, agm_date,
        public_linked, has_subsidiary,
        registered_address, business_activity, province, city
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      returning ${COMPANY_COLUMNS}`,
      [
        id,
        input.workspaceId,
        input.name,
        input.cuin ?? null,
        input.ntn ?? null,
        input.companyType ?? null,
        input.paidUpCapital ?? null,
        input.turnover ?? null,
        input.employees ?? null,
        input.incorporationDate || null,
        input.financialYearEnd || null,
        input.agmDate || null,
        input.publicLinked ?? false,
        input.hasSubsidiary ?? false,
        input.registeredAddress || null,
        input.businessActivity || null,
        input.province || null,
        input.city || null,
      ],
    );
    const company = rows[0];
    logAudit({
      workspaceId: company.workspace_id,
      companyId: company.id,
      userId: context.userId,
      action: "COMPANY_CREATED",
      entityType: "company",
      entityId: company.id,
      metadata: { name: company.name },
    }).catch(() => {});
    return company;
  });

const updateCompanySchema = companyInputSchema.omit({ workspaceId: true }).extend({
  companyId: z.string().min(1),
});
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

export const updateCompanyFn = createServerFn({ method: "POST" })
  .validator((input: UpdateCompanyInput) => updateCompanySchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireCompanyAccess(context.userId, input.companyId);
    const sql = await getSql();
    const rows = await sql.query<Company>(
      `update company set
        name = $2, cuin = $3, ntn = $4, company_type = $5,
        paid_up_capital = $6, turnover = $7, employees = $8,
        incorporation_date = $9, financial_year_end = $10, agm_date = $11,
        public_linked = $12, has_subsidiary = $13,
        registered_address = $14, business_activity = $15, province = $16, city = $17,
        updated_at = now()
      where id = $1
      returning ${COMPANY_COLUMNS}`,
      [
        input.companyId,
        input.name,
        input.cuin ?? null,
        input.ntn ?? null,
        input.companyType ?? null,
        input.paidUpCapital ?? null,
        input.turnover ?? null,
        input.employees ?? null,
        input.incorporationDate || null,
        input.financialYearEnd || null,
        input.agmDate || null,
        input.publicLinked ?? false,
        input.hasSubsidiary ?? false,
        input.registeredAddress || null,
        input.businessActivity || null,
        input.province || null,
        input.city || null,
      ],
    );
    const company = rows[0];
    logAudit({
      workspaceId: company.workspace_id,
      companyId: company.id,
      userId: context.userId,
      action: "COMPANY_UPDATED",
      entityType: "company",
      entityId: company.id,
    }).catch(() => {});
    return company;
  });

async function setCompanyStatus(
  userId: string,
  companyId: string,
  status: "active" | "archived",
): Promise<Company> {
  await requireCompanyAccess(userId, companyId);
  const sql = await getSql();
  const rows = await sql.query<Company>(
    `update company set status = $2, archived_at = case when $2 = 'archived' then now() else null end, updated_at = now()
     where id = $1
     returning ${COMPANY_COLUMNS}`,
    [companyId, status],
  );
  const company = rows[0];
  logAudit({
    workspaceId: company.workspace_id,
    companyId: company.id,
    userId,
    action: status === "archived" ? "COMPANY_ARCHIVED" : "COMPANY_RESTORED",
    entityType: "company",
    entityId: company.id,
    metadata: { name: company.name },
  }).catch(() => {});
  return company;
}

/** Archiving hides the company from matter-creation pickers and the switcher's default list — it never deletes matters, documents or history. */
export const archiveCompanyFn = createServerFn({ method: "POST" })
  .validator((companyId: string) => z.string().min(1).parse(companyId))
  .middleware([authMiddleware])
  .handler(({ context, data: companyId }) => setCompanyStatus(context.userId, companyId, "archived"));

export const restoreCompanyFn = createServerFn({ method: "POST" })
  .validator((companyId: string) => z.string().min(1).parse(companyId))
  .middleware([authMiddleware])
  .handler(({ context, data: companyId }) => setCompanyStatus(context.userId, companyId, "active"));
