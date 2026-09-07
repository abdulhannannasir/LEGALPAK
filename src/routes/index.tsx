import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileCheck2, FileSpreadsheet, FileText, Scale, Users } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

const CARDS = [
  { to: "/accounts", title: "Financial statements", kicker: "Accounts", body: "Classify filing requirements, check applicable clocks, and prepare the supporting pack.", icon: FileSpreadsheet },
  { to: "/form-a", title: "Annual return", kicker: "Form A", body: "Determine the correct annual return path and prepare the information needed for eZfile.", icon: FileCheck2 },
  { to: "/form-9", title: "Director changes", kicker: "Form 9", body: "Handle induction or cessation, consent requirements, board composition and the filing clock.", icon: Users },
  { to: "/contracts", title: "Contracts", kicker: "Drafting", body: "Build formal Pakistan-law agreements for services, employment, rent, NDA, JV and more.", icon: Scale },
];

function Home() {
  return <div className="mx-auto max-w-6xl">
    <section className="relative overflow-hidden rounded-2xl border border-border bg-surface px-6 py-8 shadow-sm sm:px-9 sm:py-10">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Pakistan corporate desk</span><span className="text-xs text-muted">SECP · Contract Act 1872</span></div>
        <h1 className="mt-5 max-w-3xl font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">Your legal workbench for Pakistani corporate matters.</h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">Prepare filing packs and commercial contracts in one place. LegalPak helps you reason through requirements, build documents, and finish the filing through the official SECP system.</p>
        <div className="mt-7 flex flex-wrap gap-3"><Link to="/accounts" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg shadow-sm transition hover:-translate-y-px hover:shadow-md">Start a filing <ArrowRight className="size-4" /></Link><Link to="/contracts" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-bg px-4 text-sm font-semibold transition hover:border-primary/30 hover:bg-surface">Draft a contract <FileText className="size-4" /></Link></div>
      </div>
    </section>

    <section className="mt-10"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/70">Workflows</p><h2 className="mt-1 font-display text-2xl">What are you working on?</h2></div><span className="hidden text-xs text-muted sm:block">Choose a workflow to begin</span></div>
      <div className="grid gap-4 sm:grid-cols-2">{CARDS.map((card) => { const Icon = card.icon; return <Link key={card.to} to={card.to} className="group rounded-xl border border-border bg-surface p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"><div className="flex items-start justify-between gap-4"><div className="grid size-10 place-items-center rounded-lg bg-primary/8 text-primary"><Icon className="size-5" strokeWidth={1.8} /></div><ArrowRight className="mt-1 size-4 text-muted/50 transition-transform group-hover:translate-x-1 group-hover:text-primary" /></div><p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">{card.kicker}</p><h3 className="mt-1 font-display text-xl">{card.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{card.body}</p></Link>; })}</div>
    </section>

    <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]"><div className="rounded-xl border border-border bg-surface p-5"><div className="flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-bg"><Scale className="size-4 text-accent" /></div><div><h2 className="text-sm font-semibold">A clear filing handoff</h2><p className="mt-1 text-sm leading-6 text-muted">LegalPak prepares the work; the authorised filer reviews it and PIN-signs through SECP eZfile.</p></div></div></div><Link to="/guide" className="flex min-h-16 items-center justify-between gap-8 rounded-xl border border-border bg-bg px-5 text-sm font-semibold transition hover:border-primary/30 hover:bg-surface">Read the filing guide <ArrowRight className="size-4" /></Link></section>
  </div>;
}
