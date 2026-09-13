import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  BookOpen,
  Building2,
  CalendarClock,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Gavel,
  HeartHandshake,
  HelpCircle,
  Inbox,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  Rocket,
  Scale,
  ScrollText,
  Send,
  Users,
} from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { isMarketingRoute } from "@/lib/marketing-routes";
import { computeScrollEdges } from "@/lib/nav-scroll";

const NAV = [
  { to: "/", label: "Desk", icon: Scale },
  { to: "/dashboard", label: "Companies", icon: LayoutDashboard },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/incorporation", label: "Register Company", icon: Rocket },
  { to: "/corporate-filings", label: "Form 21 & Form 45", icon: ScrollText },
  { to: "/notices", label: "Legal Notices", icon: Send },
  { to: "/citizen", label: "Citizen legal help", icon: HeartHandshake },
  { to: "/help-desk", label: "Help Desk & Rights Navigator", icon: LifeBuoy },
  { to: "/compliance", label: "Compliance calendar", icon: CalendarClock },
  { to: "/tax-assistant", label: "Tax Assistant (FBR)", icon: Landmark },
  { to: "/accounts", label: "Financial statements", icon: FileSpreadsheet },
  { to: "/form-a", label: "Form A", icon: FileText },
  { to: "/form-9", label: "Form 9 / directors", icon: Users },
  { to: "/contracts", label: "Contracts", icon: Building2 },
  { to: "/consult", label: "Consult counsel", icon: Gavel },
  { to: "/consultations", label: "Consultation requests", icon: Inbox },
  { to: "/guide", label: "Filing guide", icon: BookOpen },
  { to: "/", hash: "faq", label: "FAQ", icon: HelpCircle },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (isMarketingRoute(pathname)) {
    return <>{children}</>;
  }
  return <FunctionalShell pathname={pathname}>{children}</FunctionalShell>;
}

function FunctionalShell({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const navRef = useRef<HTMLElement>(null);
  const [scrollState, setScrollState] = useState({ atStart: true, atEnd: true });

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    function update() {
      if (!el) return;
      setScrollState(computeScrollEdges(el));
    }
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

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
      <div className="mx-auto flex max-w-6xl flex-col md:flex-row">
        <div className="relative border-b border-border md:w-56 md:border-b-0 md:border-r">
          <nav ref={navRef} className="flex gap-1 overflow-x-auto p-2 md:flex-col md:py-6">
            {NAV.map((item) => {
              const hash = "hash" in item ? item.hash : undefined;
              const active = pathname === item.to && !hash;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  hash={hash}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm",
                    active
                      ? "bg-primary text-primary-fg"
                      : "text-muted hover:bg-surface hover:text-fg",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {!scrollState.atStart && (
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-bg to-transparent md:hidden" />
          )}
          {!scrollState.atEnd && (
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-bg to-transparent md:hidden" />
          )}
        </div>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
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
