import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { todayISO } from "@/lib/legal/date";
import type {
  Allowance,
  EmploymentType,
  FixedTermBasis,
  Gender,
  WorkPattern,
} from "@/lib/legal/punjab-employment-contract";
import { createId } from "./id";
import { requireCompanyAccess, requireEmployeeAccess } from "./access";
import { logAudit } from "./audit";
import type { Json } from "./types";

export const EMPLOYEE_STATUSES = ["active", "former"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export type Employee = {
  id: string;
  workspace_id: string;
  company_id: string;
  full_name: string;
  father_name: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  cnic: string | null;
  passport_no: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  employee_code: string | null;
  job_title: string;
  department: string | null;
  reports_to: string | null;
  job_description: string | null;
  place_of_work: string | null;
  is_managerial: boolean;
  employment_type: EmploymentType;
  fixed_term_basis: FixedTermBasis | null;
  fixed_term_reason: string | null;
  work_pattern: WorkPattern;
  date_of_joining: string | null;
  end_date: string | null;
  probation_months: number;
  weekly_hours: number;
  working_schedule: string | null;
  weekly_rest_day: string;
  basic_salary: number;
  allowances: Allowance[];
  social_security_no: string | null;
  eobi_no: string | null;
  status: EmployeeStatus;
  left_on: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

/** The list view also shows whether a contract has been issued yet. */
export type EmployeeWithContract = Employee & {
  contract_version: number | null;
  contract_saved_at: string | null;
};

export type EmployeeContract = {
  id: string;
  employee_id: string;
  version: number;
  title: string;
  body: string;
  snapshot: Record<string, Json>;
  note: string | null;
  created_by: string;
  created_at: string;
  created_by_name: string | null;
};

const EMPLOYEE_COLUMNS = `
  e.id, e.workspace_id, e.company_id, e.full_name, e.father_name, e.gender,
  e.date_of_birth::text as date_of_birth, e.cnic, e.passport_no, e.address, e.phone, e.email,
  e.employee_code, e.job_title, e.department, e.reports_to, e.job_description, e.place_of_work, e.is_managerial,
  e.employment_type, e.fixed_term_basis, e.fixed_term_reason, e.work_pattern,
  e.date_of_joining::text as date_of_joining, e.end_date::text as end_date, e.probation_months,
  e.weekly_hours, e.working_schedule, e.weekly_rest_day,
  e.basic_salary::float8 as basic_salary, e.allowances,
  e.social_security_no, e.eobi_no, e.status, e.left_on::text as left_on,
  e.created_by, e.created_at::text as created_at, e.updated_at::text as updated_at
`;

const EMPLOYEE_COLUMNS_WITH_CONTRACT = `
  ${EMPLOYEE_COLUMNS},
  (select max(c.version) from employee_contract c where c.employee_id = e.id) as contract_version,
  (select max(c.created_at)::text from employee_contract c where c.employee_id = e.id) as contract_saved_at
`;

export const listEmployeesFn = createServerFn({ method: "GET" })
  .validator((companyId: string) => z.string().min(1).parse(companyId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: companyId }) => {
    await requireCompanyAccess(context.userId, companyId);
    const sql = await getSql();
    return sql.query<EmployeeWithContract>(
      `select ${EMPLOYEE_COLUMNS_WITH_CONTRACT}
       from employee e
       where e.company_id = $1
       order by (e.status = 'former'), lower(e.full_name)`,
      [companyId],
    );
  });

export const getEmployeeFn = createServerFn({ method: "GET" })
  .validator((employeeId: string) => z.string().min(1).parse(employeeId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: employeeId }) => {
    await requireEmployeeAccess(context.userId, employeeId);
    const sql = await getSql();
    const rows = await sql.query<EmployeeWithContract>(
      `select ${EMPLOYEE_COLUMNS_WITH_CONTRACT} from employee e where e.id = $1`,
      [employeeId],
    );
    if (!rows[0]) throw new Error("Employee not found");
    return rows[0];
  });

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
  .or(z.literal(""));

/** A Pakistani CNIC is 13 digits, usually written 12345-1234567-1. */
const cnicField = z
  .string()
  .trim()
  .refine((v) => v === "" || v.replace(/\D/g, "").length === 13, "A CNIC has 13 digits (e.g. 35202-1234567-1)");

const optionalText = z.string().trim().optional();

const allowanceSchema = z.object({
  name: z.string().trim().min(1, "Name each allowance"),
  amount: z.number().nonnegative("An allowance cannot be negative"),
});

const employeeFieldsSchema = z.object({
  fullName: z.string().trim().min(1, "Enter the employee's full name"),
  fatherName: optionalText,
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: isoDate.optional(),
  cnic: cnicField.optional(),
  passportNo: optionalText,
  address: optionalText,
  phone: optionalText,
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email address")
    .optional(),

  employeeCode: optionalText,
  jobTitle: z.string().trim().min(1, "Enter the job title"),
  department: optionalText,
  reportsTo: optionalText,
  jobDescription: optionalText,
  placeOfWork: optionalText,
  isManagerial: z.boolean().optional(),

  employmentType: z.enum(["permanent", "fixed_term"]).optional(),
  fixedTermBasis: z.enum(["temporary_work", "seasonal", "replacement", "special_project"]).optional(),
  fixedTermReason: optionalText,
  workPattern: z.enum(["full_time", "part_time"]).optional(),
  dateOfJoining: isoDate.refine((v) => v !== "", "Enter the date of joining"),
  endDate: isoDate.optional(),
  probationMonths: z.number().int().min(0).max(3, "Probation cannot exceed three months").optional(),

  weeklyHours: z.number().int().min(1).max(72).optional(),
  workingSchedule: optionalText,
  weeklyRestDay: optionalText,

  basicSalary: z.number().nonnegative("Salary cannot be negative"),
  allowances: z.array(allowanceSchema).optional(),

  socialSecurityNo: optionalText,
  eobiNo: optionalText,
});

const createSchema = employeeFieldsSchema.extend({ companyId: z.string().min(1) });
export type CreateEmployeeInput = z.infer<typeof createSchema>;

const updateSchema = employeeFieldsSchema.extend({ employeeId: z.string().min(1) });
export type UpdateEmployeeInput = z.infer<typeof updateSchema>;

export type EmployeeFields = z.infer<typeof employeeFieldsSchema>;

/** Column values, in the order both the insert and the update below bind them. Fixed-term-only fields are cleared for a permanent hire so stale data can't leak into a contract. */
function fieldParams(f: EmployeeFields): unknown[] {
  const fixed = f.employmentType === "fixed_term";
  return [
    f.fullName,
    f.fatherName || null,
    f.gender ?? null,
    f.dateOfBirth || null,
    f.cnic || null,
    f.passportNo || null,
    f.address || null,
    f.phone || null,
    f.email || null,
    f.employeeCode || null,
    f.jobTitle,
    f.department || null,
    f.reportsTo || null,
    f.jobDescription || null,
    f.placeOfWork || null,
    f.isManagerial ?? false,
    f.employmentType ?? "permanent",
    fixed ? (f.fixedTermBasis ?? null) : null,
    fixed ? f.fixedTermReason || null : null,
    f.workPattern ?? "full_time",
    f.dateOfJoining,
    fixed ? f.endDate || null : null,
    f.probationMonths ?? 0,
    f.weeklyHours ?? 48,
    f.workingSchedule || null,
    f.weeklyRestDay || "Sunday",
    f.basicSalary,
    JSON.stringify(f.allowances ?? []),
    f.socialSecurityNo || null,
    f.eobiNo || null,
  ];
}

const FIELD_COLUMNS = [
  "full_name",
  "father_name",
  "gender",
  "date_of_birth",
  "cnic",
  "passport_no",
  "address",
  "phone",
  "email",
  "employee_code",
  "job_title",
  "department",
  "reports_to",
  "job_description",
  "place_of_work",
  "is_managerial",
  "employment_type",
  "fixed_term_basis",
  "fixed_term_reason",
  "work_pattern",
  "date_of_joining",
  "end_date",
  "probation_months",
  "weekly_hours",
  "working_schedule",
  "weekly_rest_day",
  "basic_salary",
  "allowances",
  "social_security_no",
  "eobi_no",
] as const;

/** `allowances` is jsonb; every other column takes its bound value as-is. */
function placeholder(column: (typeof FIELD_COLUMNS)[number], n: number): string {
  return column === "allowances" ? `$${n}::jsonb` : `$${n}`;
}

export const createEmployeeFn = createServerFn({ method: "POST" })
  .validator((input: CreateEmployeeInput) => createSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const company = await requireCompanyAccess(context.userId, input.companyId);
    const sql = await getSql();
    const id = createId("emp");
    // $1..$4 are id, workspace, company, created_by; the field columns follow.
    const placeholders = FIELD_COLUMNS.map((c, i) => placeholder(c, i + 5)).join(", ");
    const rows = await sql.query<EmployeeWithContract>(
      `with inserted as (
         insert into employee (id, workspace_id, company_id, created_by, ${FIELD_COLUMNS.join(", ")})
         values ($1, $2, $3, $4, ${placeholders})
         returning *
       )
       select ${EMPLOYEE_COLUMNS_WITH_CONTRACT} from inserted e`,
      [id, company.workspace_id, input.companyId, context.userId, ...fieldParams(input)],
    );
    const employee = rows[0];
    logAudit({
      workspaceId: employee.workspace_id,
      companyId: employee.company_id,
      userId: context.userId,
      action: "EMPLOYEE_ADDED",
      entityType: "employee",
      entityId: employee.id,
      metadata: { name: employee.full_name, jobTitle: employee.job_title },
    }).catch(() => {});
    return employee;
  });

export const updateEmployeeFn = createServerFn({ method: "POST" })
  .validator((input: UpdateEmployeeInput) => updateSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireEmployeeAccess(context.userId, input.employeeId);
    const sql = await getSql();
    const assignments = FIELD_COLUMNS.map((c, i) => `${c} = ${placeholder(c, i + 2)}`).join(", ");
    const rows = await sql.query<EmployeeWithContract>(
      `with updated as (
         update employee set ${assignments}, updated_at = now()
         where id = $1
         returning *
       )
       select ${EMPLOYEE_COLUMNS_WITH_CONTRACT} from updated e`,
      [input.employeeId, ...fieldParams(input)],
    );
    const employee = rows[0];
    logAudit({
      workspaceId: employee.workspace_id,
      companyId: employee.company_id,
      userId: context.userId,
      action: "EMPLOYEE_UPDATED",
      entityType: "employee",
      entityId: employee.id,
      metadata: { name: employee.full_name },
    }).catch(() => {});
    return employee;
  });

const statusSchema = z.object({
  employeeId: z.string().min(1),
  status: z.enum(EMPLOYEE_STATUSES),
  leftOn: isoDate.optional(),
});

/** Marks an employee as having left (or brings them back). Never deletes — the record and any contracts issued stay on file. */
export const setEmployeeStatusFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof statusSchema>) => statusSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireEmployeeAccess(context.userId, input.employeeId);
    const sql = await getSql();
    const rows = await sql.query<EmployeeWithContract>(
      `with updated as (
         update employee
         set status = $2, left_on = case when $2 = 'former' then $3::date else null end, updated_at = now()
         where id = $1
         returning *
       )
       select ${EMPLOYEE_COLUMNS_WITH_CONTRACT} from updated e`,
      [input.employeeId, input.status, input.leftOn || todayISO()],
    );
    const employee = rows[0];
    logAudit({
      workspaceId: employee.workspace_id,
      companyId: employee.company_id,
      userId: context.userId,
      action: "EMPLOYEE_STATUS_CHANGED",
      entityType: "employee",
      entityId: employee.id,
      metadata: { name: employee.full_name, status: input.status },
    }).catch(() => {});
    return employee;
  });

export const deleteEmployeeFn = createServerFn({ method: "POST" })
  .validator((employeeId: string) => z.string().min(1).parse(employeeId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: employeeId }) => {
    const employee = await requireEmployeeAccess(context.userId, employeeId);
    const sql = await getSql();
    await sql.query(`delete from employee where id = $1`, [employeeId]);
    logAudit({
      workspaceId: employee.workspace_id,
      companyId: employee.company_id,
      userId: context.userId,
      action: "EMPLOYEE_REMOVED",
      entityType: "employee",
      entityId: employeeId,
      metadata: { name: employee.full_name },
    }).catch(() => {});
    return { ok: true as const };
  });

export const listEmployeeContractsFn = createServerFn({ method: "GET" })
  .validator((employeeId: string) => z.string().min(1).parse(employeeId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: employeeId }) => {
    await requireEmployeeAccess(context.userId, employeeId);
    const sql = await getSql();
    return sql.query<EmployeeContract>(
      `select c.id, c.employee_id, c.version, c.title, c.body, c.snapshot, c.note,
              c.created_by, c.created_at::text as created_at, u.name as created_by_name
       from employee_contract c
       left join "user" u on u.id = c.created_by
       where c.employee_id = $1
       order by c.version desc`,
      [employeeId],
    );
  });

const saveContractSchema = z.object({
  employeeId: z.string().min(1),
  title: z.string().trim().min(1),
  body: z.string().min(1, "There is no contract text to save"),
  snapshot: z.record(z.string(), z.unknown()).optional(),
  note: z.string().trim().optional(),
});
export type SaveEmployeeContractInput = z.infer<typeof saveContractSchema>;

/** Stores the draft the user just reviewed as the next numbered, immutable version. */
export const saveEmployeeContractFn = createServerFn({ method: "POST" })
  .validator((input: SaveEmployeeContractInput) => saveContractSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const employee = await requireEmployeeAccess(context.userId, input.employeeId);
    const sql = await getSql();
    const rows = await sql.query<{ id: string; version: number }>(
      `insert into employee_contract (id, employee_id, workspace_id, company_id, version, title, body, snapshot, note, created_by)
       values (
         $1, $2, $3, $4,
         (select coalesce(max(version), 0) + 1 from employee_contract where employee_id = $2),
         $5, $6, $7::jsonb, $8, $9
       )
       returning id, version`,
      [
        createId("econtract"),
        input.employeeId,
        employee.workspace_id,
        employee.company_id,
        input.title,
        input.body,
        JSON.stringify(input.snapshot ?? {}),
        input.note || null,
        context.userId,
      ],
    );
    const saved = rows[0];
    logAudit({
      workspaceId: employee.workspace_id,
      companyId: employee.company_id,
      userId: context.userId,
      action: "EMPLOYEE_CONTRACT_SAVED",
      entityType: "employee",
      entityId: employee.id,
      metadata: { name: employee.full_name, version: saved.version },
    }).catch(() => {});
    return saved;
  });
