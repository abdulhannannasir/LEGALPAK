import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deleteDocumentFn,
  downloadDocumentFn,
  listDocumentsFn,
  uploadDocumentFn,
  type Document,
} from "@/lib/legalpak/documents";

const MAX_FILE_BYTES = 4 * 1024 * 1024;

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

function formatSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentVault({ companyId, matterId }: { companyId: string; matterId?: string }) {
  const [documents, setDocuments] = useState<Document[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function refresh() {
    listDocumentsFn({ data: { companyId, matterId } })
      .then(setDocuments)
      .catch(() => toast.error("Could not load documents"));
  }

  useEffect(refresh, [companyId, matterId]);

  async function handleFile(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File is larger than 4 MB — split it or compress it first");
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      await uploadDocumentFn({
        data: { companyId, matterId, name: file.name, mimeType: file.type || undefined, base64 },
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

  async function handleDownload(doc: Document) {
    setBusyId(doc.id);
    try {
      const { base64, mimeType, name } = await downloadDocumentFn({ data: doc.id });
      const byteChars = atob(base64);
      const bytes = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
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

  async function handleDelete(doc: Document) {
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

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl">Documents</h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
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
      </div>
      {documents === null ? (
        <p className="mt-3 text-sm text-muted">Loading…</p>
      ) : documents.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No documents yet — CNIC scans, board resolutions, signed packs.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-bg px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="size-5 shrink-0 text-accent" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-muted">{formatSize(doc.file_size)}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busyId === doc.id}
                  onClick={() => handleDownload(doc)}
                >
                  Download
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busyId === doc.id}
                  onClick={() => handleDelete(doc)}
                  aria-label={`Delete ${doc.name}`}
                >
                  <Trash2 className="size-4" strokeWidth={1.75} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
