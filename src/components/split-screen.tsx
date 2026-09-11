import type { ReactNode } from "react";

/**
 * Two-column "form on the left, live preview on the right" layout for every
 * document generator. The preview column sticks while scrolling long forms,
 * so the live-updating draft stays visible — the actual "split screen" the
 * generators were missing (they already update live via useMemo; this is
 * the layout to match).
 */
export function SplitScreen({ form, preview }: { form: ReactNode; preview: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="space-y-6">{form}</div>
      <div className="space-y-6 lg:sticky lg:top-20">{preview}</div>
    </div>
  );
}
