import { ShieldAlert, ShieldCheck } from "lucide-react";
import { LEGAL_SOURCES, type LegalSourceKey } from "@/lib/legalpak/legal-sources";

/**
 * Small inline citation shown under a legal claim (a fee, a deadline, a
 * phone number) — the "legal basis / source / last verified" strip called
 * for across the compliance and citizen-help tools. Never invents a
 * verification date: when `lastVerified` isn't set on the registry entry,
 * this renders "Source verification required" instead.
 */
export function LegalSourceNote({ sourceKey }: { sourceKey: LegalSourceKey }) {
  const source = LEGAL_SOURCES[sourceKey];
  return (
    <div className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-border bg-bg px-3 py-2 text-xs text-muted">
      {source.lastVerified ? (
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" strokeWidth={1.75} />
      ) : (
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-warn" strokeWidth={1.75} />
      )}
      <p>
        <span className="font-medium text-fg">Legal basis:</span> {source.basis}
        {source.sourceUrl && (
          <>
            {" · "}
            <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="underline">
              Source
            </a>
          </>
        )}
        {" · "}
        {source.lastVerified ? (
          <span>Last verified: {source.lastVerified}</span>
        ) : (
          <span className="font-medium text-warn">Source verification required</span>
        )}
      </p>
    </div>
  );
}
