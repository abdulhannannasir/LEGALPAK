import { Link } from "@tanstack/react-router";
import { usePersistedState } from "@/lib/use-persisted-state";

/**
 * Honest cookie notice, not a fake preference center — LegalPak has exactly
 * one cookie (the session cookie) and no analytics/advertising trackers to
 * opt in or out of (see /privacy), so this is a disclosure with a single
 * acknowledgement, not a bank of toggles for categories that don't exist.
 */
export function CookieBanner() {
  const [dismissed, setDismissed] = usePersistedState("legalpak:cookie-notice-dismissed", false);

  if (dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-primary px-4 py-4 text-primary-fg shadow-lg sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed opacity-90">
          LegalPak uses one essential session cookie to keep you signed in, and browser storage to
          save your in-progress drafts. No ads, no third-party tracking.{" "}
          <Link to="/privacy" className="underline">
            Privacy Policy
          </Link>
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="min-h-11 shrink-0 rounded-[var(--radius-sm)] bg-bg px-6 text-sm font-medium text-fg hover:bg-surface"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
