/**
 * Whether a horizontally-scrolling nav is at its start/end, for the
 * mobile edge-fade affordance in AppShell. A small tolerance (rather than an
 * exact 0 / max comparison) absorbs sub-pixel scroll positions some browsers
 * report for scrollLeft.
 */
const EDGE_TOLERANCE_PX = 4;

export type ScrollMetrics = { scrollLeft: number; clientWidth: number; scrollWidth: number };
export type ScrollEdges = { atStart: boolean; atEnd: boolean };

export function computeScrollEdges({
  scrollLeft,
  clientWidth,
  scrollWidth,
}: ScrollMetrics): ScrollEdges {
  return {
    atStart: scrollLeft <= EDGE_TOLERANCE_PX,
    atEnd: scrollLeft + clientWidth >= scrollWidth - EDGE_TOLERANCE_PX,
  };
}
