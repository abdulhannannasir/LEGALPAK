export function Flags({
  flags,
}: {
  flags: { level: "high" | "med" | "low"; title: string; detail: string }[];
}) {
  return (
    <div className="space-y-2">
      {flags.map((f) => (
        <div
          key={f.title}
          className={
            f.level === "high"
              ? "rounded-[var(--radius-md)] border-l-4 border-danger bg-flag-high p-3"
              : f.level === "med"
                ? "rounded-[var(--radius-md)] border-l-4 border-warn bg-flag-med p-3"
                : "rounded-[var(--radius-md)] border-l-4 border-success bg-flag-low p-3"
          }
        >
          <p className="text-sm font-medium">{f.title}</p>
          <p className="text-sm text-muted">{f.detail}</p>
        </div>
      ))}
    </div>
  );
}
