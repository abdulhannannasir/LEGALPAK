import { createFileRoute } from "@tanstack/react-router";
import { AttorneyProfile } from "@/components/attorney-profile";
import { ConsultationForm } from "@/components/consultation-form";
import { GlassNavbar } from "@/components/marketing/GlassNavbar";

export const Route = createFileRoute("/consult")({
  component: ConsultPage,
  head: () => ({
    meta: [
      { title: "Consult Corporate Counsel — LegalPak" },
      {
        name: "description",
        content:
          "Request a consultation for cap table terms, cross-border jurisdiction clauses, SECP disputes, share restructuring, or a regulatory audit in Pakistan.",
      },
    ],
  }),
});

const DISCIPLINES = [
  {
    title: "Corporate Governance & SECP Advisory",
    body: "Incorporation, Form A/Form 9 handling, director induction, and share issues under the Companies Act 2017.",
  },
  {
    title: "Commercial & Cross-Border Transactions",
    body: "Master services agreements, joint ventures, and licensing under the Contract Act 1872.",
  },
  {
    title: "Digital Markets & Tech Compliance",
    body: "Data handling, platform terms, and compliance questions for multi-sided digital platforms.",
  },
];

function ConsultPage() {
  return (
    <div className="marketing-surface min-h-screen bg-bg">
      <GlassNavbar />
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-16">
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Legal Advisory Desk</p>
          <h1 className="mt-3 font-display text-3xl text-fg sm:text-4xl">Need bespoke counsel?</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:mx-0">
            Cap table terms, cross-border jurisdiction clauses, SECP disputes, share restructuring,
            or a regulatory audit — some matters need a person, not a form. Tell us what's going on
            and we'll get back to you.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ConsultationForm defaultTopic="" />
          <div className="space-y-4">
            <AttorneyProfile />
            <div className="space-y-3">
              {DISCIPLINES.map((d) => (
                <div key={d.title} className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-sm">
                  <p className="text-sm font-medium text-fg">{d.title}</p>
                  <p className="mt-1 text-xs text-muted">{d.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted">
        LegalPak drafts packs for eZfile. SECP still receives the PIN-signed filing. Not a
        substitute for a licensed Pakistani advocate.
      </footer>
    </div>
  );
}
