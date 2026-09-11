import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeScrollEdges } from "./nav-scroll.ts";

describe("computeScrollEdges", () => {
  it("is at both edges when content doesn't overflow the container", () => {
    const edges = computeScrollEdges({ scrollLeft: 0, clientWidth: 400, scrollWidth: 400 });
    assert.equal(edges.atStart, true);
    assert.equal(edges.atEnd, true);
  });

  it("is at the start only when scrolled to the beginning of overflowing content", () => {
    const edges = computeScrollEdges({ scrollLeft: 0, clientWidth: 400, scrollWidth: 1500 });
    assert.equal(edges.atStart, true);
    assert.equal(edges.atEnd, false);
  });

  it("is at neither edge mid-scroll", () => {
    const edges = computeScrollEdges({ scrollLeft: 600, clientWidth: 400, scrollWidth: 1500 });
    assert.equal(edges.atStart, false);
    assert.equal(edges.atEnd, false);
  });

  it("is at the end only when scrolled to the end", () => {
    const edges = computeScrollEdges({ scrollLeft: 1100, clientWidth: 400, scrollWidth: 1500 });
    assert.equal(edges.atStart, false);
    assert.equal(edges.atEnd, true);
  });

  it("tolerates sub-pixel scroll positions near the start", () => {
    const edges = computeScrollEdges({ scrollLeft: 2.5, clientWidth: 400, scrollWidth: 1500 });
    assert.equal(edges.atStart, true);
  });

  it("tolerates sub-pixel scroll positions near the end", () => {
    const edges = computeScrollEdges({ scrollLeft: 1097.5, clientWidth: 400, scrollWidth: 1500 });
    assert.equal(edges.atEnd, true);
  });

  it("does not treat a position just past the tolerance as an edge", () => {
    const edges = computeScrollEdges({ scrollLeft: 10, clientWidth: 400, scrollWidth: 1500 });
    assert.equal(edges.atStart, false);
  });
});
