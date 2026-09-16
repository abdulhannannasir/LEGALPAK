import { useMemo, useState } from "react";
import { AlertTriangle, Copy, Download, FileText, FileDown, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { textToDocxBlob } from "@/lib/generate-docx";
import { textToPdfBlob } from "@/lib/generate-pdf";

function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Every generator in the app (citizen, incorporation, notices) marks an unfilled field as `[Like This]`. */
const PLACEHOLDER_RE = /\[[A-Za-z][^[\]\n]{0,80}\]/;

/**
 * Renders a generated legal-pack draft with copy / download / print actions.
 * Shared across accounts, form-a, form-9 and contracts so the drafting
 * experience (and the eventual "keep or discard" habit) is identical everywhere.
 */
export function PackOutput({
  text,
  filename,
  title,
}: {
  text: string;
  filename: string;
  title?: string;
}) {
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const docTitle = title ?? titleFromFilename(filename);
  const hasPlaceholders = useMemo(() => PLACEHOLDER_RE.test(text), [text]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy — select the text manually");
    }
  }

  function download() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded " + filename);
  }

  async function downloadDocx() {
    setExportingDocx(true);
    try {
      const blob = await textToDocxBlob(docTitle, text);
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = filename.replace(/\.[^.]+$/, "") + ".docx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded as Word document");
    } catch {
      toast.error("Could not generate the Word document");
    } finally {
      setExportingDocx(false);
    }
  }

  async function downloadPdf() {
    setExportingPdf(true);
    try {
      const blob = await textToPdfBlob(docTitle, text);
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = filename.replace(/\.[^.]+$/, "") + ".pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded as PDF");
    } catch {
      toast.error("Could not generate the PDF");
    } finally {
      setExportingPdf(false);
    }
  }

  function print() {
    const w = window.open("", "_blank", "noopener,noreferrer,width=800,height=1000");
    if (!w) {
      toast.error("Pop-up blocked — allow pop-ups to print");
      return;
    }
    w.document.write(
      `<!doctype html><html><head><title>${filename}</title><style>
        body { font-family: "Courier New", monospace; font-size: 12px; line-height: 1.55; white-space: pre-wrap; padding: 2.5cm 2cm; color: #111; }
        @page { margin: 1.5cm; }
      </style></head><body>${escapeHtml(text)}</body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 print:hidden">
      {hasPlaceholders && (
        <div className="mb-3 flex items-start gap-2 rounded-[var(--radius-sm)] border border-warn bg-flag-med px-3 py-2 text-xs text-warn">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
          <p>
            This draft still has unfilled <code>[bracketed]</code> placeholders — fill in the details above before
            you copy, download, print, or send it anywhere.
          </p>
        </div>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={copy}>
          <Copy className="size-4" strokeWidth={1.75} />
          Copy
        </Button>
        <Button type="button" variant="ghost" onClick={download}>
          <Download className="size-4" strokeWidth={1.75} />
          Download .txt
        </Button>
        <Button type="button" variant="ghost" disabled={exportingDocx} onClick={downloadDocx}>
          <FileText className="size-4" strokeWidth={1.75} />
          {exportingDocx ? "Generating…" : "Download .docx"}
        </Button>
        <Button type="button" variant="ghost" disabled={exportingPdf} onClick={downloadPdf}>
          <FileDown className="size-4" strokeWidth={1.75} />
          {exportingPdf ? "Generating…" : "Download .pdf"}
        </Button>
        <Button type="button" variant="ghost" onClick={print}>
          <Printer className="size-4" strokeWidth={1.75} />
          Print / save as PDF
        </Button>
      </div>
      <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-[var(--radius-md)] border border-border bg-bg p-4 font-mono text-xs leading-relaxed">
        {text}
      </pre>
    </section>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
