import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deriveCompliance, type ComplianceItem } from "@/lib/legalpak/compliance";
import { HEALTH_STYLE } from "./health-badge";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Cell = { iso: string | null; day: number | null };

/**
 * A plain month grid — no calendar library. Every date here is built with
 * Date.UTC and formatted back to a 'YYYY-MM-DD' string, the same
 * timezone-safe convention as src/lib/legal/date.ts, so "today" and each
 * day cell line up with matter.due_date without an off-by-one for a
 * Pakistan (UTC+5) reader.
 */
export function ComplianceCalendarView({ items }: { items: ComplianceItem[] }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getUTCFullYear(), month: now.getUTCMonth() });

  const itemsByDate = useMemo(() => {
    const map = new Map<string, ComplianceItem[]>();
    for (const item of items) {
      if (!item.due_date) continue;
      const arr = map.get(item.due_date) ?? [];
      arr.push(item);
      map.set(item.due_date, arr);
    }
    return map;
  }, [items]);

  const monthStart = new Date(Date.UTC(cursor.year, cursor.month, 1));
  const monthLabel = monthStart.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const firstWeekday = monthStart.getUTCDay();
  const daysInMonth = new Date(Date.UTC(cursor.year, cursor.month + 1, 0)).getUTCDate();
  const todayIso = new Date().toISOString().slice(0, 10);

  const cells: Cell[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ iso: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day: d });
  }
  while (cells.length % 7 !== 0) cells.push({ iso: null, day: null });

  function go(delta: number) {
    setCursor((c) => {
      const total = c.year * 12 + c.month + delta;
      return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
    });
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg">{monthLabel}</h3>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" className="px-2" onClick={() => go(-1)} aria-label="Previous month">
            <ChevronLeft className="size-4" strokeWidth={1.75} />
          </Button>
          <Button type="button" variant="ghost" className="px-2" onClick={() => setCursor({ year: now.getUTCFullYear(), month: now.getUTCMonth() })}>
            Today
          </Button>
          <Button type="button" variant="ghost" className="px-2" onClick={() => go(1)} aria-label="Next month">
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          const dayItems = cell.iso ? (itemsByDate.get(cell.iso) ?? []) : [];
          const isToday = cell.iso === todayIso;
          return (
            <div
              key={i}
              className={`min-h-[76px] rounded-[var(--radius-sm)] border p-1.5 text-left ${
                cell.iso ? "border-border bg-bg" : "border-transparent"
              } ${isToday ? "ring-1 ring-accent" : ""}`}
            >
              {cell.day && (
                <>
                  <p className={`text-[11px] ${isToday ? "font-semibold text-accent" : "text-muted"}`}>{cell.day}</p>
                  <div className="mt-1 space-y-0.5">
                    {dayItems.slice(0, 3).map((item) => {
                      const derived = deriveCompliance(item);
                      if (!derived) return null;
                      return (
                        <Link
                          key={item.id}
                          to="/matters/$matterId"
                          params={{ matterId: item.id }}
                          title={`${derived.requirement} — ${item.company_name}`}
                          className={`block truncate rounded border px-1 py-0.5 text-[10px] font-medium ${HEALTH_STYLE[derived.health].badge}`}
                        >
                          {derived.requirement}
                        </Link>
                      );
                    })}
                    {dayItems.length > 3 && <p className="text-[10px] text-muted">+{dayItems.length - 3} more</p>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
