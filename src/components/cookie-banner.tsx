import { Link } from "@tanstack/react-router";
import { usePersistedState } from "@/lib/use-persisted-state";

/**
 * Honest cookie notice, not a fake preference center — LegalPak has exactly
 * one cookie (the session cookie) and no analytics/advertising trackers to
 * opt in or out of (see /privacy), so this is a disclosure with a single
 * acknowledgement, not a bank of toggles for categories that don't exist.
 *
 * Rendered at the root so it appears over both the dark marketing shell and
 * the light functional app-shell — styled with its own fixed dark palette
 * rather than the `--color-*` tokens, since those flip between light/dark
 * depending on whether the page is nested inside `.luxury`, and a banner
 * living outside that scope would otherwise mismatch the page under it.
 */
export function CookieBanner() {
  const [dismissed, setDismissed] = usePersistedState("legalpak:cookie-notice-dismissed", false);

  if (dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0a0b0d] px-4 py-4 text-[#f2ede2] shadow-[0_-4px_24px_rgba(0,0,0,0.3)] sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-[#f2ede2]/90">
          LegalPak uses one essential session cookie to keep you signed in, and browser storage to
          save your in-progress drafts. No ads, no third-party tracking.{" "}
          <Link to="/privacy" className="underline hover:text-[#d4af37]">
            Privacy Policy
          </Link>
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="min-h-11 shrink-0 rounded-full bg-[#d4af37] px-6 text-xs font-medium tracking-widest text-black uppercase hover:opacity-90"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
