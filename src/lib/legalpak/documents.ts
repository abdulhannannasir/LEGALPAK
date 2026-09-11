import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { del, get, put } from "@vercel/blob";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { createId } from "./id";
import { requireCompanyAccess, requireMatterAccess } from "./access";
import { logAudit } from "./audit";

export type Document = {
  id: string;
  workspace_id: string;
  company_id: string;
  matter_id: string | null;
  uploaded_by: string;
  name: string;
  blob_pathname: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

const DOCUMENT_COLUMNS = `
  id, workspace_id, company_id, matter_id, uploaded_by, name, blob_pathname, mime_type, file_size,
  created_at::text as created_at
`;

// Files travel base64-encoded through the server-function RPC (no multipart
// support there), which inflates size ~33% — keep well under Vercel's ~4.5MB
// serverless request-body ceiling. Plenty for CNIC scans, resolutions, PDFs.
const MAX_FILE_BYTES = 4 * 1024 * 1024;

const uploadSchema = z.object({
  companyId: z.string().min(1),
  matterId: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  mimeType: z.string().optional(),
  base64: z.string().min(1),
});

const listDocumentsSchema = z.object({
  companyId: z.string().min(1),
  /** When set, only documents attached to this specific matter (not the whole company). */
  matterId: z.string().min(1).optional(),
});

export const listDocumentsFn = createServerFn({ method: "GET" })
  .validator((input: z.infer<typeof listDocumentsSchema>) => listDocumentsSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireCompanyAccess(context.userId, input.companyId);
    const sql = await getSql();
    if (input.matterId) {
      return sql.query<Document>(
        `select ${DOCUMENT_COLUMNS} from document where company_id = $1 and matter_id = $2 order by created_at desc`,
        [input.companyId, input.matterId],
      );
    }
    return sql.query<Document>(
      `select ${DOCUMENT_COLUMNS} from document where company_id = $1 order by created_at desc`,
      [input.companyId],
    );
  });

export const uploadDocumentFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof uploadSchema>) => uploadSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const company = await requireCompanyAccess(context.userId, input.companyId);
    if (input.matterId) await requireMatterAccess(context.userId, input.matterId);

    const buffer = Buffer.from(input.base64, "base64");
    if (buffer.byteLength > MAX_FILE_BYTES) {
      throw new Error("File is larger than 4 MB — split it or compress it first");
    }

    const id = createId("doc");
    const pathname = `${company.workspace_id}/${input.companyId}/${id}-${input.name}`;
    const blob = await put(pathname, buffer, {
      access: "private",
      contentType: input.mimeType || "application/octet-stream",
      addRandomSuffix: false,
    });

    const sql = await getSql();
    const rows = await sql.query<Document>(
      `insert into document (
        id, workspace_id, company_id, matter_id, uploaded_by, name, blob_pathname, mime_type, file_size
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      returning ${DOCUMENT_COLUMNS}`,
      [
        id,
        company.workspace_id,
        input.companyId,
        input.matterId ?? null,
        context.userId,
        input.name,
        blob.pathname,
        input.mimeType ?? null,
        buffer.byteLength,
      ],
    );
    const doc = rows[0];
    logAudit({
      workspaceId: doc.workspace_id,
      companyId: doc.company_id,
      matterId: doc.matter_id ?? undefined,
      userId: context.userId,
      action: "DOCUMENT_UPLOADED",
      entityType: "document",
      entityId: doc.id,
      metadata: { name: doc.name, fileSize: doc.file_size ?? null },
    }).catch(() => {});
    return doc;
  });

export const downloadDocumentFn = createServerFn({ method: "GET" })
  .validator((documentId: string) => z.string().min(1).parse(documentId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: documentId }) => {
    const sql = await getSql();
    const rows = await sql.query<{ company_id: string; blob_pathname: string; name: string; mime_type: string | null }>(
      `select company_id, blob_pathname, name, mime_type from document where id = $1`,
      [documentId],
    );
    const doc = rows[0];
    if (!doc) throw new Error("Document not found");
    await requireCompanyAccess(context.userId, doc.company_id);

    const result = await get(doc.blob_pathname, { access: "private" });
    if (!result || result.statusCode !== 200) throw new Error("File not found in storage");
    const arrayBuffer = await new Response(result.stream).arrayBuffer();
    return {
      name: doc.name,
      mimeType: doc.mime_type,
      base64: Buffer.from(arrayBuffer).toString("base64"),
    };
  });

export const deleteDocumentFn = createServerFn({ method: "POST" })
  .validator((documentId: string) => z.string().min(1).parse(documentId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: documentId }) => {
    const sql = await getSql();
    const rows = await sql.query<{
      workspace_id: string;
      company_id: string;
      matter_id: string | null;
      blob_pathname: string;
      name: string;
    }>(`select workspace_id, company_id, matter_id, blob_pathname, name from document where id = $1`, [documentId]);
    const doc = rows[0];
    if (!doc) return null;
    await requireCompanyAccess(context.userId, doc.company_id);
    await del(doc.blob_pathname);
    await sql.query(`delete from document where id = $1`, [documentId]);
    logAudit({
      workspaceId: doc.workspace_id,
      companyId: doc.company_id,
      matterId: doc.matter_id ?? undefined,
      userId: context.userId,
      action: "DOCUMENT_DELETED",
      entityType: "document",
      entityId: documentId,
      metadata: { name: doc.name },
    }).catch(() => {});
    return null;
  });
