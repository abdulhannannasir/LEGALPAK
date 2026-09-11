import { getSql } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";
import { deadlineReminderHtml, deadlineReminderSubject } from "@/lib/email/deadline-reminder";
import { createId } from "./id";
import { MATTER_TYPE_LABEL, type MatterType } from "./workflow";

/** Days-before-due checkpoints a reminder fires at — exact matches, not "at most N days". */
export const REMINDER_THRESHOLDS_DAYS = [14, 7, 3, 1];

function appBaseUrl(): string {
  return (process.env.BETTER_AUTH_URL || "http://localhost:8080").replace(/\/$/, "");
}

type DueMatter = {
  id: string;
  workspace_id: string;
  type: MatterType;
  title: string;
  due_date: string;
  company_name: string;
  days_until_due: number;
};

/**
 * Sends an email to every workspace member for each open matter that has
 * just crossed a reminder checkpoint (14/7/3/1 days before its due date),
 * skipping any checkpoint already logged for that matter so a daily cron
 * run never double-sends. Failures on one matter don't block the rest —
 * they're just counted and surfaced in the result.
 */
export async function runDeadlineReminders(): Promise<{
  checked: number;
  sent: number;
  failed: number;
}> {
  const sql = await getSql();
  const dueMatters = await sql.query<DueMatter>(
    `select m.id, m.workspace_id, m.type, m.title, m.due_date::text as due_date, c.name as company_name,
            (m.due_date - current_date) as days_until_due
     from matter m
     join company c on c.id = m.company_id
     where m.due_date is not null
       and m.status not in ('filed', 'closed')
       and (m.due_date - current_date) between 0 and 14`,
  );

  let sent = 0;
  let failed = 0;

  for (const matter of dueMatters) {
    const daysBefore = REMINDER_THRESHOLDS_DAYS.find((d) => d === matter.days_until_due);
    if (daysBefore === undefined) continue;

    const alreadySent = await sql.query<{ id: string }>(
      `select id from deadline_reminder_log where matter_id = $1 and days_before = $2`,
      [matter.id, daysBefore],
    );
    if (alreadySent.length > 0) continue;

    try {
      const recipients = await sql.query<{ email: string }>(
        `select distinct u.email
         from workspace_member wm
         join "user" u on u.id = wm.user_id
         where wm.workspace_id = $1`,
        [matter.workspace_id],
      );
      const emails = recipients.map((r) => r.email);
      // Zero recipients means the workspace membership has no matching
      // real user row (e.g. the disabled-auth dev user) — nothing was
      // actually sent, so this checkpoint isn't marked as handled and can
      // still fire once real recipients exist... except day-count moves on
      // tomorrow regardless, so in practice this is a diagnostic signal
      // (see `failed`) rather than a retryable state.
      if (emails.length === 0) {
        failed++;
        continue;
      }
      const input = {
        companyName: matter.company_name,
        matterTitle: matter.title,
        matterTypeLabel: MATTER_TYPE_LABEL[matter.type],
        dueDate: matter.due_date,
        daysBefore,
        matterUrl: `${appBaseUrl()}/matters/${matter.id}`,
      };
      await sendEmail({
        to: emails,
        subject: deadlineReminderSubject(input),
        html: deadlineReminderHtml(input),
      });
      await sql.query(
        `insert into deadline_reminder_log (id, matter_id, days_before) values ($1, $2, $3)
         on conflict (matter_id, days_before) do nothing`,
        [createId("reminder"), matter.id, daysBefore],
      );
      sent++;
    } catch {
      failed++;
    }
  }

  return { checked: dueMatters.length, sent, failed };
}
