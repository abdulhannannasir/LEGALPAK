import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { SignedIn, SignedOut } from "@/lib/auth/gates";

const LINKS = [
  { to: "/", label: "Global Desk" },
  { to: "/tax-assistant", label: "Digital Markets" },
  { to: "/compliance", label: "Governance Audit" },
  { to: "/citizen", label: "Citizen Desk" },
  { to: "/consult", label: "Private Counsel" },
  { to: "/", hash: "faq", label: "FAQ" },
] as const;

/**
 * Floating glassmorphic navbar for the marketing shell. Below `md` it
 * collapses into a bottom-sheet-style drawer instead of trying to cram four
 * wide-tracking labels into a phone-width bar.
 */
export function GlassNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-4 z-40 flex justify-center px-4">
        <div className="flex w-full max-w-5xl items-center justify-between gap-4 rounded-full border border-white/10 bg-black/40 px-5 py-3 backdrop-blur-md">
          <Link
            to="/"
            className="text-lg tracking-wide text-[var(--lux-fg)]"
            style={{ fontFamily: "var(--font-lux-display)" }}
          >
            Legal<span className="text-[var(--lux-gold)]">Pak</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                hash={"hash" in l ? l.hash : undefined}
                className="text-xs font-medium tracking-widest text-[var(--lux-muted)] uppercase transition-colors hover:text-[var(--lux-gold)]"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <SignedIn>
              <Link
                to="/dashboard"
                className="hidden rounded-full border border-[var(--lux-border-strong)] px-4 py-1.5 text-xs font-medium tracking-wide text-[var(--lux-gold)] transition-colors hover:bg-[var(--lux-gold)] hover:text-black sm:inline-block"
              >
                Enter Desk
              </Link>
            </SignedIn>
            <SignedOut>
              <Link
                to="/login"
                className="hidden rounded-full border border-[var(--lux-border-strong)] px-4 py-1.5 text-xs font-medium tracking-wide text-[var(--lux-gold)] transition-colors hover:bg-[var(--lux-gold)] hover:text-black sm:inline-block"
              >
                Sign In
              </Link>
            </SignedOut>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-[var(--lux-fg)] md:hidden"
            >
              {open ? (
                <X className="size-4" strokeWidth={1.75} />
              ) : (
                <Menu className="size-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.nav
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-[var(--lux-border)] bg-[var(--lux-bg-raised)] p-6 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />
              <ul className="space-y-1">
                {LINKS.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      hash={"hash" in l ? l.hash : undefined}
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center text-sm font-medium tracking-widest text-[var(--lux-fg)] uppercase"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-white/10 pt-4">
                <SignedIn>
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center justify-center rounded-full border border-[var(--lux-border-strong)] text-sm font-medium text-[var(--lux-gold)]"
                  >
                    Enter Desk
                  </Link>
                </SignedIn>
                <SignedOut>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center justify-center rounded-full border border-[var(--lux-border-strong)] text-sm font-medium text-[var(--lux-gold)]"
                  >
                    Sign In
                  </Link>
                </SignedOut>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
