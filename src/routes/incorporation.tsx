import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { EntitySelector } from "@/components/incorporation/EntitySelector";
import { NameStep } from "@/components/incorporation/NameStep";
import { CapitalStep } from "@/components/incorporation/CapitalStep";
import { SubscribersStep } from "@/components/incorporation/SubscribersStep";
import { DocumentPack } from "@/components/incorporation/DocumentPack";
import { CompanyProfileTools } from "@/components/incorporation/CompanyProfileTools";
import { RequireSubscription } from "@/components/billing/RequireSubscription";
import { buildCompanyProfile, type CompanyProfile } from "@/lib/incorporation/company-profile";
import { usePersistedState } from "@/lib/use-persisted-state";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listWorkspacesFn, type Workspace } from "@/lib/legalpak/workspaces";
import { createCompanyFn } from "@/lib/legalpak/companies";
import {
  DEFAULT_AUTHORIZED_CAPITAL,
  DEFAULT_SHARE_FACE_VALUE,
  checkProposedName,
  emptySubscriber,
  getEntityType,
  officerCount,
  validateSubscribers,
  type EntityTypeId,
  type IncorporationState,
} from "@/lib/incorporation/secp-rules";
import { createId } from "@/lib/legalpak/id";

export const Route = createFileRoute("/incorporation")({
  component: () => (
    <RequireSubscription>
      <IncorporationPage />
    </RequireSubscription>
  ),
  head: () => ({
    meta: [
      { title: "Company Registration & eZfile Pre-Flight — LegalPak" },
      {
        name: "description",
        content:
          "Register a Pvt Ltd, SMC, or LLP in Pakistan — validate your name and capital against the Companies Act 2017, and generate a ready-to-file SECP eZfile pack: MOA, AOA, and Form 28.",
      },
    ],
  }),
});

const PROVINCES = ["Punjab", "Sindh", "ICT (Islamabad)", "Khyber Pakhtunkhwa", "Balochistan"];

const STEPS = ["Entity", "Name", "Capital", "Subscribers", "Office", "Document Pack"] as const;

const emptyState: IncorporationState = {
  entityType: "private",
  proposedNames: ["", "", ""],
  principalBusiness: "Information Technology",
  authorizedCapital: DEFAULT_AUTHORIZED_CAPITAL,
  shareFaceValue: DEFAULT_SHARE_FACE_VALUE,
  paidUpCapital: 0,
  subscribers: [emptySubscriber(createId("sub")), emptySubscriber(createId("sub"))],
  registeredAddress: "",
  province: "Punjab",
  section153Confirmed: false,
};

function IncorporationPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUserState();
  const [step, setStep] = usePersistedState("legalpak:incorporation-step", 0);
  const [state, setState] = usePersistedState<IncorporationState>("legalpak:incorporation-state", emptyState);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    listWorkspacesFn()
      .then((rows: Workspace[]) => setWorkspace(rows[0] ?? null))
      .catch(() => setWorkspace(null));
  }, [user]);

  function set<K extends keyof IncorporationState>(k: K, v: IncorporationState[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  function importProfile(profile: CompanyProfile) {
    setState((s) => ({
      ...s,
      entityType: profile.entityType,
      registeredAddress: profile.registeredAddress,
      province: profile.province || s.province,
      authorizedCapital: profile.authorizedCapital || s.authorizedCapital,
      shareFaceValue: profile.shareFaceValue || s.shareFaceValue,
      paidUpCapital: profile.paidUpCapital,
      subscribers: profile.subscribers.length ? profile.subscribers : s.subscribers,
    }));
  }

  const entity = getEntityType(state.entityType);
  const officers = officerCount(state.subscribers);

  const nameStepValid = useMemo(
    () =>
      state.proposedNames.some((n) => n.trim() !== "") &&
      checkProposedName(state.proposedNames[0]).flaggedWords.length === 0,
    [state.proposedNames],
  );
  const subscriberValidation = useMemo(
    () => validateSubscribers(state.entityType, state.subscribers),
    [state.entityType, state.subscribers],
  );

  const canAdvance: Record<number, boolean> = {
    0: true,
    1: nameStepValid,
    2: state.authorizedCapital > 0 && state.paidUpCapital <= state.authorizedCapital,
    3: subscriberValidation.ok && state.section153Confirmed,
    4: state.registeredAddress.trim() !== "",
    5: true,
  };

  async function createProfile() {
    if (!user) {
      toast.error("Sign in to save this as a company profile");
      navigate({ to: "/login" });
      return;
    }
    if (!workspace) {
      toast.error("Create a workspace first, then come back to save this profile");
      navigate({ to: "/dashboard" });
      return;
    }
    setCreatingProfile(true);
    try {
      const company = await createCompanyFn({
        data: {
          workspaceId: workspace.id,
          name: state.proposedNames[0].trim(),
          companyType: state.entityType,
          paidUpCapital: state.paidUpCapital || undefined,
          incorporationDate: new Date().toISOString().slice(0, 10),
        },
      });
      toast.success("Company profile created — continue with Financial Statements, Form A, Form 9, and contracts");
      navigate({ to: "/companies/$companyId", params: { companyId: company.id } });
    } catch {
      toast.error("Could not create the company profile");
    } finally {
      setCreatingProfile(false);
    }
  }

  // Sole proprietorship / AOP isn't an SECP filing — redirect instead of running the wizard.
  if (state.entityType === "sole_prop" && step > 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <StepHeader />
        <div className="space-y-4 rounded-[var(--radius-lg)] border border-danger bg-flag-high p-5 text-danger">
          <p className="flex items-start gap-2 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            A Sole Proprietorship / AOP is not registered with SECP — there is no MOA, AOA, or
            eZfile filing for this vehicle.
          </p>
          <ul className="space-y-1 text-sm">
            <li>• Register for an NTN directly with FBR — see LegalPak's Digital Tax Assistant.</li>
            <li>• If more than one owner (AOP), draft a partnership deed — see Commercial Contracts.</li>
            <li>• Register the business name with the Registrar of Firms in your province, if desired.</li>
          </ul>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              to="/tax-assistant"
              className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-accent"
            >
              Digital Tax Assistant
            </Link>
            <Link
              to="/contracts"
              className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm font-medium hover:border-accent"
            >
              Draft a partnership deed
            </Link>
          </div>
        </div>
        <Button type="button" variant="ghost" onClick={() => setStep(0)}>
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Choose a different vehicle
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <StepHeader />

      <ol className="flex flex-wrap gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`rounded-full border px-3 py-1 ${
              i === step
                ? "border-accent bg-surface font-medium text-accent"
                : i < step
                  ? "border-border bg-bg text-muted"
                  : "border-border bg-bg text-muted/60"
            }`}
          >
            {i < step ? <CheckCircle2 className="mr-1 inline size-3" strokeWidth={2} /> : null}
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <>
          <CompanyProfileTools mode="import" onImport={importProfile} />
          <EntitySelector value={state.entityType} onChange={(id) => set("entityType", id as EntityTypeId)} />
        </>
      )}

      {step === 1 && (
        <NameStep
          names={state.proposedNames}
          onNameChange={(i, v) => {
            const next = [...state.proposedNames] as [string, string, string];
            next[i] = v;
            set("proposedNames", next);
          }}
          principalBusiness={state.principalBusiness}
          onPrincipalBusinessChange={(v) => set("principalBusiness", v)}
        />
      )}

      {step === 2 && (
        <CapitalStep
          authorizedCapital={state.authorizedCapital}
          onAuthorizedCapitalChange={(v) => set("authorizedCapital", v)}
          shareFaceValue={state.shareFaceValue}
          onShareFaceValueChange={(v) => set("shareFaceValue", v)}
          paidUpCapital={state.paidUpCapital}
          onPaidUpCapitalChange={(v) => set("paidUpCapital", v)}
          directorCount={officers}
        />
      )}

      {step === 3 && (
        <SubscribersStep
          entityType={state.entityType}
          subscribers={state.subscribers}
          onChange={(subs) => set("subscribers", subs)}
          section153Confirmed={state.section153Confirmed}
          onSection153Change={(v) => set("section153Confirmed", v)}
        />
      )}

      {step === 4 && (
        <section className="space-y-5 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <div>
            <h2 className="font-display text-lg">Registered office</h2>
            <p className="mt-1 text-sm text-muted">
              Where the company's statutory records will be kept.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Province / territory">
              <Select value={state.province} onChange={(e) => set("province", e.target.value)}>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Registered office address" className="sm:col-span-2">
              <Input
                value={state.registeredAddress}
                onChange={(e) => set("registeredAddress", e.target.value)}
              />
            </Field>
          </div>

          <div>
            <h3 className="text-sm font-medium">What SECP auto-provisions via the National Single Window</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {[
                ["Corporate NTN", "Issued automatically by FBR on incorporation — no separate FBR visit needed."],
                ["EOBI employer registration", "Auto-registered so the company can enroll employees in the old-age benefits scheme."],
                [
                  "Provincial social security code",
                  "PESSI in Punjab, SESSI in Sindh, and the equivalent in other provinces.",
                ],
                ["Corporate bank account referral", "A referral is generated for opening a business bank account."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-[var(--radius-md)] border border-border bg-bg p-3">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-xs text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <p className="text-xs text-muted">
              LegalPak generates execution packs for SECP's eZfile system. Final filings are
              submitted and PIN-signed directly by authorized officers on the government portal.
            </p>
            <Button
              type="button"
              className="mt-4"
              disabled={creatingProfile || !state.proposedNames[0].trim()}
              onClick={createProfile}
            >
              {creatingProfile ? "Saving…" : "Create company profile & continue"}
            </Button>
            <p className="mt-2 text-xs text-muted">
              {user
                ? "Saves this as a company profile — from there you can start Financial Statements, Form A, Form 9, and Contracts matters for it."
                : "Sign in to save this as a company profile and unlock Financial Statements, Form A, Form 9, and Contracts for it."}
            </p>
          </div>
          <CompanyProfileTools
            mode="export"
            profile={buildCompanyProfile({
              name: state.proposedNames[0],
              entityType: state.entityType,
              registeredAddress: state.registeredAddress,
              province: state.province,
              authorizedCapital: state.authorizedCapital,
              shareFaceValue: state.shareFaceValue,
              paidUpCapital: state.paidUpCapital,
              subscribers: state.subscribers,
            })}
          />
          <DocumentPack state={state} />
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Back
        </Button>
        {step < STEPS.length - 1 && (
          <Button type="button" disabled={!canAdvance[step]} onClick={() => setStep(step + 1)}>
            Next
            <ArrowRight className="size-4" strokeWidth={1.75} />
          </Button>
        )}
      </div>
      {step === 0 && !entity.isSecpEntity && (
        <p className="text-right text-xs text-danger">
          A Sole Proprietorship / AOP doesn't go through this wizard — select "Next" to see what to
          do instead.
        </p>
      )}
    </div>
  );
}

function StepHeader() {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-muted">
        Company Registration
      </p>
      <h1 className="font-display text-3xl">SECP eZfile Pre-Flight Suite</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Pick your legal vehicle, validate your name and capital structure against the Companies
        Act, 2017, and generate a ready-to-file eZfile execution pack.
      </p>
    </div>
  );
}
