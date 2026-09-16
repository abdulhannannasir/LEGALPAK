import { createFileRoute } from "@tanstack/react-router";
import { RequireSubscription } from "@/components/billing/RequireSubscription";
import { CompanyProfileTools } from "@/components/incorporation/CompanyProfileTools";
import { ShareAllotmentPanel } from "@/components/incorporation/ShareAllotmentPanel";
import { ShareTransferPanel } from "@/components/incorporation/ShareTransferPanel";
import { usePersistedState } from "@/lib/use-persisted-state";
import type { ShareAllotmentInput, ShareTransferInput } from "@/lib/incorporation/share-changes";

export const Route = createFileRoute("/share-changes")({
  component: () => (
    <RequireSubscription>
      <ShareChangesPage />
    </RequireSubscription>
  ),
  head: () => ({
    meta: [
      { title: "Share Changes — LegalPak" },
      {
        name: "description",
        content:
          "Generate SECP Form 3 (Return of Allotment of Shares) for newly issued shares, and a Share Transfer Deed for a transfer between existing holders, for a Pakistani company.",
      },
    ],
  }),
});

const emptyAllotment: ShareAllotmentInput = {
  companyName: "",
  cuin: "",
  allotmentDate: "",
  boardResolutionDate: "",
  shareFaceValue: 10,
  allottees: [],
};

const emptyTransfer: ShareTransferInput = {
  companyName: "",
  cuin: "",
  transferorName: "",
  transferorCnic: "",
  transfereeName: "",
  transfereeCnic: "",
  numberOfShares: 0,
  pricePerShare: 0,
  transferDate: "",
  boardApprovalDate: "",
};

function ShareChangesPage() {
  const [tab, setTab] = usePersistedState<"allotment" | "transfer">("legalpak:share-changes-tab", "allotment");
  const [allotment, setAllotment] = usePersistedState<ShareAllotmentInput>(
    "legalpak:share-changes-allotment",
    emptyAllotment,
  );
  const [transfer, setTransfer] = usePersistedState<ShareTransferInput>(
    "legalpak:share-changes-transfer",
    emptyTransfer,
  );

  function importProfile(profile: { name: string; cuin: string }) {
    setAllotment((f) => ({ ...f, companyName: profile.name, cuin: profile.cuin }));
    setTransfer((f) => ({ ...f, companyName: profile.name, cuin: profile.cuin }));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">SECP</p>
        <h1 className="font-display text-3xl">Share Changes</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Newly issued shares (Form 3) or a transfer between existing holders (Share Transfer
          Deed) — both update the company's Register of Members once executed.
        </p>
      </div>

      <CompanyProfileTools mode="import" onImport={importProfile} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("allotment")}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
            tab === "allotment" ? "border-accent bg-surface text-accent" : "border-border bg-bg text-muted"
          }`}
        >
          Form 3 — New shares
        </button>
        <button
          type="button"
          onClick={() => setTab("transfer")}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
            tab === "transfer" ? "border-accent bg-surface text-accent" : "border-border bg-bg text-muted"
          }`}
        >
          Transfer — Existing shares
        </button>
      </div>

      {tab === "allotment" ? (
        <ShareAllotmentPanel form={allotment} onChange={setAllotment} />
      ) : (
        <ShareTransferPanel form={transfer} onChange={setTransfer} />
      )}
    </div>
  );
}
