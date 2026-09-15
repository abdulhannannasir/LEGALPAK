import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { createId } from "./id";
import { requireMatterAccess } from "./access";
import { logAudit } from "./audit";
import type { Json } from "./types";

/**
 * Contract-specific version history: a named snapshot of a CONTRACT matter's
 * questionnaire answers + rendered draft, on top of the generic
 * `workflow_data` row every matter type already gets (which only ever holds
 * the CURRENT draft). See migrations/0013_contract_versions.sql.
 */
export type ContractVersion = {
  id: string;
  matter_id: string;
  version: number;
  contract_type: string;
  data: Record<string, Json>;
  draft_text: string;
  note: string | null;
  created_by: string;
  created_at: string;
};

const CONTRACT_VERSION_COLUMNS = `
  id, matter_id, version, contract_type, data, draft_text, note, created_by,
  created_at::text as created_at
`;

const saveVersionSchema = z.object({
  matterId: z.string().min(1),
  contractType: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
  draftText: z.string(),
  note: z.string().trim().max(280).optional(),
});

/** Snapshot the current questionnaire state + rendered draft as a new numbered version. */
export const saveContractVersionFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof saveVersionSchema>) => saveVersionSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const matter = await requireMatterAccess(context.userId, input.matterId);
    if (matter.type !== "CONTRACT") throw new Error("Version history is only available for contracts");

    const sql = await getSql();
    const rows = await sql.query<ContractVersion>(
      `with next as (
        select coalesce(max(version), 0) + 1 as n from contract_version where matter_id = $1
      )
      insert into contract_version (id, matter_id, version, contract_type, data, draft_text, note, created_by)
      select $2, $1, next.n, $3, $4::jsonb, $5, $6, $7 from next
      returning ${CONTRACT_VERSION_COLUMNS}`,
      [
        input.matterId,
        createId("cver"),
        input.contractType,
        JSON.stringify(input.data),
        input.draftText,
        input.note ?? null,
        context.userId,
      ],
    );
    const version = rows[0];
    logAudit({
      workspaceId: matter.workspace_id,
      companyId: matter.company_id,
      matterId: matter.id,
      userId: context.userId,
      action: "CONTRACT_VERSION_SAVED",
      entityType: "contract_version",
      entityId: version.id,
      metadata: { version: version.version, note: version.note ?? null },
    }).catch(() => {});
    return version;
  });

export const listContractVersionsFn = createServerFn({ method: "GET" })
  .validator((matterId: string) => z.string().min(1).parse(matterId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: matterId }) => {
    await requireMatterAccess(context.userId, matterId);
    const sql = await getSql();
    return sql.query<ContractVersion>(
      `select ${CONTRACT_VERSION_COLUMNS} from contract_version where matter_id = $1 order by version desc`,
      [matterId],
    );
  });
