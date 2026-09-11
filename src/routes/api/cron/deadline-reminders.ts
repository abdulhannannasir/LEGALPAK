import { createFileRoute } from "@tanstack/react-router";
import { runDeadlineReminders } from "@/lib/legalpak/reminders";

/**
 * Triggered daily by Vercel Cron (see vercel.json). Guarded by CRON_SECRET —
 * Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on its own
 * invocations when that env var is set, so this is a no-op check until it is.
 */
export const Route = createFileRoute("/api/cron/deadline-reminders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.CRON_SECRET;
        if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
          return new Response("Unauthorized", { status: 401 });
        }
        const result = await runDeadlineReminders();
        return new Response(JSON.stringify(result), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
