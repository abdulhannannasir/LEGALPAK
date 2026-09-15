import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  Briefcase,
  CalendarClock,
  CreditCard,
  FolderOpen,
  Gavel,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Scale,
  X,
} from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { isMarketingRoute } from "@/lib/marketing-routes";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/business", label: "Business", icon: Briefcase },
  { to: "/personal", label: "Personal", icon: HeartHandshake },
  { to: "/contracts", label: "Contracts", icon: Scale },
  { to: "/documents", label: "Documents", icon: FolderOpen },
  { to: "/compliance", label: "Compliance", icon: CalendarClock },
  { to: "/citizen", label: "Legal Help", icon: LifeBuoy },
  { to: "/consult", label: "Consult Counsel", icon: Gavel },
  { to: "/billing", label: "Billing", icon: CreditCard },
] as const;

// The first 4 get a persistent bottom tab on mobile; the rest live behind "More".
const MOBILE_PRIMARY = NAV.slice(0, 4);
const MOBILE_MORE = NAV.slice(4);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (isMarketingRoute(pathname)) {
    return <>{children}</>;
  }
  return <FunctionalShell pathname={pathname}>{children}</FunctionalShell>;
}

function FunctionalShell({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-border bg-primary text-primary-fg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="font-display text-xl tracking-tight">
            LegalPak
            <span className="ml-2 font-sans text-xs font-normal opacity-70">
              SECP · Contract Act 1872
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <p className="hidden text-xs opacity-70 sm:block">Drafting aid — not a filing API</p>
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <Link to="/login" className="text-sm font-medium underline underline-offset-4">
                Sign in
              </Link>
            </SignedOut>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl">
        {/* Desktop sidebar */}
        <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border py-6 pr-4 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-[var(--radius-sm)] px-3 text-sm font-medium",
                  active ? "bg-primary text-primary-fg" : "text-muted hover:bg-surface hover:text-fg",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-8 md:pb-6">{children}</main>
      </div>

      {/* Mobile bottom tab bar — distinct from the desktop sidebar, not a shrunk copy of it */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface md:hidden">
        <div className="flex items-stretch">
          {MOBILE_PRIMARY.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
              moreOpen ? "text-primary" : "text-muted",
            )}
          >
            {moreOpen ? <X className="size-5" strokeWidth={1.75} /> : <Menu className="size-5" strokeWidth={1.75} />}
            More
          </button>
        </div>
        {moreOpen && (
          <div className="grid grid-cols-2 gap-1 border-t border-border p-2">
            {MOBILE_MORE.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className="flex min-h-11 items-center gap-2.5 rounded-[var(--radius-sm)] px-3 text-sm font-medium text-fg hover:bg-bg"
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted">
        <p>
          LegalPak drafts packs for eZfile. SECP still receives the PIN-signed filing. Not a
          substitute for a licensed Pakistani advocate.
        </p>
        <p className="mt-2 flex justify-center gap-3">
          <Link to="/privacy" className="underline hover:text-fg">
            Privacy Policy
          </Link>
          <Link to="/terms" className="underline hover:text-fg">
            Terms of Service
          </Link>
        </p>
      </footer>
    </div>
  );
}
