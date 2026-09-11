import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { createId } from "./id";
import { logAudit } from "./audit";
import type { Workspace } from "./types";

export type { Workspace } from "./types";

export const listWorkspacesFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<Workspace>`
      select w.id, w.name, wm.role
      from workspace w
      join workspace_member wm on wm.workspace_id = w.id
      where wm.user_id = ${context.userId}
      order by w.created_at asc
    `;
  });

export const createWorkspaceFn = createServerFn({ method: "POST" })
  .validator((name: string) => z.string().trim().min(1, "Workspace name is required").parse(name))
  .middleware([authMiddleware])
  .handler(async ({ context, data: name }) => {
    const sql = await getSql();
    const workspaceId = createId("ws");
    const memberId = createId("member");
    // Single statement so the workspace and its owner-membership row are atomic
    // even though @/lib/db exposes no cross-statement transaction primitive.
    const rows = await sql<{ id: string; name: string }>`
      with new_workspace as (
        insert into workspace (id, name, created_by) values (${workspaceId}, ${name}, ${context.userId})
        returning id, name
      ), new_member as (
        insert into workspace_member (id, workspace_id, user_id, role)
        select ${memberId}, id, ${context.userId}, 'owner' from new_workspace
        returning workspace_id
      )
      select id, name from new_workspace
    `;
    const workspace = { ...rows[0], role: "owner" } satisfies Workspace;
    logAudit({
      workspaceId: workspace.id,
      userId: context.userId,
      action: "WORKSPACE_CREATED",
      entityType: "workspace",
      entityId: workspace.id,
      metadata: { name },
    }).catch(() => {});
    return workspace;
  });
