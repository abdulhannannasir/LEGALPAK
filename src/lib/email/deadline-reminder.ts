export type DeadlineReminderInput = {
  companyName: string;
  matterTitle: string;
  matterTypeLabel: string;
  dueDate: string;
  daysBefore: number;
  matterUrl: string;
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function deadlineReminderSubject(input: DeadlineReminderInput): string {
  const when = input.daysBefore === 1 ? "tomorrow" : `in ${input.daysBefore} days`;
  return `${input.matterTypeLabel} due ${when} — ${input.companyName}`;
}

export function deadlineReminderHtml(input: DeadlineReminderInput): string {
  const when = input.daysBefore === 1 ? "tomorrow" : `in ${input.daysBefore} days`;
  return `<!doctype html>
<html>
  <body style="font-family: Georgia, 'Times New Roman', serif; background: #f6f4f0; padding: 32px; color: #1a1916;">
    <div style="max-width: 480px; margin: 0 auto; background: #fffcf8; border: 1px solid #e6e1d8; border-radius: 12px; padding: 32px;">
      <p style="font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #6f6b64; margin: 0 0 8px;">LegalPak reminder</p>
      <h1 style="font-size: 22px; margin: 0 0 16px;">${escapeHtml(input.matterTypeLabel)} due ${when}</h1>
      <p style="font-size: 14px; line-height: 1.6; color: #1a1916; margin: 0 0 4px;">
        <strong>${escapeHtml(input.companyName)}</strong> — ${escapeHtml(input.matterTitle)}
      </p>
      <p style="font-size: 14px; color: #6f6b64; margin: 0 0 24px;">Due ${escapeHtml(input.dueDate)}</p>
      <a href="${escapeHtml(input.matterUrl)}" style="display: inline-block; background: #243447; color: #f6f4f0; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px;">
        Open matter
      </a>
      <p style="font-size: 12px; color: #6f6b64; margin: 32px 0 0;">
        LegalPak drafts packs for eZfile. SECP still receives the PIN-signed filing. Not a substitute for a
        licensed Pakistani advocate.
      </p>
    </div>
  </body>
</html>`;
}
