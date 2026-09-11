import { PhoneCall } from "lucide-react";
import { EMERGENCY_CONTACTS } from "@/lib/citizen/help-desk";

/**
 * Sticky emergency-helpline bar shown at the top of every Help Desk page.
 * `tel:` links work as tap-to-call on mobile; on desktop they just prompt
 * the OS's default calling app, which is the best available without a
 * telephony backend.
 */
export function EmergencyRibbon() {
  return (
    <div className="sticky top-0 z-10 mb-6 rounded-[var(--radius-md)] border border-danger bg-flag-high px-4 py-2.5 print:hidden">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-danger">
          <PhoneCall className="size-3.5" strokeWidth={2} />
          In danger? Call now
        </span>
        {EMERGENCY_CONTACTS.map((c) => (
          <a
            key={c.number}
            href={`tel:${c.number}`}
            className="text-xs font-medium text-danger underline decoration-danger/40 underline-offset-2 hover:decoration-danger"
          >
            {c.label} <span className="font-semibold">{c.number}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
