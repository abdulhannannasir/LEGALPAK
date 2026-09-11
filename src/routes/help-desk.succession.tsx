import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { EmergencyRibbon } from "@/components/citizen/emergency-ribbon";
import { AdvocateEscalationCard } from "@/components/citizen/advocate-escalation-card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PackOutput } from "@/components/pack-output";
import { SplitScreen } from "@/components/split-screen";
import { usePersistedState } from "@/lib/use-persisted-state";
import {
  generateCivilPartitionBrief,
  generateNadraSfuChecklist,
  successionRoute,
  type SuccessionInput,
} from "@/lib/citizen/help-desk";

export const Route = createFileRoute("/help-desk/succession")({
  component: SuccessionPage,
  head: () => ({
    meta: [
      { title: "Inheritance & Succession — Help Desk — LegalPak" },
      {
        name: "description",
        content:
          "Find out whether your inheritance case in Pakistan needs the NADRA Succession Facilitation Unit or a civil court partition suit, and get the right checklist.",
      },
    ],
  }),
});

const emptyForm: SuccessionInput = {
  deceasedName: "",
  allHeirsAliveAndBiometric: "yes",
  disputedTitleOrMinorHeir: "no",
  heirs: "",
  city: "",
};

function SuccessionPage() {
  const [form, setForm] = usePersistedState<SuccessionInput>(
    "legalpak:help-desk-succession",
    emptyForm,
  );

  function set<K extends keyof SuccessionInput>(k: K, v: SuccessionInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const route = successionRoute(form);
  const hasAnyValue = form.deceasedName.trim() !== "";
  const out = useMemo(() => {
    if (!hasAnyValue) return "";
    return route === "nadra" ? generateNadraSfuChecklist(form) : generateCivilPartitionBrief(form);
  }, [form, hasAnyValue, route]);

  return (
    <div className="space-y-6">
      <EmergencyRibbon />
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Help Desk / وراثت و جانشینی
        </p>
        <h1 className="font-display text-3xl">NADRA Succession vs. Civil Court Partition</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Two logic gates decide the route: are all heirs alive and biometrically available, and
          is any title disputed or any heir an unrepresented minor?
        </p>
      </div>

      <SplitScreen
        form={
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Deceased's name">
                <Input
                  value={form.deceasedName}
                  onChange={(e) => set("deceasedName", e.target.value)}
                />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label="Are all legal heirs alive and biometrically available in Pakistan?">
                <Select
                  value={form.allHeirsAliveAndBiometric}
                  onChange={(e) =>
                    set(
                      "allHeirsAliveAndBiometric",
                      e.target.value as SuccessionInput["allHeirsAliveAndBiometric"],
                    )
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
              </Field>
              <Field label="Is any property title disputed, or any heir an unrepresented minor?">
                <Select
                  value={form.disputedTitleOrMinorHeir}
                  onChange={(e) =>
                    set(
                      "disputedTitleOrMinorHeir",
                      e.target.value as SuccessionInput["disputedTitleOrMinorHeir"],
                    )
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </Select>
              </Field>
              <Field label="Heirs (names and relationship)" className="sm:col-span-2">
                <Textarea value={form.heirs} onChange={(e) => set("heirs", e.target.value)} />
              </Field>
            </div>

            <div className="mt-4 rounded-[var(--radius-md)] border border-border bg-bg p-3 text-xs text-muted">
              Route decision:{" "}
              <span className="font-medium text-fg">
                {route === "nadra"
                  ? "NADRA Succession Facilitation Unit (clean case)"
                  : "Civil court partition suit (disputed / minor heir)"}
              </span>
            </div>
          </section>
        }
        preview={
          out ? (
            <PackOutput
              text={out}
              filename={route === "nadra" ? "nadra-sfu-checklist.txt" : "civil-partition-brief.txt"}
            />
          ) : (
            <section className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
              Enter the deceased's name to see your checklist or advocate brief.
            </section>
          )
        }
      />

      <AdvocateEscalationCard city={form.city || undefined} specialty="Succession / Partition" />
    </div>
  );
}
