import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { listVerifiedLawyersFn, registerLawyerFn, type Lawyer } from "@/lib/citizen/lawyers";

export const Route = createFileRoute("/citizen/lawyers")({
  component: LawyerDirectoryPage,
  head: () => ({
    meta: [
      { title: "Find a lawyer — LegalPak" },
      {
        name: "description",
        content:
          "A directory of verified advocates across Pakistan, searchable by city and specialty — for when a legal matter needs a person, not a form.",
      },
    ],
  }),
});

const COURT_LEVELS = ["District Courts", "High Court", "Supreme Court"] as const;

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  barCouncilNo: "",
  barEnrolmentYear: "",
  courtLevel: "District Courts" as (typeof COURT_LEVELS)[number],
  city: "",
  specializations: "",
  bio: "",
  consultationFee: "2000",
};

function LawyerDirectoryPage() {
  const [lawyers, setLawyers] = useState<Lawyer[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<{ city: string; specialty: string }>({
    city: "",
    specialty: "",
  });

  useEffect(() => {
    listVerifiedLawyersFn()
      .then(setLawyers)
      .catch(() => setLawyers([]));

    // A help-desk wizard hands off here with ?city=&specialty= so a user
    // doesn't have to re-describe their situation.
    const params = new URLSearchParams(window.location.search);
    const city = params.get("city") ?? "";
    const specialty = params.get("specialty") ?? "";
    if (city || specialty) setFilter({ city, specialty });
  }, []);

  const filteredLawyers = useMemo(() => {
    if (!lawyers) return lawyers;
    return lawyers.filter((l) => {
      const cityMatch =
        !filter.city || l.city.toLowerCase().includes(filter.city.toLowerCase());
      const specialtyMatch =
        !filter.specialty ||
        l.specializations.some((s) => s.toLowerCase().includes(filter.specialty.toLowerCase()));
      return cityMatch && specialtyMatch;
    });
  }, [lawyers, filter]);

  function set<K extends keyof typeof emptyForm>(k: K, v: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerLawyerFn({
        data: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          barCouncilNo: form.barCouncilNo,
          barEnrolmentYear: Number(form.barEnrolmentYear) || new Date().getFullYear(),
          courtLevel: form.courtLevel,
          city: form.city,
          specializations: form.specializations
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          bio: form.bio || undefined,
          consultationFee: Number(form.consultationFee) || 2000,
        },
      });
      toast.success("Listing submitted — it will appear once verified");
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your listing");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Citizen legal help
        </p>
        <h1 className="font-display text-3xl">Find a lawyer</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Verified advocates across Pakistan. Booking and payment aren't wired up yet — contact
          details are shared once that's ready; for now this is a directory of who practises where.
        </p>
      </div>

      {(filter.city || filter.specialty) && (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-sm">
          <span className="text-muted">
            Showing lawyers{filter.city ? ` in ${filter.city}` : ""}
            {filter.specialty ? ` for ${filter.specialty}` : ""}.
          </span>
          <button
            type="button"
            onClick={() => setFilter({ city: "", specialty: "" })}
            className="text-xs font-medium text-accent underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {filteredLawyers === null ? null : filteredLawyers.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-sm text-muted">
          No verified lawyers match this filter yet — try clearing it to see the full directory.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredLawyers.map((l) => (
            <div
              key={l.id}
              className="rounded-[var(--radius-lg)] border border-border bg-surface p-5"
            >
              <h3 className="font-display text-xl">{l.full_name}</h3>
              <p className="mt-1 text-sm text-muted">
                {l.city} · {l.court_level}
              </p>
              {l.specializations.length > 0 && (
                <p className="mt-2 text-xs text-muted">{l.specializations.join(" · ")}</p>
              )}
              {l.bio && <p className="mt-3 text-sm">{l.bio}</p>}
              <p className="mt-3 text-sm font-medium">
                Consultation: PKR {l.consultation_fee.toLocaleString("en-PK")}
              </p>
            </div>
          ))}
        </div>
      )}

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="text-sm font-medium text-accent underline"
        >
          {showForm ? "Hide" : "Are you a lawyer? List your practice"}
        </button>
        {showForm && (
          <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input
                required
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <Input required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Bar council number">
              <Input
                required
                value={form.barCouncilNo}
                onChange={(e) => set("barCouncilNo", e.target.value)}
              />
            </Field>
            <Field label="Bar enrolment year">
              <Input
                type="number"
                required
                value={form.barEnrolmentYear}
                onChange={(e) => set("barEnrolmentYear", e.target.value)}
              />
            </Field>
            <Field label="Court level">
              <Select
                value={form.courtLevel}
                onChange={(e) => set("courtLevel", e.target.value as never)}
              >
                {COURT_LEVELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="City">
              <Input required value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Consultation fee (PKR)">
              <Input
                type="number"
                value={form.consultationFee}
                onChange={(e) => set("consultationFee", e.target.value)}
              />
            </Field>
            <Field label="Specializations (comma-separated)" className="sm:col-span-2">
              <Input
                value={form.specializations}
                placeholder="Family, Property, Criminal"
                onChange={(e) => set("specializations", e.target.value)}
              />
            </Field>
            <Field label="Bio (optional)" className="sm:col-span-2">
              <Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit listing"}
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
