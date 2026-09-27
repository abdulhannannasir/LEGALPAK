import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { todayISO } from "@/lib/legal/date";
import { createId } from "./id";
import {
  requireCompanyAccess,
  requireDocumentAccess,
  requireObligationAccess,
  requireTaskAccess,
  requireWorkspaceAccess,
} from "./access";
import { logAudit, type AuditLogRow } from "./audit";

export const TASK_STATUSES = ["todo", "in_progress", "blocked", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export const TASK_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/** Ready-made checklists for the recurring corporate workflows LegalPak already knows about — the "New task" form offers these, fully editable after creation. */
export type TaskTemplate = { key: string; label: string; steps: string[] };

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    key: "secp_annual_return",
    label: "SECP Annual Return (Form A)",
    steps: ["Gather financial information", "Prepare filing", "Director approval", "Upload documents", "Submit", "Mark completed"],
  },
  {
    key: "form_9_director_change",
    label: "Form 9 — Director Change",
    steps: ["Collect director details & consent", "Prepare Form 9", "Board approval", "Upload documents", "Submit to SECP", "Mark completed"],
  },
  {
    key: "financial_statements",
    label: "Financial Statements Filing",
    steps: [
      "Gather financial information",
      "Prepare draft statements",
      "Auditor review",
      "Director approval",
      "Upload documents",
      "Submit",
      "Mark completed",
    ],
  },
  {
    key: "blank",
    label: "Blank task (no steps)",
    steps: [],
  },
];

export type Task = {
  id: string;
  workspace_id: string;
  company_id: string;
  obligation_id: string | null;
  document_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assignee_id: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TaskWithDetails = Task & {
  company_name: string;
  assignee_name: string | null;
  assignee_email: string | null;
  obligation_title: string | null;
  document_name: string | null;
  step_total: number;
  step_done: number;
};

const TASK_COLUMNS = `
  t.id, t.workspace_id, t.company_id, t.obligation_id, t.document_id,
  t.title, t.description, t.status, t.priority,
  t.due_date::text as due_date, t.assignee_id,
  t.completed_at::text as completed_at, t.completed_by,
  t.created_by, t.created_at::text as created_at, t.updated_at::text as updated_at
`;

const TASK_COLUMNS_WITH_DETAILS = `
  ${TASK_COLUMNS},
  c.name as company_name,
  a.name as assignee_name, a.email as assignee_email,
  o.title as obligation_title,
  d.name as document_name,
  coalesce(step_counts.total, 0) as step_total,
  coalesce(step_counts.done, 0) as step_done
`;

const TASK_DETAIL_JOINS = `
  join company c on c.id = t.company_id
  left join "user" a on a.id = t.assignee_id
  left join compliance_obligation o on o.id = t.obligation_id
  left join document d on d.id = t.document_id
  left join (
    select task_id, count(*) as total, count(*) filter (where done) as done
    from task_step
    group by task_id
  ) step_counts on step_counts.task_id = t.id
`;

/** True when the due date has passed and the task hasn't been marked done — never a stored status, always derived so it can't go stale. */
export function isTaskOverdue(t: Pick<Task, "due_date" | "status">): boolean {
  if (t.status === "done" || !t.due_date) return false;
  return t.due_date < todayISO();
}

export const listTasksFn = createServerFn({ method: "GET" })
  .validator((companyId: string) => z.string().min(1).parse(companyId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: companyId }) => {
    await requireCompanyAccess(context.userId, companyId);
    const sql = await getSql();
    return sql.query<TaskWithDetails>(
      `select ${TASK_COLUMNS_WITH_DETAILS}
       from task t ${TASK_DETAIL_JOINS}
       where t.company_id = $1
       order by (t.due_date is null), t.due_date asc, t.created_at desc`,
      [companyId],
    );
  });

/** Every task across the workspace, for the /tasks board and the dashboard's task widget. */
export const listWorkspaceTasksFn = createServerFn({ method: "GET" })
  .validator((workspaceId: string) => z.string().min(1).parse(workspaceId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: workspaceId }) => {
    await requireWorkspaceAccess(context.userId, workspaceId);
    const sql = await getSql();
    return sql.query<TaskWithDetails>(
      `select ${TASK_COLUMNS_WITH_DETAILS}
       from task t ${TASK_DETAIL_JOINS}
       where t.workspace_id = $1
       order by (t.due_date is null), t.due_date asc, t.created_at desc`,
      [workspaceId],
    );
  });

export const getTaskFn = createServerFn({ method: "GET" })
  .validator((taskId: string) => z.string().min(1).parse(taskId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: taskId }) => {
    await requireTaskAccess(context.userId, taskId);
    const sql = await getSql();
    const rows = await sql.query<TaskWithDetails>(
      `select ${TASK_COLUMNS_WITH_DETAILS} from task t ${TASK_DETAIL_JOINS} where t.id = $1`,
      [taskId],
    );
    if (!rows[0]) throw new Error("Task not found");
    return rows[0];
  });

const createSchema = z.object({
  companyId: z.string().min(1),
  title: z.string().trim().min(1, "Give this task a title"),
  description: z.string().trim().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().min(1).optional(),
  obligationId: z.string().min(1).optional(),
  documentId: z.string().min(1).optional(),
  steps: z.array(z.string().trim().min(1)).optional(),
});
export type CreateTaskInput = z.infer<typeof createSchema>;

export const createTaskFn = createServerFn({ method: "POST" })
  .validator((input: CreateTaskInput) => createSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const company = await requireCompanyAccess(context.userId, input.companyId);
    if (input.obligationId) {
      const obligation = await requireObligationAccess(context.userId, input.obligationId);
      if (obligation.company_id !== input.companyId) {
        throw new Error("The compliance item must belong to the same company");
      }
    }
    if (input.documentId) {
      const doc = await requireDocumentAccess(context.userId, input.documentId);
      if (doc.company_id !== input.companyId) {
        throw new Error("The document must belong to the same company");
      }
    }
    if (input.assigneeId) {
      const member = await (await getSql()).query(
        `select 1 from workspace_member where workspace_id = $1 and user_id = $2`,
        [company.workspace_id, input.assigneeId],
      );
      if (!member[0]) throw new Error("That person isn't a member of this workspace");
    }

    const sql = await getSql();
    const id = createId("task");
    const rows = await sql.query<Task>(
      `insert into task (
        id, workspace_id, company_id, obligation_id, document_id,
        title, description, priority, due_date, assignee_id, created_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      returning
        id, workspace_id, company_id, obligation_id, document_id,
        title, description, status, priority,
        due_date::text as due_date, assignee_id,
        completed_at::text as completed_at, completed_by,
        created_by, created_at::text as created_at, updated_at::text as updated_at`,
      [
        id,
        company.workspace_id,
        input.companyId,
        input.obligationId ?? null,
        input.documentId ?? null,
        input.title,
        input.description ?? "",
        input.priority ?? "medium",
        input.dueDate || null,
        input.assigneeId ?? null,
        context.userId,
      ],
    );
    const task = rows[0];

    const steps = input.steps ?? [];
    for (let i = 0; i < steps.length; i += 1) {
      await sql.query(`insert into task_step (id, task_id, title, position) values ($1,$2,$3,$4)`, [
        createId("tstep"),
        task.id,
        steps[i],
        i,
      ]);
    }

    logAudit({
      workspaceId: task.workspace_id,
      companyId: task.company_id,
      userId: context.userId,
      action: "TASK_CREATED",
      entityType: "task",
      entityId: task.id,
      metadata: { title: task.title },
    }).catch(() => {});
    return task;
  });

const updateSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
});
export type UpdateTaskInput = z.infer<typeof updateSchema>;

export const updateTaskFn = createServerFn({ method: "POST" })
  .validator((input: UpdateTaskInput) => updateSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireTaskAccess(context.userId, input.taskId);
    const sql = await getSql();
    const existingRows = await sql.query<Task>(`select title, description, priority from task where id = $1`, [
      input.taskId,
    ]);
    const existing = existingRows[0];
    if (!existing) throw new Error("Task not found");

    const rows = await sql.query<Task>(
      `update task set title = $2, description = $3, priority = $4, updated_at = now()
       where id = $1
       returning
        id, workspace_id, company_id, obligation_id, document_id,
        title, description, status, priority,
        due_date::text as due_date, assignee_id,
        completed_at::text as completed_at, completed_by,
        created_by, created_at::text as created_at, updated_at::text as updated_at`,
      [
        input.taskId,
        input.title ?? existing.title,
        input.description ?? existing.description,
        input.priority ?? existing.priority,
      ],
    );
    const task = rows[0];
    logAudit({
      workspaceId: task.workspace_id,
      companyId: task.company_id,
      userId: context.userId,
      action: "TASK_UPDATED",
      entityType: "task",
      entityId: task.id,
    }).catch(() => {});
    return task;
  });

const statusSchema = z.object({ taskId: z.string().min(1), status: z.enum(TASK_STATUSES) });

export const changeTaskStatusFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof statusSchema>) => statusSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireTaskAccess(context.userId, input.taskId);
    const sql = await getSql();
    const beforeRows = await sql.query<{ status: TaskStatus }>(`select status from task where id = $1`, [input.taskId]);
    const before = beforeRows[0];
    if (!before) throw new Error("Task not found");

    const completing = input.status === "done";
    const rows = await sql.query<Task>(
      `update task set
        status = $2,
        completed_at = case when $3 then now() else null end,
        completed_by = case when $3 then $4 else null end,
        updated_at = now()
      where id = $1
      returning
        id, workspace_id, company_id, obligation_id, document_id,
        title, description, status, priority,
        due_date::text as due_date, assignee_id,
        completed_at::text as completed_at, completed_by,
        created_by, created_at::text as created_at, updated_at::text as updated_at`,
      [input.taskId, input.status, completing, context.userId],
    );
    const task = rows[0];
    logAudit({
      workspaceId: task.workspace_id,
      companyId: task.company_id,
      userId: context.userId,
      action: completing ? "TASK_COMPLETED" : "TASK_STATUS_CHANGED",
      entityType: "task",
      entityId: task.id,
      metadata: { from: before.status, to: task.status },
    }).catch(() => {});
    return task;
  });

const assignSchema = z.object({ taskId: z.string().min(1), assigneeId: z.string().min(1).nullable() });

export const assignTaskFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof assignSchema>) => assignSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const task = await requireTaskAccess(context.userId, input.taskId);
    if (input.assigneeId) {
      const member = await (await getSql()).query(
        `select 1 from workspace_member where workspace_id = $1 and user_id = $2`,
        [task.workspace_id, input.assigneeId],
      );
      if (!member[0]) throw new Error("That person isn't a member of this workspace");
    }
    const sql = await getSql();
    const rows = await sql.query<Task & { assignee_name: string | null; assignee_email: string | null }>(
      `update task t set assignee_id = $2, updated_at = now()
       where id = $1
       returning
        id, workspace_id, company_id, obligation_id, document_id,
        title, description, status, priority,
        due_date::text as due_date, assignee_id,
        completed_at::text as completed_at, completed_by,
        created_by, created_at::text as created_at, updated_at::text as updated_at,
        (select name from "user" where id = $2) as assignee_name,
        (select email from "user" where id = $2) as assignee_email`,
      [input.taskId, input.assigneeId],
    );
    const updated = rows[0];
    logAudit({
      workspaceId: updated.workspace_id,
      companyId: updated.company_id,
      userId: context.userId,
      action: "TASK_ASSIGNED",
      entityType: "task",
      entityId: updated.id,
      metadata: { assigneeName: updated.assignee_name ?? updated.assignee_email ?? null },
    }).catch(() => {});
    return updated;
  });

const dueDateSchema = z.object({ taskId: z.string().min(1), dueDate: z.string().min(1).nullable() });

export const changeTaskDueDateFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof dueDateSchema>) => dueDateSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    await requireTaskAccess(context.userId, input.taskId);
    const sql = await getSql();
    const rows = await sql.query<Task>(
      `update task set due_date = $2, updated_at = now()
       where id = $1
       returning
        id, workspace_id, company_id, obligation_id, document_id,
        title, description, status, priority,
        due_date::text as due_date, assignee_id,
        completed_at::text as completed_at, completed_by,
        created_by, created_at::text as created_at, updated_at::text as updated_at`,
      [input.taskId, input.dueDate || null],
    );
    const task = rows[0];
    logAudit({
      workspaceId: task.workspace_id,
      companyId: task.company_id,
      userId: context.userId,
      action: "TASK_DUE_DATE_CHANGED",
      entityType: "task",
      entityId: task.id,
      metadata: { to: task.due_date },
    }).catch(() => {});
    return task;
  });

const linkSchema = z.object({
  taskId: z.string().min(1),
  obligationId: z.string().min(1).nullable(),
  documentId: z.string().min(1).nullable(),
});

/** Sets (or clears) which compliance obligation and/or document this task relates to. */
export const linkTaskFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof linkSchema>) => linkSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const task = await requireTaskAccess(context.userId, input.taskId);
    if (input.obligationId) {
      const obligation = await requireObligationAccess(context.userId, input.obligationId);
      if (obligation.company_id !== task.company_id) throw new Error("The compliance item must belong to the same company");
    }
    if (input.documentId) {
      const doc = await requireDocumentAccess(context.userId, input.documentId);
      if (doc.company_id !== task.company_id) throw new Error("The document must belong to the same company");
    }
    const sql = await getSql();
    const rows = await sql.query<Task>(
      `update task set obligation_id = $2, document_id = $3, updated_at = now()
       where id = $1
       returning
        id, workspace_id, company_id, obligation_id, document_id,
        title, description, status, priority,
        due_date::text as due_date, assignee_id,
        completed_at::text as completed_at, completed_by,
        created_by, created_at::text as created_at, updated_at::text as updated_at`,
      [input.taskId, input.obligationId, input.documentId],
    );
    const updated = rows[0];
    logAudit({
      workspaceId: updated.workspace_id,
      companyId: updated.company_id,
      userId: context.userId,
      action: "TASK_LINKED",
      entityType: "task",
      entityId: updated.id,
    }).catch(() => {});
    return updated;
  });

export const deleteTaskFn = createServerFn({ method: "POST" })
  .validator((taskId: string) => z.string().min(1).parse(taskId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: taskId }) => {
    const task = await requireTaskAccess(context.userId, taskId);
    const sql = await getSql();
    await sql.query(`delete from task where id = $1`, [taskId]);
    logAudit({
      workspaceId: task.workspace_id,
      companyId: task.company_id,
      userId: context.userId,
      action: "TASK_DELETED",
      entityType: "task",
      entityId: taskId,
    }).catch(() => {});
    return null;
  });

// ---- Steps (checklist) ----

export type TaskStepRow = {
  id: string;
  task_id: string;
  title: string;
  position: number;
  done: boolean;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
};

export const listTaskStepsFn = createServerFn({ method: "GET" })
  .validator((taskId: string) => z.string().min(1).parse(taskId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: taskId }) => {
    await requireTaskAccess(context.userId, taskId);
    const sql = await getSql();
    return sql.query<TaskStepRow>(
      `select id, task_id, title, position, done,
              completed_at::text as completed_at, completed_by, created_at::text as created_at
       from task_step where task_id = $1 order by position asc, created_at asc`,
      [taskId],
    );
  });

const addStepSchema = z.object({ taskId: z.string().min(1), title: z.string().trim().min(1) });

export const addTaskStepFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof addStepSchema>) => addStepSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const task = await requireTaskAccess(context.userId, input.taskId);
    const sql = await getSql();
    const posRows = await sql.query<{ next: number }>(
      `select coalesce(max(position), -1) + 1 as next from task_step where task_id = $1`,
      [input.taskId],
    );
    const id = createId("tstep");
    await sql.query(`insert into task_step (id, task_id, title, position) values ($1,$2,$3,$4)`, [
      id,
      input.taskId,
      input.title,
      posRows[0]?.next ?? 0,
    ]);
    logAudit({
      workspaceId: task.workspace_id,
      companyId: task.company_id,
      userId: context.userId,
      action: "TASK_STEP_ADDED",
      entityType: "task",
      entityId: task.id,
      metadata: { title: input.title },
    }).catch(() => {});
    return null;
  });

const toggleStepSchema = z.object({ stepId: z.string().min(1), done: z.boolean() });

export const toggleTaskStepFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof toggleStepSchema>) => toggleStepSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const sql = await getSql();
    const stepRows = await sql.query<{ task_id: string; title: string }>(
      `select task_id, title from task_step where id = $1`,
      [input.stepId],
    );
    const step = stepRows[0];
    if (!step) throw new Error("Step not found");
    const task = await requireTaskAccess(context.userId, step.task_id);
    await sql.query(
      `update task_step set
        done = $2,
        completed_at = case when $2 then now() else null end,
        completed_by = case when $2 then $3 else null end
      where id = $1`,
      [input.stepId, input.done, context.userId],
    );
    logAudit({
      workspaceId: task.workspace_id,
      companyId: task.company_id,
      userId: context.userId,
      action: "TASK_STEP_TOGGLED",
      entityType: "task",
      entityId: task.id,
      metadata: { title: step.title, done: input.done },
    }).catch(() => {});
    return null;
  });

export const deleteTaskStepFn = createServerFn({ method: "POST" })
  .validator((stepId: string) => z.string().min(1).parse(stepId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: stepId }) => {
    const sql = await getSql();
    const stepRows = await sql.query<{ task_id: string; title: string }>(
      `select task_id, title from task_step where id = $1`,
      [stepId],
    );
    const step = stepRows[0];
    if (!step) return null;
    const task = await requireTaskAccess(context.userId, step.task_id);
    await sql.query(`delete from task_step where id = $1`, [stepId]);
    logAudit({
      workspaceId: task.workspace_id,
      companyId: task.company_id,
      userId: context.userId,
      action: "TASK_STEP_DELETED",
      entityType: "task",
      entityId: task.id,
      metadata: { title: step.title },
    }).catch(() => {});
    return null;
  });

// ---- Comments ----

export type TaskComment = {
  id: string;
  task_id: string;
  body: string;
  created_by: string;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
};

export const listTaskCommentsFn = createServerFn({ method: "GET" })
  .validator((taskId: string) => z.string().min(1).parse(taskId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: taskId }) => {
    await requireTaskAccess(context.userId, taskId);
    const sql = await getSql();
    return sql.query<TaskComment>(
      `select tc.id, tc.task_id, tc.body, tc.created_by, tc.created_at::text as created_at,
              u.name as user_name, u.email as user_email
       from task_comment tc
       left join "user" u on u.id = tc.created_by
       where tc.task_id = $1
       order by tc.created_at desc`,
      [taskId],
    );
  });

const addCommentSchema = z.object({ taskId: z.string().min(1), body: z.string().trim().min(1) });

export const addTaskCommentFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof addCommentSchema>) => addCommentSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: input }) => {
    const task = await requireTaskAccess(context.userId, input.taskId);
    const sql = await getSql();
    const id = createId("tcomment");
    await sql.query(`insert into task_comment (id, task_id, workspace_id, body, created_by) values ($1,$2,$3,$4,$5)`, [
      id,
      input.taskId,
      task.workspace_id,
      input.body,
      context.userId,
    ]);
    logAudit({
      workspaceId: task.workspace_id,
      companyId: task.company_id,
      userId: context.userId,
      action: "TASK_COMMENT_ADDED",
      entityType: "task",
      entityId: task.id,
    }).catch(() => {});
    return null;
  });

export const deleteTaskCommentFn = createServerFn({ method: "POST" })
  .validator((commentId: string) => z.string().min(1).parse(commentId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: commentId }) => {
    const sql = await getSql();
    const rows = await sql.query<{ task_id: string }>(`select task_id from task_comment where id = $1`, [commentId]);
    const row = rows[0];
    if (!row) return null;
    await requireTaskAccess(context.userId, row.task_id);
    await sql.query(`delete from task_comment where id = $1`, [commentId]);
    return null;
  });

// ---- Activity ----

export const listTaskActivityFn = createServerFn({ method: "GET" })
  .validator((taskId: string) => z.string().min(1).parse(taskId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: taskId }) => {
    await requireTaskAccess(context.userId, taskId);
    const sql = await getSql();
    return sql.query<AuditLogRow>(
      `select a.id, a.action, a.entity_type, a.metadata, a.created_at::text as created_at,
              u.name as user_name, u.email as user_email
       from audit_log a
       left join "user" u on u.id = a.user_id
       where a.entity_type = 'task' and a.entity_id = $1
       order by a.created_at desc`,
      [taskId],
    );
  });
