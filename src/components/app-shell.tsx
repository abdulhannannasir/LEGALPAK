import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import { ArrowUpRight, BookOpen, Building2, ChevronDown, CreditCard, FileCheck2, FileSpreadsheet, FileText, LayoutDashboard, Scale, Users } from "lucide-react";

const WORKFLOWS = [
  { to: "/accounts", label: "Financial statements", icon: FileSpreadsheet },
  { to: "/form-a", label: "Annual return", icon: FileCheck2 },
  { to: "/form-9", label: "Director changes", icon: Users },
  { to: "/contracts", label: "Contracts", icon: FileText },
];
const RESOURCES = [
  { to: "/guide", label: "Filing guide", icon: BookOpen },
  { to: "/checkout", label: "Pay with EasyPaisa", icon: CreditCard },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-border bg-primary text-primary-fg shadow-sm">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-5">
            <Link to="/" className="flex shrink-0 items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-primary-fg/10 text-xs font-semibold ring-1 ring-primary-fg/15">LP</span>
              <span className="font-display text-[22px] tracking-tight">LegalPak</span>
            </Link>
            <div className="hidden h-6 w-px bg-primary-fg/15 sm:block" />
            <button className="hidden items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-primary-fg/80 transition hover:bg-primary-fg/10 hover:text-primary-fg sm:flex">
              <Building2 className="size-4" />
              <span>Company workspace</span>
              <ChevronDown className="size-3.5 opacity-60" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-primary-fg/55 md:block">Drafting aid · not a filing API</span>
            <div className="grid size-9 place-items-center rounded-full bg-primary-fg/10 text-xs font-semibold ring-1 ring-primary-fg/15">LP</div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1440px]">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-surface/55 md:block">
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col px-3 py-5">
            <nav aria-label="Main navigation" className="space-y-6">
              <div>
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/70">Workspace</p>
                <Link to="/" className={cn("flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors", isActive("/") ? "bg-primary text-primary-fg shadow-sm" : "text-muted hover:bg-bg hover:text-fg")}>
                  <LayoutDashboard className="size-4" strokeWidth={1.8} />Dashboard
                </Link>
              </div>
              <div>
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/70">Workflows</p>
                <div className="space-y-0.5">
                  {WORKFLOWS.map((item) => {
                    const Icon = item.icon;
                    return <Link key={item.to} to={item.to} className={cn("flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors", isActive(item.to) ? "bg-primary/10 font-medium text-primary" : "text-muted hover:bg-bg hover:text-fg")}><Icon className="size-4" strokeWidth={1.8} />{item.label}</Link>;
                  })}
                </div>
              </div>
              <div>
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/70">Resources</p>
                {RESOURCES.map((item) => {
                  const Icon = item.icon;
                  return <Link key={item.to} to={item.to} className={cn("flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors", isActive(item.to) ? "bg-primary/10 font-medium text-primary" : "text-muted hover:bg-bg hover:text-fg")}><Icon className="size-4" strokeWidth={1.8} />{item.label}</Link>;
                })}
              </div>
            </nav>
            <div className="mt-auto rounded-xl border border-border bg-bg/70 p-3">
              <div className="flex items-start gap-2.5"><Scale className="mt-0.5 size-4 shrink-0 text-accent" /><div><p className="text-xs font-semibold">SECP drafting desk</p><p className="mt-1 text-[11px] leading-4 text-muted">Prepare, review and PIN-sign through the official filing system.</p></div></div>
              <a href="https://leap.secp.gov.pk" target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">Open SECP eZfile <ArrowUpRight className="size-3" /></a>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="border-b border-border bg-surface md:hidden">
            <nav className="flex gap-1 overflow-x-auto px-3 py-2" aria-label="Mobile navigation">
              <Link to="/" className={cn("shrink-0 rounded-lg px-3 py-2 text-sm", isActive("/") ? "bg-primary text-primary-fg" : "text-muted")}>Dashboard</Link>
              {WORKFLOWS.map((item) => <Link key={item.to} to={item.to} className={cn("shrink-0 rounded-lg px-3 py-2 text-sm", isActive(item.to) ? "bg-primary text-primary-fg" : "text-muted")}>{item.label}</Link>)}
            </nav>
          </div>
          <main className="min-w-0 px-4 py-7 sm:px-6 lg:px-10 lg:py-9">{children}</main>
        </div>
      </div>

      <footer className="border-t border-border bg-surface px-4 py-6 text-center text-xs text-muted">LegalPak is a drafting and compliance aid. SECP receives the PIN-signed filing through its official system. Not a substitute for a licensed Pakistani advocate.</footer>
    </div>
  );
}
