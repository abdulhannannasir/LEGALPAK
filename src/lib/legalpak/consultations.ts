import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { createId } from "./id";
import { logAudit } from "./audit";

export type ConsultationRequest = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string;
  message: string | null;
  company_id: string | null;
  matter_id: string | null;
  status: "new" | "contacted" | "scheduled" | "closed";
  created_at: string;
};

const CONSULTATION_COLUMNS = `
  id, name, email, phone, topic, message, company_id, matter_id, status,
  created_at::text as created_at
`;

const createConsultationSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  topic: z.string().trim().min(1, "Tell us what you need help with"),
  message: z.string().trim().optional(),
  workspaceId: z.string().min(1).optional(),
  companyId: z.string().min(1).optional(),
  matterId: z.string().min(1).optional(),
});
export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;

/**
 * Public — no session required. This is the lead-capture form standing in
 * for a Cal.com/Calendly embed until one is wired up: anyone (signed in or
 * not) can submit a request; the practice follows up manually via
 * listConsultationRequestsFn. When submitted from inside the app with a
 * matter/company in context, those ids are stored as-is (non-sensitive lead
 * metadata) without an ownership check — worst case is a mismatched id on
 * an otherwise-harmless contact record.
 */
export const createConsultationRequestFn = createServerFn({ method: "POST" })
  .validator((input: CreateConsultationInput) => createConsultationSchema.parse(input))
  .handler(async ({ data: input }) => {
    const sql = await getSql();
    const id = createId("consult");
    const rows = await sql.query<ConsultationRequest>(
      `insert into consultation_request (id, name, email, phone, topic, message, workspace_id, company_id, matter_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       returning ${CONSULTATION_COLUMNS}`,
      [
        id,
        input.name,
        input.email,
        input.phone ?? null,
        input.topic,
        input.message ?? null,
        input.workspaceId ?? null,
        input.companyId ?? null,
        input.matterId ?? null,
      ],
    );
    const request = rows[0];
    if (input.workspaceId) {
      logAudit({
        workspaceId: input.workspaceId,
        companyId: input.companyId,
        matterId: input.matterId,
        userId: "lead",
        action: "CONSULTATION_REQUESTED",
        entityType: "consultation_request",
        entityId: request.id,
        metadata: { topic: input.topic },
      }).catch(() => {});
    }
    return request;
  });

/** Authenticated — the practice's own leads inbox. Not workspace-scoped: any signed-in user sees every lead, matching a single-practice setup. */
export const listConsultationRequestsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const sql = await getSql();
    return sql.query<ConsultationRequest>(
      `select ${CONSULTATION_COLUMNS} from consultation_request order by created_at desc`,
    );
  });

export const updateConsultationStatusFn = createServerFn({ method: "POST" })
  .validator((input: { id: string; status: ConsultationRequest["status"] }) =>
    z
      .object({ id: z.string().min(1), status: z.enum(["new", "contacted", "scheduled", "closed"]) })
      .parse(input),
  )
  .middleware([authMiddleware])
  .handler(async ({ data: input }) => {
    const sql = await getSql();
    const rows = await sql.query<ConsultationRequest>(
      `update consultation_request set status = $2 where id = $1 returning ${CONSULTATION_COLUMNS}`,
      [input.id, input.status],
    );
    return rows[0];
  });
