import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import { signOut } from "@/lib/auth/client";
import { listWorkspacesFn, renameWorkspaceFn, type Workspace } from "@/lib/legalpak/workspaces";
import { getWorkspaceSubscriptionFn, type Subscription } from "@/lib/legalpak/billing";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [{ title: "Settings — LegalPak" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

const STATUS_META: Record<Subscription["status"], { label: string; icon: typeof CheckCircle2; className: string }> = {
  active: { label: "Active", icon: CheckCircle2, className: "text-success" },
  pending: { label: "Pending verification", icon: Clock, className: "text-accent" },
  rejected: { label: "Rejected", icon: XCircle, className: "text-danger" },
  expired: { label: "Expired", icon: XCircle, className: "text-danger" },
};

function SettingsPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <SettingsBody />;
}

function SettingsBody() {
  const user = useCurrentUser();
  const [workspace, setWorkspace] = useState<Workspace | null | undefined>(undefined);
  const [workspaceName, setWorkspaceName] = useState("");
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<{ latest: Subscription | null; isActive: boolean } | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    listWorkspacesFn()
      .then((rows) => {
        const ws = rows[0] ?? null;
        setWorkspace(ws);
        setWorkspaceName(ws?.name ?? "");
      })
      .catch(() => setWorkspace(null));
  }, []);

  useEffect(() => {
    if (!workspace) return;
    getWorkspaceSubscriptionFn({ data: workspace.id })
      .then(setSubscription)
      .catch(() => setSubscription(null));
  }, [workspace]);

  async function saveWorkspaceName(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !workspaceName.trim() || workspaceName.trim() === workspace.name) return;
    setSaving(true);
    try {
      const updated = await renameWorkspaceFn({ data: { workspaceId: workspace.id, name: workspaceName.trim() } });
      setWorkspace(updated);
      toast.success("Workspace renamed");
    } catch {
      toast.error("Could not rename workspace");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  if (workspace === undefined) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Settings</p>
        <h1 className="font-display text-3xl">Account & workspace</h1>
      </div>

      <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Profile</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Name</dt>
            <dd className="mt-0.5 text-sm font-medium">{user?.displayName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Email</dt>
            <dd className="mt-0.5 text-sm font-medium">{user?.primaryEmail ?? "—"}</dd>
          </div>
        </dl>
        <Button type="button" variant="secondary" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </section>

      <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Workspace</h2>
        {!workspace ? (
          <p className="text-sm text-muted">
            Create a workspace on the{" "}
            <Link to="/dashboard" className="underline">
              dashboard
            </Link>{" "}
            first.
          </p>
        ) : (
          <form onSubmit={saveWorkspaceName} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Workspace name" className="flex-1">
              <Input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} required />
            </Field>
            <Button type="submit" disabled={saving || workspaceName.trim() === workspace.name}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </form>
        )}
      </section>

      {workspace && (
        <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Billing</h2>
            <Link to="/billing" className="text-sm text-accent underline">
              Manage billing →
            </Link>
          </div>
          {subscription?.latest ? (
            (() => {
              const meta = STATUS_META[subscription.latest.status];
              const Icon = meta.icon;
              return (
                <p className="flex items-center gap-2 text-sm">
                  <Icon className={`size-4 ${meta.className}`} strokeWidth={1.75} />
                  Corporate Suite subscription: <span className="font-medium">{meta.label}</span>
                </p>
              );
            })()
          ) : (
            <p className="text-sm text-muted">No subscription yet — most tools require an active plan.</p>
          )}
        </section>
      )}
    </div>
  );
}
