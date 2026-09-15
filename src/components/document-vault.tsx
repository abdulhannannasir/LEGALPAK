import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Building2, Download, Eye, FileText, History, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import {
  deleteDocumentFn,
  downloadDocumentFn,
  downloadDocumentVersionFn,
  listDocumentsFn,
  listDocumentVersionsFn,
  listWorkspaceDocumentsFn,
  replaceDocumentFn,
  updateDocumentFn,
  uploadDocumentFn,
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABEL,
  type Document,
  type DocumentCategory,
  type DocumentVersion,
  type DocumentWithCompany,
} from "@/lib/legalpak/documents";

const MAX_FILE_BYTES = 4 * 1024 * 1024;

export type DocumentVaultScope =
  | { type: "company"; companyId: string; matterId?: string }
  | { type: "workspace"; workspaceId: string };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:<mime>;base64,<payload> — keep only the payload.
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function base64ToBlob(base64: string, mimeType: string | null): Blob {
  const byteChars = atob(base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  return new Blob([bytes], { type: mimeType || "application/octet-stream" });
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function DocumentVault({ scope, title = "Documents" }: { scope: DocumentVaultScope; title?: string }) {
  const isWorkspaceScope = scope.type === "workspace";
  const [documents, setDocuments] = useState<(Document | DocumentWithCompany)[] | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | "all">("all");
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>("other");
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [versionsOpenId, setVersionsOpenId] = useState<string | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetId = useRef<string | null>(null);

  const scopeKey = isWorkspaceScope ? scope.workspaceId : `${scope.companyId}:${scope.matterId ?? ""}`;

  function refresh() {
    const request = isWorkspaceScope
      ? listWorkspaceDocumentsFn({ data: scope.workspaceId })
      : listDocumentsFn({ data: { companyId: scope.companyId, matterId: scope.matterId } });
    request.then(setDocuments).catch(() => toast.error("Could not load documents"));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the scope identity changes
  useEffect(refresh, [scopeKey]);

  async function handleUpload(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File is larger than 4 MB — split it or compress it first");
      return;
    }
    if (isWorkspaceScope) return;
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      await uploadDocumentFn({
        data: {
          companyId: scope.companyId,
          matterId: scope.matterId,
          name: file.name,
          mimeType: file.type || undefined,
          base64,
          category: uploadCategory,
        },
      });
      toast.success("Uploaded " + file.name);
      refresh();
    } catch {
      toast.error("Could not upload " + file.name);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleReplace(file: File) {
    const documentId = replaceTargetId.current;
    if (!documentId) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File is larger than 4 MB — split it or compress it first");
      return;
    }
    setBusyId(documentId);
    try {
      const base64 = await fileToBase64(file);
      await replaceDocumentFn({
        data: { documentId, base64, mimeType: file.type || undefined },
      });
      toast.success("Replaced with " + file.name);
      refresh();
    } catch {
      toast.error("Could not replace this file");
    } finally {
      setBusyId(null);
      replaceTargetId.current = null;
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  }

  async function handleDownload(doc: Document) {
    setBusyId(doc.id);
    try {
      const { base64, mimeType, name } = await downloadDocumentFn({ data: doc.id });
      const url = URL.createObjectURL(base64ToBlob(base64, mimeType));
      const a = window.document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download this file");
    } finally {
      setBusyId(null);
    }
  }

  async function handleView(doc: Document) {
    setBusyId(doc.id);
    try {
      const { base64, mimeType } = await downloadDocumentFn({ data: doc.id });
      const url = URL.createObjectURL(base64ToBlob(base64, mimeType));
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("Could not open this file");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDownloadVersion(version: DocumentVersion) {
    try {
      const { base64, mimeType, name } = await downloadDocumentVersionFn({ data: version.id });
      const url = URL.createObjectURL(base64ToBlob(base64, mimeType));
      const a = window.document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download this version");
    }
  }

  async function handleDelete(doc: Document) {
    if (!window.confirm(`Delete "${doc.name}"? This can't be undone.`)) return;
    setBusyId(doc.id);
    try {
      await deleteDocumentFn({ data: doc.id });
      toast.success("Deleted " + doc.name);
      refresh();
    } catch {
      toast.error("Could not delete this file");
    } finally {
      setBusyId(null);
    }
  }

  async function saveRename(doc: Document) {
    const name = renameValue.trim();
    if (!name) return;
    setBusyId(doc.id);
    try {
      await updateDocumentFn({ data: { documentId: doc.id, name } });
      setRenamingId(null);
      refresh();
    } catch {
      toast.error("Could not rename this file");
    } finally {
      setBusyId(null);
    }
  }

  async function changeCategory(doc: Document, category: DocumentCategory) {
    setBusyId(doc.id);
    try {
      await updateDocumentFn({ data: { documentId: doc.id, category } });
      refresh();
    } catch {
      toast.error("Could not update category");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleVersions(doc: Document) {
    if (versionsOpenId === doc.id) {
      setVersionsOpenId(null);
      return;
    }
    setVersionsOpenId(doc.id);
    try {
      const rows = await listDocumentVersionsFn({ data: doc.id });
      setVersions(rows);
    } catch {
      toast.error("Could not load version history");
    }
  }

  const filtered = (documents ?? []).filter((d) => categoryFilter === "all" || d.category === categoryFilter);
  const presentCategories = new Set((documents ?? []).map((d) => d.category));

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl">{title}</h2>
        {!isWorkspaceScope && (
          <div className="flex items-center gap-2">
            <Select
              aria-label="Category for the next upload"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
              className="w-auto"
            >
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {DOCUMENT_CATEGORY_LABEL[c]}
                </option>
              ))}
            </Select>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" strokeWidth={1.75} />
              {uploading ? "Uploading…" : "Upload file"}
            </Button>
          </div>
        )}
      </div>

      <input
        ref={replaceInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReplace(file);
        }}
      />

      {presentCategories.size > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              categoryFilter === "all" ? "border-primary bg-primary text-primary-fg" : "border-border text-muted"
            }`}
          >
            All
          </button>
          {DOCUMENT_CATEGORIES.filter((c) => presentCategories.has(c)).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryFilter(c)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                categoryFilter === c ? "border-primary bg-primary text-primary-fg" : "border-border text-muted"
              }`}
            >
              {DOCUMENT_CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      )}

      {documents === null ? (
        <p className="mt-3 text-sm text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          {documents.length === 0
            ? "No documents yet — CNIC scans, board resolutions, signed packs."
            : "Nothing in this category."}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {filtered.map((doc) => {
            const isRenaming = renamingId === doc.id;
            const isBusy = busyId === doc.id;
            const isCompany = "company_name" in doc;
            return (
              <div key={doc.id} className="rounded-[var(--radius-md)] border border-border bg-bg px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <FileText className="size-5 shrink-0 text-accent" strokeWidth={1.75} />
                    <div className="min-w-0 flex-1">
                      {isRenaming ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRename(doc);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-border bg-surface px-2 py-1 text-sm"
                          />
                          <Button type="button" variant="ghost" disabled={isBusy} onClick={() => saveRename(doc)}>
                            Save
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => setRenamingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="truncate text-sm font-medium">{doc.name}</p>
                          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                            <span>{formatSize(doc.file_size)}</span>
                            <span>· v{doc.version}</span>
                            <span>· updated {formatDate(doc.updated_at)}</span>
                            {isCompany && (
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="size-3" strokeWidth={1.75} />
                                {(doc as DocumentWithCompany).company_name}
                              </span>
                            )}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {!isRenaming && (
                    <div className="flex shrink-0 flex-wrap gap-1">
                      <Select
                        aria-label={`Category for ${doc.name}`}
                        value={doc.category}
                        disabled={isBusy}
                        onChange={(e) => changeCategory(doc, e.target.value as DocumentCategory)}
                        className="h-9 w-auto text-xs"
                      >
                        {DOCUMENT_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {DOCUMENT_CATEGORY_LABEL[c]}
                          </option>
                        ))}
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-2"
                        disabled={isBusy}
                        onClick={() => handleView(doc)}
                        aria-label={`View ${doc.name}`}
                      >
                        <Eye className="size-4" strokeWidth={1.75} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-2"
                        disabled={isBusy}
                        onClick={() => handleDownload(doc)}
                        aria-label={`Download ${doc.name}`}
                      >
                        <Download className="size-4" strokeWidth={1.75} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-2"
                        disabled={isBusy}
                        onClick={() => {
                          setRenamingId(doc.id);
                          setRenameValue(doc.name);
                        }}
                        aria-label={`Rename ${doc.name}`}
                      >
                        <Pencil className="size-4" strokeWidth={1.75} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-3 text-xs"
                        disabled={isBusy}
                        onClick={() => {
                          replaceTargetId.current = doc.id;
                          replaceInputRef.current?.click();
                        }}
                      >
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-2"
                        disabled={isBusy}
                        onClick={() => toggleVersions(doc)}
                        aria-label={`Version history for ${doc.name}`}
                      >
                        <History className="size-4" strokeWidth={1.75} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-2"
                        disabled={isBusy}
                        onClick={() => handleDelete(doc)}
                        aria-label={`Delete ${doc.name}`}
                      >
                        <Trash2 className="size-4" strokeWidth={1.75} />
                      </Button>
                    </div>
                  )}
                </div>

                {versionsOpenId === doc.id && (
                  <div className="mt-3 border-t border-border pt-3">
                    {doc.version === 1 && versions.length === 0 ? (
                      <p className="text-xs text-muted">No prior versions — this is the original upload.</p>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-fg">Version history</p>
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span>v{doc.version} (current) · {formatDate(doc.updated_at)}</span>
                        </div>
                        {versions.map((v) => (
                          <div key={v.id} className="flex items-center justify-between text-xs text-muted">
                            <span>
                              v{v.version} · {formatDate(v.archived_at)} · {formatSize(v.file_size)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDownloadVersion(v)}
                              className="text-accent underline"
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
