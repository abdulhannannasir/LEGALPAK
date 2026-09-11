import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  listConsultationRequestsFn,
  updateConsultationStatusFn,
  type ConsultationRequest,
} from "@/lib/legalpak/consultations";

export const Route = createFileRoute("/consultations")({
  component: ConsultationsPage,
  head: () => ({
    meta: [
      { title: "Consultation requests — LegalPak" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const STATUSES: ConsultationRequest["status"][] = ["new", "contacted", "scheduled", "closed"];

function ConsultationsPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (!user) return <RedirectToSignIn />;
  return <ConsultationsBody />;
}

function ConsultationsBody() {
  const [requests, setRequests] = useState<ConsultationRequest[] | null>(null);

  function refresh() {
    listConsultationRequestsFn()
      .then(setRequests)
      .catch(() => toast.error("Could not load consultation requests"));
  }

  useEffect(refresh, []);

  async function setStatus(id: string, status: ConsultationRequest["status"]) {
    try {
      await updateConsultationStatusFn({ data: { id, status } });
      setRequests((rows) => rows?.map((r) => (r.id === id ? { ...r, status } : r)) ?? null);
    } catch {
      toast.error("Could not update status");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Advisory Desk</p>
        <h1 className="font-display text-3xl">Consultation requests</h1>
        <p className="mt-2 text-sm text-muted">Leads from the "Consult Corporate Counsel" form and matter pages.</p>
      </div>

      {requests === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-muted">No requests yet.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-sm text-muted">
                    {r.email}
                    {r.phone ? ` · ${r.phone}` : ""}
                  </p>
                </div>
                <select
                  value={r.status}
                  onChange={(e) => setStatus(r.id, e.target.value as ConsultationRequest["status"])}
                  className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-sm capitalize"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-sm font-medium">{r.topic}</p>
              {r.message && <p className="mt-1 text-sm text-muted">{r.message}</p>}
              <p className="mt-2 text-xs text-muted">{new Date(r.created_at).toLocaleString("en-GB")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
