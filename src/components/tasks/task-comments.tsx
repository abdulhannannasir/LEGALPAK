import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { addTaskCommentFn, deleteTaskCommentFn, listTaskCommentsFn, type TaskComment } from "@/lib/legalpak/tasks";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskComments({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<TaskComment[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function refresh() {
    setLoadError(false);
    listTaskCommentsFn({ data: taskId })
      .then(setComments)
      .catch(() => {
        setLoadError(true);
        toast.error("Could not load comments");
      });
  }
  useEffect(refresh, [taskId]);

  async function submit() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await addTaskCommentFn({ data: { taskId, body: text.trim() } });
      setText("");
      refresh();
    } catch {
      toast.error("Could not add comment");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      await deleteTaskCommentFn({ data: id });
      refresh();
    } catch {
      toast.error("Could not delete comment");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="font-display text-xl">Comments</h2>
      <p className="mt-1 text-sm text-muted">Coordinate with whoever's handling this task.</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Waiting on the auditor's sign-off before we can submit."
          aria-label="Comment"
          className="min-h-20"
        />
        <Button type="button" variant="secondary" onClick={submit} disabled={saving || !text.trim()}>
          <MessageSquarePlus className="size-4" strokeWidth={1.75} />
          Add
        </Button>
      </div>

      {comments === null && loadError ? (
        <div className="mt-4 flex items-center gap-3 text-sm text-danger">
          <span>Could not load comments.</span>
          <button type="button" onClick={refresh} className="font-medium underline">
            Try again
          </button>
        </div>
      ) : comments === null ? (
        <p className="mt-4 text-sm text-muted">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No comments yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-[var(--radius-md)] border border-border bg-bg p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted">
                  {c.user_name || c.user_email || "Someone"} · {formatDate(c.created_at)}
                </p>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  disabled={busyId === c.id}
                  aria-label="Remove comment"
                  className="text-muted hover:text-danger"
                >
                  <Trash2 className="size-4" strokeWidth={1.75} />
                </button>
              </div>
              <p className="mt-1.5 text-sm">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
