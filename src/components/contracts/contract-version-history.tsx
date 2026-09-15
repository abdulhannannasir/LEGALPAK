import { useEffect, useState } from "react";
import { toast } from "sonner";
import { History, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { listContractVersionsFn, saveContractVersionFn, type ContractVersion } from "@/lib/legalpak/contracts";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Named snapshots of a saved contract's questionnaire + draft, on top of the
 * always-current `workflow_data` row every matter already autosaves to.
 * "Save version" freezes a copy; "Restore" loads an old copy back into the
 * live editor (and saves it as the current draft) without deleting anything
 * in between — the timeline only ever grows.
 */
export function ContractVersionHistory({
  matterId,
  contractType,
  currentData,
  draftText,
  onRestore,
  readOnly = false,
}: {
  matterId: string;
  contractType: string;
  currentData: Record<string, unknown>;
  draftText: string;
  onRestore: (version: ContractVersion) => void | Promise<void>;
  readOnly?: boolean;
}) {
  const [versions, setVersions] = useState<ContractVersion[] | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  function refresh() {
    listContractVersionsFn({ data: matterId })
      .then(setVersions)
      .catch(() => toast.error("Could not load version history"));
  }

  useEffect(refresh, [matterId]);

  async function saveVersion() {
    setSaving(true);
    try {
      await saveContractVersionFn({
        data: { matterId, contractType, data: currentData, draftText, note: note.trim() || undefined },
      });
      setNote("");
      toast.success("Version saved");
      refresh();
    } catch {
      toast.error("Could not save this version");
    } finally {
      setSaving(false);
    }
  }

  async function restore(version: ContractVersion) {
    setRestoringId(version.id);
    try {
      await onRestore(version);
      toast.success(`Restored v${version.version}`);
    } catch {
      toast.error("Could not restore this version");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="flex items-center gap-2 font-display text-xl">
        <History className="size-5 text-accent" strokeWidth={1.75} />
        Version history
      </h2>
      <p className="mt-1 text-sm text-muted">
        Freeze a snapshot before a big edit or after a negotiation round, so you can always see —
        or come back to — an earlier draft.
      </p>

      {!readOnly && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What changed? (optional note)"
            className="max-w-sm"
          />
          <Button type="button" variant="secondary" disabled={saving} onClick={saveVersion}>
            <Save className="size-4" strokeWidth={1.75} />
            {saving ? "Saving…" : "Save version"}
          </Button>
        </div>
      )}

      {versions === null ? (
        <p className="mt-4 text-sm text-muted">Loading…</p>
      ) : versions.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No saved versions yet — save one above.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {versions.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border bg-bg px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">
                  v{v.version}
                  {v.note ? ` — ${v.note}` : ""}
                </p>
                <p className="text-xs text-muted">{formatDate(v.created_at)}</p>
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={restoringId !== null}
                  onClick={() => restore(v)}
                >
                  <RotateCcw className="size-4" strokeWidth={1.75} />
                  {restoringId === v.id ? "Restoring…" : "Restore"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
