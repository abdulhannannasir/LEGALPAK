import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import {
  addComplianceNoteFn,
  deleteComplianceNoteFn,
  listComplianceNotesFn,
  type ComplianceNote,
} from "@/lib/legalpak/compliance";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Free-form, workspace-shared notes on a compliance item — who's handling it, what's blocking it. */
export function ComplianceNotes({ matterId }: { matterId: string }) {
  const [notes, setNotes] = useState<ComplianceNote[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function refresh() {
    setLoadError(false);
    listComplianceNotesFn({ data: matterId })
      .then(setNotes)
      .catch(() => {
        setLoadError(true);
        toast.error("Could not load notes");
      });
  }
  useEffect(refresh, [matterId]);

  async function submit() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await addComplianceNoteFn({ data: { matterId, body: text.trim() } });
      setText("");
      refresh();
    } catch {
      toast.error("Could not add note");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      await deleteComplianceNoteFn({ data: id });
      refresh();
    } catch {
      toast.error("Could not delete note");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="font-display text-xl">Notes</h2>
      <p className="mt-1 text-sm text-muted">
        Keep context on this requirement — who's handling it, what's blocking it, what changed.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Waiting on the signed board resolution from the CFO."
          aria-label="Note"
          className="min-h-20"
        />
        <Button type="button" variant="secondary" onClick={submit} disabled={saving || !text.trim()}>
          <MessageSquarePlus className="size-4" strokeWidth={1.75} />
          Add
        </Button>
      </div>

      {notes === null && loadError ? (
        <div className="mt-4 flex items-center gap-3 text-sm text-danger">
          <span>Could not load notes.</span>
          <button type="button" onClick={refresh} className="font-medium underline">
            Try again
          </button>
        </div>
      ) : notes === null ? (
        <p className="mt-4 text-sm text-muted">Loading…</p>
      ) : notes.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No notes yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-[var(--radius-md)] border border-border bg-bg p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted">
                  {n.user_name || n.user_email || "Someone"} · {formatDate(n.created_at)}
                </p>
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  disabled={busyId === n.id}
                  aria-label="Remove note"
                  className="text-muted hover:text-danger"
                >
                  <Trash2 className="size-4" strokeWidth={1.75} />
                </button>
              </div>
              <p className="mt-1.5 text-sm">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
