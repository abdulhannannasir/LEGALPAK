import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The "What happened?" hub now lives at /citizen — the nav entry point for
 * Citizen Legal Help. This route stays only so old /help-desk links and
 * bookmarks keep working.
 */
export const Route = createFileRoute("/help-desk/")({
  beforeLoad: () => {
    throw redirect({ to: "/citizen" });
  },
});
