import { useState } from "react";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsultationForm } from "@/components/consultation-form";

export function RequestAttorneyReview({
  workspaceId,
  companyId,
  matterId,
  matterTitle,
}: {
  workspaceId: string;
  companyId: string;
  matterId: string;
  matterTitle: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Need bespoke terms or a second opinion?</h2>
            <p className="mt-1 text-sm text-muted">
              Cap table terms, cross-border clauses, or custom vetting for this matter — request attorney
              review.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
            <Scale className="size-4" strokeWidth={1.75} />
            Request attorney review
          </Button>
        </div>
      </section>
    );
  }

  return (
    <ConsultationForm
      workspaceId={workspaceId}
      companyId={companyId}
      matterId={matterId}
      defaultTopic={`Review requested: ${matterTitle}`}
    />
  );
}
