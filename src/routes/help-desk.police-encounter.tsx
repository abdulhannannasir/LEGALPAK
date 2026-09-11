import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EmergencyRibbon } from "@/components/citizen/emergency-ribbon";
import { AdvocateEscalationCard } from "@/components/citizen/advocate-escalation-card";
import { Field, Select } from "@/components/ui/field";
import { OFFENSE_LOOKUP, POLICE_RIGHTS_NOTES, findOffense } from "@/lib/citizen/help-desk";

export const Route = createFileRoute("/help-desk/police-encounter")({
  component: PoliceEncounterPage,
  head: () => ({
    meta: [
      { title: "Police Stop & Bail Rights — Help Desk — LegalPak" },
      {
        name: "description",
        content:
          "Your rights during a police stop in Pakistan — search and checkpoint rights, FIR vs. non-cognizable offences, and pre-arrest bail under Section 498 CrPC.",
      },
    ],
  }),
});

function PoliceEncounterPage() {
  const [selectedOffense, setSelectedOffense] = useState(OFFENSE_LOOKUP[0].offense);
  const entry = findOffense(selectedOffense);

  return (
    <div className="space-y-6">
      <EmergencyRibbon />
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Help Desk / پولیس تفتیش و ضمانت
        </p>
        <h1 className="font-display text-3xl">Police Stop, Remand & Bailable Rights</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          A quick, plain-language guide — not a substitute for an advocate once a case is actually
          registered against you.
        </p>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Search & checkpoint rights</h2>
        <p className="mt-2 text-sm text-muted">{POLICE_RIGHTS_NOTES.checkpoint}</p>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">FIR vs. non-cognizable offense checker</h2>
        <p className="mt-2 text-sm text-muted">{POLICE_RIGHTS_NOTES.firVsComplaint}</p>
        <div className="mt-4 max-w-md">
          <Field label="Select the offense involved">
            <Select value={selectedOffense} onChange={(e) => setSelectedOffense(e.target.value)}>
              {OFFENSE_LOOKUP.map((o) => (
                <option key={o.offense} value={o.offense}>
                  {o.offense}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {entry && (
          <div
            className={`mt-4 rounded-[var(--radius-md)] border p-4 text-sm ${
              entry.cognizable ? "border-border bg-bg" : "border-danger bg-flag-high text-danger"
            }`}
          >
            <p className="font-medium">
              {entry.cognizable
                ? "Cognizable (Section 154 CrPC) — police can register an FIR directly."
                : "Non-cognizable (Section 155 CrPC) — needs a Magistrate's order first."}
            </p>
            <p className="mt-1 text-xs">{entry.note}</p>
          </div>
        )}
        <p className="mt-3 text-xs text-muted">
          This list is representative, not exhaustive — always confirm classification against the
          First Schedule of the Code of Criminal Procedure, 1898.
        </p>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Bail eligibility — pre-arrest bail</h2>
        <p className="mt-2 text-sm text-muted">{POLICE_RIGHTS_NOTES.preArrestBail}</p>
      </section>

      <AdvocateEscalationCard specialty="Criminal" />
    </div>
  );
}
