import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { createId } from "./id";
import { requireCompanyAccess, requireWorkspaceAccess } from "./access";
import { logAudit } from "./audit";
import { companyInputSchema, type Company, type CompanyInput } from "./types";

export type { Company, CompanyInput } from "./types";

const COMPANY_COLUMNS = `
  id, workspace_id, name, cuin, ntn, company_type,
  paid_up_capital, turnover, employees,
  incorporation_date::text as incorporation_date,
  financial_year_end::text as financial_year_end,
  agm_date::text as agm_date,
  public_linked, has_subsidiary
`;

export const listCompaniesFn = createServerFn({ method: "GET" })
  .validator((workspaceId: string) => z.string().min(1).parse(workspaceId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: workspaceId }) => {
    await requireWorkspaceAccess(context.userId, workspaceId);
    const sql = await getSql();
    return sql.query<Company>(
      `select ${COMPANY_COLUMNS} from company where workspace_id = $1 order by created_at desc`,
      [workspaceId],
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
        public_linked, has_subsidiary
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
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
