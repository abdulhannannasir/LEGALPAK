import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { SignedIn, SignedOut } from "@/lib/auth/gates";

const LINKS = [
  { to: "/personal", label: "Personal" },
  { to: "/business", label: "Business" },
  { to: "/consult", label: "Consult Counsel" },
  { to: "/", hash: "faq", label: "FAQ" },
] as const;

/**
 * Top marketing nav — plain light chrome shared with the rest of the app's
 * design system (no separate dark/glass theme). Mobile gets its own bottom
 * sheet rather than a shrunk copy of the desktop links.
 */
export function GlassNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="font-display text-xl tracking-tight text-fg">
            LegalPak
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                hash={"hash" in l ? l.hash : undefined}
                className="text-sm font-medium text-muted transition-colors hover:text-fg"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <SignedIn>
              <Link
                to="/dashboard"
                className="hidden min-h-9 items-center rounded-[var(--radius-sm)] bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-accent sm:inline-flex"
              >
                Dashboard
              </Link>
            </SignedIn>
            <SignedOut>
              <Link
                to="/login"
                className="hidden text-sm font-medium text-fg underline underline-offset-4 sm:inline-block"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="hidden min-h-9 items-center rounded-[var(--radius-sm)] bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-accent sm:inline-flex"
              >
                Get started
              </Link>
            </SignedOut>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] border border-border text-fg md:hidden"
            >
              {open ? <X className="size-4" strokeWidth={1.75} /> : <Menu className="size-4" strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-border bg-surface px-4 py-3 md:hidden">
            <ul className="space-y-1">
              {LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    hash={"hash" in l ? l.hash : undefined}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center text-sm font-medium text-fg"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2 border-t border-border pt-3">
              <SignedIn>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-sm)] bg-primary text-sm font-medium text-primary-fg"
                >
                  Dashboard
                </Link>
              </SignedIn>
              <SignedOut>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-sm)] border border-border text-sm font-medium text-fg"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-sm)] bg-primary text-sm font-medium text-primary-fg"
                >
                  Get started
                </Link>
              </SignedOut>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
