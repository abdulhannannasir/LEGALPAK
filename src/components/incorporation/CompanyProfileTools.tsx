import { useRef } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCompanyProfile, readCompanyProfileFile, type CompanyProfile } from "@/lib/incorporation/company-profile";

/**
 * Export/import bar for the company-profile JSON "vault" — export once from
 * the incorporation pack, then import on Form 21, Form 45, or Legal Notices
 * to skip re-typing company name/CUIN/NTN/director details.
 */
export function CompanyProfileTools({
  profile,
  onImport,
  mode = "both",
}: {
  profile?: CompanyProfile;
  onImport?: (profile: CompanyProfile) => void;
  mode?: "export" | "import" | "both";
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onImport) return;
    try {
      const parsed = await readCompanyProfileFile(file);
      onImport(parsed);
      toast.success(`Loaded "${parsed.name || "company"}" — fields prefilled below`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that profile");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border bg-bg p-3 text-xs text-muted">
      <span>Company profile vault:</span>
      {mode !== "import" && profile && (
        <Button type="button" variant="ghost" onClick={() => downloadCompanyProfile(profile)}>
          <Download className="size-3.5" strokeWidth={1.75} />
          Export .json
        </Button>
      )}
      {mode !== "export" && onImport && (
        <>
          <Button type="button" variant="ghost" onClick={() => fileInput.current?.click()}>
            <Upload className="size-3.5" strokeWidth={1.75} />
            Import .json
          </Button>
          <input ref={fileInput} type="file" accept="application/json" className="hidden" onChange={handleFile} />
        </>
      )}
    </div>
  );
}
