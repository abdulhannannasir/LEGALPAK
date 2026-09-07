import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import {
  BookOpen,
  Building2,
  FileSpreadsheet,
  FileText,
  Scale,
  Users,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Desk", icon: Scale },
  { to: "/accounts", label: "Financial statements", icon: FileSpreadsheet },
  { to: "/form-a", label: "Form A", icon: FileText },
  { to: "/form-9", label: "Form 9 / directors", icon: Users },
  { to: "/contracts", label: "Contracts", icon: Building2 },
  { to: "/guide", label: "Filing guide", icon: BookOpen },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
          <p className="hidden text-xs opacity-70 sm:block">Drafting aid — not a filing API</p>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col md:flex-row">
        <nav className="flex gap-1 overflow-x-auto border-b border-border p-2 md:w-56 md:flex-col md:border-b-0 md:border-r md:py-6">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm",
                  active ? "bg-primary text-primary-fg" : "text-muted hover:bg-surface hover:text-fg",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted">
        LegalPak drafts packs for eZfile. SECP still receives the PIN-signed filing. Not a substitute for a
        licensed Pakistani advocate.
      </footer>
    </div>
  );
}
