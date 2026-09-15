import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BellPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import {
  addComplianceReminderFn,
  deleteComplianceReminderFn,
  listComplianceRemindersFn,
  type ComplianceReminder,
} from "@/lib/legalpak/compliance";
import { formatShort } from "@/lib/legal/date";

/** User-set "remind me on this date" entries — separate from the automatic 14/7/3/1-day email checkpoints. */
export function ComplianceReminders({ matterId }: { matterId: string }) {
  const [reminders, setReminders] = useState<ComplianceReminder[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [remindOn, setRemindOn] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function refresh() {
    setLoadError(false);
    listComplianceRemindersFn({ data: matterId })
      .then(setReminders)
      .catch(() => {
        setLoadError(true);
        toast.error("Could not load reminders");
      });
  }
  useEffect(refresh, [matterId]);

  async function submit() {
    if (!remindOn) return;
    setSaving(true);
    try {
      await addComplianceReminderFn({ data: { matterId, remindOn, note: note.trim() || undefined } });
      setRemindOn("");
      setNote("");
      refresh();
      toast.success("Reminder set");
    } catch {
      toast.error("Could not set reminder");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      await deleteComplianceReminderFn({ data: id });
      refresh();
    } catch {
      toast.error("Could not remove reminder");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="font-display text-xl">Reminders</h2>
      <p className="mt-1 text-sm text-muted">
        Set your own reminder dates for this requirement, separate from the automatic email alerts sent 14, 7, 3 and
        1 day before the due date.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
        <Field label="Remind on">
          <Input type="date" value={remindOn} onChange={(e) => setRemindOn(e.target.value)} />
        </Field>
        <Field label="Note (optional)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Call the auditor" />
        </Field>
        <Button type="button" variant="secondary" onClick={submit} disabled={saving || !remindOn}>
          <BellPlus className="size-4" strokeWidth={1.75} />
          Set reminder
        </Button>
      </div>

      {reminders === null ? (
        <p className="mt-4 text-sm text-muted">Loading…</p>
      ) : reminders.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No custom reminders set.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {reminders.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2"
            >
              <p className="text-sm">
                <span className="font-medium">{formatShort(r.remind_on)}</span>
                {r.note ? ` · ${r.note}` : ""}
              </p>
              <button
                type="button"
                onClick={() => remove(r.id)}
                disabled={busyId === r.id}
                aria-label="Remove reminder"
                className="text-muted hover:text-danger"
              >
                <Trash2 className="size-4" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
