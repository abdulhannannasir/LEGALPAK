import { useEffect, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listWorkspacesFn, type Workspace } from "@/lib/legalpak/workspaces";
import { getWorkspaceSubscriptionFn } from "@/lib/legalpak/billing";
import { Button } from "@/components/ui/button";

/**
 * Gates the Corporate Suite tools behind an active workspace subscription.
 * Citizen Legal Help and the Help Desk & Rights Navigator are deliberately
 * NOT wrapped in this — those stay free. See /billing for the plan and the
 * manual EasyPaisa payment flow (there's no payment-gateway API wired up;
 * see lib/legalpak/billing.ts for why).
 */
export function RequireSubscription({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <SubscriptionCheck>{children}</SubscriptionCheck>;
}

function SubscriptionCheck({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean | null>(null);

  useEffect(() => {
    listWorkspacesFn()
      .then(async (rows: Workspace[]) => {
        const ws = rows[0] ?? null;
        setWorkspace(ws);
        if (!ws) {
          setIsActive(false);
          return;
        }
        const { isActive } = await getWorkspaceSubscriptionFn({ data: ws.id });
        setIsActive(isActive);
      })
      .catch(() => {
        setWorkspace(null);
        setIsActive(false);
      });
  }, []);

  if (workspace === undefined || isActive === null) return null;

  if (isActive) return <>{children}</>;

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center">
      <Lock className="mx-auto size-8 text-accent" strokeWidth={1.5} />
      <h1 className="font-display text-2xl">This is part of the Corporate Suite</h1>
      <p className="text-sm text-muted">
        Financial Statements, Form A, Form 9, Contracts, Incorporation, Form 21/45, Legal Notices,
        the Tax Assistant, and the Compliance Calendar are available on the Corporate Suite plan —
        PKR 3,000/month per workspace. Citizen Legal Help and the Help Desk & Rights Navigator stay
        free.
      </p>
      {!workspace ? (
        <p className="text-sm text-muted">Create a workspace first, then subscribe.</p>
      ) : null}
      <a href={workspace ? `/billing?workspaceId=${workspace.id}` : "/dashboard"}>
        <Button type="button" className="w-full justify-center">
          {workspace ? "Subscribe for PKR 3,000/month" : "Create a workspace"}
        </Button>
      </a>
    </div>
  );
}
