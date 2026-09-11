import { Resend } from "resend";

let client: Resend | null = null;

/** Lazily constructed so importing this module doesn't require the key to already be set. */
function getResendClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");
    client = new Resend(apiKey);
  }
  return client;
}

// Resend's shared sandbox sender works without a verified domain, but only
// delivers to the Resend account's own signup address — set RESEND_FROM_EMAIL
// once a domain is verified to send to real recipients.
const DEFAULT_FROM = "LegalPak <onboarding@resend.dev>";

export async function sendEmail(input: {
  to: string[];
  subject: string;
  html: string;
}): Promise<void> {
  if (input.to.length === 0) return;
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  if (error) throw new Error(error.message);
}
