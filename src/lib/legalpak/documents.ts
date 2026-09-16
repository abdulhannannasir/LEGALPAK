import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { del, get, put } from "@vercel/blob";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { addDaysISO, todayISO } from "@/lib/legal/date";
import { createId } from "./id";
import { requireCompanyAccess, requireMatterAccess, requireObligationAccess, requireWorkspaceAccess } from "./access";
import { logAudit } from "./audit";

export const DOCUMENT_CATEGORIES = [
  "corporate",
  "secp",
  "directors",
  "shareholders",
  "contracts",
  "tax",
  "employment",
  "notices",
  "other",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_LABEL: Record<DocumentCategory, string> = {
  corporate: "Corporate",
  secp: "SECP",
  directors: "Directors",
  shareholders: "Shareholders",
  contracts: "Contracts",
  tax: "Tax",
  employment: "Employment",
  notices: "Legal Notices",
  other: "Other",
};

export const DOCUMENT_STATUSES = ["active", "archived"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

/** Badge shown in the UI — "active"/"archived" are the stored `status`; "expired" and "review_due" are derived from the dates so they can never go stale. */
export type DocumentStatusBadge = "active" | "archived" | "expired" | "review_due";

export const DOCUMENT_STATUS_BADGE_LABEL: Record<DocumentStatusBadge, string> = {
  active: "Active",
  archived: "Archived",
  expired: "Expired",
  review_due: "Review due",
};

export function deriveDocumentStatusBadge(
  doc: Pick<Document, "status" | "expiry_date" | "review_date">,
): DocumentStatusBadge {
  if (doc.status === "archived") return "archived";
  const today = todayISO();
  if (doc.expiry_date && doc.expiry_date < today) return "expired";
  if (doc.review_date) {
    const soonCutoff = addDaysISO(today, 30) ?? today;
    if (doc.review_date <= soonCutoff) return "review_due";
  }
  return "active";
}

export type Document = {
  id: string;
  workspace_id: string;
  company_id: string;
  matter_id: string | null;
  obligation_id: string | null;
  uploaded_by: string;
  name: string;
  description: string | null;
  notes: string | null;
  blob_pathname: string;
  mime_type: string | null;
  file_size: number | null;
  category: DocumentCategory;
  status: DocumentStatus;
  expiry_date: string | null;
  review_date: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

export type DocumentWithCompany = Document & { company_name: string };
export type DocumentWithLink = Document & { matter_title: string | null; matter_type: string | null };
export type DocumentWithCompanyAndLink = DocumentWithCompany & { matter_title: string | null; matter_type: string | null };

export type DocumentVersion = {
  id: string;
  document_id: string;
  version: number;
  name: string;
  blob_pathname: string;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by: string;
  created_at: string;
  archived_at: string;
};

const DOCUMENT_COLUMNS = `
  id, workspace_id, company_id, matter_id, obligation_id, uploaded_by, name, description, notes,
  blob_pathname, mime_type, file_size,
  category, status, expiry_date::text as expiry_date, review_date::text as review_date, version,
  created_at::text as created_at, updated_at::text as updated_at
`;

// Files travel base64-encoded through the server-function RPC (no multipart
// support there), which inflates size ~33% — keep well under Vercel's ~4.5MB
// serverless request-body ceiling. Plenty for CNIC scans, resolutions, PDFs.
const MAX_FILE_BYTES = 4 * 1024 * 1024;

const categorySchema = z.enum(DOCUMENT_CATEGORIES);

const uploadSchema = z.object({
  companyId: z.string().min(1),
  matterId: z.string().min(1).optional(),
  obligationId: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  mimeType: z.string().optional(),
  base64: z.string().min(1),
  category: categorySchema.optional(),
  description: z.string().trim().optional(),
  expiryDate: z.string().optional(),
  reviewDate: z.string().optional(),
});

const listDocumentsSchema = z.object({
  companyId: z.string().min(1),
  /** When set, only documents attached to this specific matter (not the whole company). */
  matterId: z.string().min(1).optional(),
  /** When set, only documents attached to this specific compliance obligation. */
  obligationId: z.string().min(1).optional(),
});

const DOCUMENT_COLUMNS_WITH_LINK = `
  d.id, d.workspace_id, d.company_id, d.matter_id, d.obligation_id, d.uploaded_by, d.name, d.description, d.notes,
  d.blob_pathname, d.mime_type, d.file_size,
  d.category, d.status, d.expiry_date::text as expiry_date, d.review_date::text as review_date, d.version,
  d.created_at::text as created_at, d.updated_at::text as updated_at,
  m.title as matter_title, m.type as matter_type
`;

export const listDocumentsFn = createServerFn({ method: "GET" })
  .validator((input: z.infer<typeof listDocumentsSchema>) => listDocumentsSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireCompanyAccess(context.userId, input.companyId);
    const sql = await getSql();
    if (input.obligationId) {
      return sql.query<DocumentWithLink>(
        `select ${DOCUMENT_COLUMNS_WITH_LINK}
         from document d left join matter m on m.id = d.matter_id
         where d.company_id = $1 and d.obligation_id = $2 order by d.updated_at desc`,
        [input.companyId, input.obligationId],
      );
    }
    if (input.matterId) {
      return sql.query<DocumentWithLink>(
        `select ${DOCUMENT_COLUMNS_WITH_LINK}
         from document d left join matter m on m.id = d.matter_id
         where d.company_id = $1 and d.matter_id = $2 order by d.updated_at desc`,
        [input.companyId, input.matterId],
      );
    }
    return sql.query<DocumentWithLink>(
      `select ${DOCUMENT_COLUMNS_WITH_LINK}
       from document d left join matter m on m.id = d.matter_id
       where d.company_id = $1 order by d.updated_at desc`,
      [input.companyId],
    );
  });

/** Every document across every company in a workspace — the Document Vault view. */
export const listWorkspaceDocumentsFn = createServerFn({ method: "GET" })
  .validator((workspaceId: string) => z.string().min(1).parse(workspaceId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: workspaceId }) => {
    await requireWorkspaceAccess(context.userId, workspaceId);
    const sql = await getSql();
    return sql.query<DocumentWithCompanyAndLink>(
      `select d.id, d.workspace_id, d.company_id, d.matter_id, d.obligation_id, d.uploaded_by, d.name, d.description, d.notes,
              d.blob_pathname, d.mime_type, d.file_size, d.category, d.status,
              d.expiry_date::text as expiry_date, d.review_date::text as review_date, d.version,
              d.created_at::text as created_at, d.updated_at::text as updated_at,
              c.name as company_name, m.title as matter_title, m.type as matter_type
       from document d
       join company c on c.id = d.company_id
       left join matter m on m.id = d.matter_id
       where d.workspace_id = $1
       order by d.updated_at desc`,
      [workspaceId],
    );
  });

export const uploadDocumentFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof uploadSchema>) => uploadSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const company = await requireCompanyAccess(context.userId, input.companyId);
    if (input.matterId) await requireMatterAccess(context.userId, input.matterId);
    if (input.obligationId) await requireObligationAccess(context.userId, input.obligationId);

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
        id, workspace_id, company_id, matter_id, obligation_id, uploaded_by, name, description, blob_pathname, mime_type, file_size,
        category, expiry_date, review_date
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      returning ${DOCUMENT_COLUMNS}`,
      [
        id,
        company.workspace_id,
        input.companyId,
        input.matterId ?? null,
        input.obligationId ?? null,
        context.userId,
        input.name,
        input.description || null,
        blob.pathname,
        input.mimeType ?? null,
        buffer.byteLength,
        input.category ?? "other",
        input.expiryDate || null,
        input.reviewDate || null,
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
      metadata: { name: doc.name, fileSize: doc.file_size ?? null, category: doc.category },
    }).catch(() => {});
    if (doc.obligation_id) {
      logAudit({
        workspaceId: doc.workspace_id,
        companyId: doc.company_id,
        userId: context.userId,
        action: "OBLIGATION_DOCUMENT_UPLOADED",
        entityType: "compliance_obligation",
        entityId: doc.obligation_id,
        metadata: { name: doc.name },
      }).catch(() => {});
    }
    return doc;
  });

async function loadDocumentForAccess(userId: string, documentId: string) {
  const sql = await getSql();
  const rows = await sql.query<Document>(`select ${DOCUMENT_COLUMNS} from document where id = $1`, [documentId]);
  const doc = rows[0];
  if (!doc) throw new Error("Document not found");
  await requireCompanyAccess(userId, doc.company_id);
  return doc;
}

const updateSchema = z.object({
  documentId: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  category: categorySchema.optional(),
});

/** Rename and/or re-categorize a document — content and version history are untouched. */
export const updateDocumentFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof updateSchema>) => updateSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const doc = await loadDocumentForAccess(context.userId, input.documentId);
    const sql = await getSql();
    const rows = await sql.query<Document>(
      `update document set name = $2, category = $3, updated_at = now()
       where id = $1
       returning ${DOCUMENT_COLUMNS}`,
      [doc.id, input.name ?? doc.name, input.category ?? doc.category],
    );
    const updated = rows[0];
    logAudit({
      workspaceId: updated.workspace_id,
      companyId: updated.company_id,
      matterId: updated.matter_id ?? undefined,
      userId: context.userId,
      action: "DOCUMENT_RENAMED",
      entityType: "document",
      entityId: updated.id,
      metadata: { name: updated.name, category: updated.category },
    }).catch(() => {});
    return updated;
  });

const updateDetailsSchema = z.object({
  documentId: z.string().min(1),
  description: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(DOCUMENT_STATUSES).optional(),
  expiryDate: z.string().nullable().optional(),
  reviewDate: z.string().nullable().optional(),
});

/** Edits the descriptive fields — description, notes, active/archived status, expiry/review dates. */
export const updateDocumentDetailsFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof updateDetailsSchema>) => updateDetailsSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const doc = await loadDocumentForAccess(context.userId, input.documentId);
    const sql = await getSql();
    const rows = await sql.query<Document>(
      `update document set
        description = $2, notes = $3, status = $4, expiry_date = $5, review_date = $6, updated_at = now()
       where id = $1
       returning ${DOCUMENT_COLUMNS}`,
      [
        doc.id,
        input.description !== undefined ? input.description || null : doc.description,
        input.notes !== undefined ? input.notes || null : doc.notes,
        input.status ?? doc.status,
        input.expiryDate !== undefined ? input.expiryDate || null : doc.expiry_date,
        input.reviewDate !== undefined ? input.reviewDate || null : doc.review_date,
      ],
    );
    const updated = rows[0];
    logAudit({
      workspaceId: updated.workspace_id,
      companyId: updated.company_id,
      matterId: updated.matter_id ?? undefined,
      userId: context.userId,
      action: "DOCUMENT_DETAILS_UPDATED",
      entityType: "document",
      entityId: updated.id,
      metadata: { name: updated.name, status: updated.status },
    }).catch(() => {});
    return updated;
  });

const linkSchema = z.object({
  documentId: z.string().min(1),
  matterId: z.string().min(1).nullable(),
});

/** Attaches (or detaches) a document to/from a matter — the same link a compliance obligation or a contract already is. */
export const linkDocumentFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof linkSchema>) => linkSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const doc = await loadDocumentForAccess(context.userId, input.documentId);
    let matterTitle: string | null = null;
    if (input.matterId) {
      const matter = await requireMatterAccess(context.userId, input.matterId);
      if (matter.company_id !== doc.company_id) {
        throw new Error("Can only link to a matter on the same company");
      }
      const rows = await (await getSql()).query<{ title: string }>(`select title from matter where id = $1`, [
        input.matterId,
      ]);
      matterTitle = rows[0]?.title ?? null;
    }
    const sql = await getSql();
    const rows = await sql.query<Document>(
      `update document set matter_id = $2, updated_at = now() where id = $1 returning ${DOCUMENT_COLUMNS}`,
      [doc.id, input.matterId],
    );
    const updated = rows[0];
    logAudit({
      workspaceId: updated.workspace_id,
      companyId: updated.company_id,
      matterId: updated.matter_id ?? undefined,
      userId: context.userId,
      action: input.matterId ? "DOCUMENT_LINKED" : "DOCUMENT_UNLINKED",
      entityType: "document",
      entityId: updated.id,
      metadata: { name: updated.name, matterTitle },
    }).catch(() => {});
    return updated;
  });

const replaceSchema = z.object({
  documentId: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  mimeType: z.string().optional(),
  base64: z.string().min(1),
});

/**
 * Upload new content for an existing document. The current content is
 * snapshotted into document_version (blob kept, not deleted) before the
 * document row is updated to point at the new blob.
 */
export const replaceDocumentFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof replaceSchema>) => replaceSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const doc = await loadDocumentForAccess(context.userId, input.documentId);

    const buffer = Buffer.from(input.base64, "base64");
    if (buffer.byteLength > MAX_FILE_BYTES) {
      throw new Error("File is larger than 4 MB — split it or compress it first");
    }

    const nextVersion = doc.version + 1;
    const newName = input.name ?? doc.name;
    const pathname = `${doc.workspace_id}/${doc.company_id}/${doc.id}-v${nextVersion}-${newName}`;
    const blob = await put(pathname, buffer, {
      access: "private",
      contentType: input.mimeType || doc.mime_type || "application/octet-stream",
      addRandomSuffix: false,
    });

    const sql = await getSql();
    await sql.query(
      `insert into document_version (
        id, document_id, version, name, blob_pathname, mime_type, file_size, uploaded_by, created_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        createId("docv"),
        doc.id,
        doc.version,
        doc.name,
        doc.blob_pathname,
        doc.mime_type,
        doc.file_size,
        doc.uploaded_by,
        doc.updated_at,
      ],
    );

    const rows = await sql.query<Document>(
      `update document set
        name = $2, blob_pathname = $3, mime_type = $4, file_size = $5,
        version = $6, uploaded_by = $7, updated_at = now()
       where id = $1
       returning ${DOCUMENT_COLUMNS}`,
      [doc.id, newName, blob.pathname, input.mimeType ?? doc.mime_type, buffer.byteLength, nextVersion, context.userId],
    );
    const updated = rows[0];
    logAudit({
      workspaceId: updated.workspace_id,
      companyId: updated.company_id,
      matterId: updated.matter_id ?? undefined,
      userId: context.userId,
      action: "DOCUMENT_REPLACED",
      entityType: "document",
      entityId: updated.id,
      metadata: { name: updated.name, version: updated.version },
    }).catch(() => {});
    return updated;
  });

export const listDocumentVersionsFn = createServerFn({ method: "GET" })
  .validator((documentId: string) => z.string().min(1).parse(documentId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: documentId }) => {
    await loadDocumentForAccess(context.userId, documentId);
    const sql = await getSql();
    return sql.query<DocumentVersion>(
      `select id, document_id, version, name, blob_pathname, mime_type, file_size, uploaded_by,
              created_at::text as created_at, archived_at::text as archived_at
       from document_version
       where document_id = $1
       order by version desc`,
      [documentId],
    );
  });

export const downloadDocumentFn = createServerFn({ method: "GET" })
  .validator((documentId: string) => z.string().min(1).parse(documentId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: documentId }) => {
    const doc = await loadDocumentForAccess(context.userId, documentId);
    const result = await get(doc.blob_pathname, { access: "private" });
    if (!result || result.statusCode !== 200) throw new Error("File not found in storage");
    const arrayBuffer = await new Response(result.stream).arrayBuffer();
    logAudit({
      workspaceId: doc.workspace_id,
      companyId: doc.company_id,
      matterId: doc.matter_id ?? undefined,
      userId: context.userId,
      action: "DOCUMENT_DOWNLOADED",
      entityType: "document",
      entityId: doc.id,
      metadata: { name: doc.name },
    }).catch(() => {});
    return {
      name: doc.name,
      mimeType: doc.mime_type,
      base64: Buffer.from(arrayBuffer).toString("base64"),
    };
  });

export const downloadDocumentVersionFn = createServerFn({ method: "GET" })
  .validator((versionId: string) => z.string().min(1).parse(versionId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: versionId }) => {
    const sql = await getSql();
    const rows = await sql.query<DocumentVersion & { document_id: string }>(
      `select id, document_id, version, name, blob_pathname, mime_type, file_size, uploaded_by,
              created_at::text as created_at, archived_at::text as archived_at
       from document_version where id = $1`,
      [versionId],
    );
    const version = rows[0];
    if (!version) throw new Error("Version not found");
    await loadDocumentForAccess(context.userId, version.document_id);

    const result = await get(version.blob_pathname, { access: "private" });
    if (!result || result.statusCode !== 200) throw new Error("File not found in storage");
    const arrayBuffer = await new Response(result.stream).arrayBuffer();
    return {
      name: version.name,
      mimeType: version.mime_type,
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

    const versions = await sql.query<{ blob_pathname: string }>(
      `select blob_pathname from document_version where document_id = $1`,
      [documentId],
    );
    await Promise.all(versions.map((v) => del(v.blob_pathname).catch(() => {})));
    await del(doc.blob_pathname).catch(() => {});
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
