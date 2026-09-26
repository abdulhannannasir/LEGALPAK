import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mergeConsecutiveTurns, type ChatTurn } from "./gemini.ts";

const u = (text: string): ChatTurn => ({ role: "user", text });
const m = (text: string): ChatTurn => ({ role: "model", text });

describe("mergeConsecutiveTurns", () => {
  it("leaves an already-alternating conversation untouched", () => {
    const turns = [u("a"), m("b"), u("c")];
    assert.deepEqual(mergeConsecutiveTurns(turns), turns);
  });

  it("folds a still-pending user message into the new one instead of sending two user turns", () => {
    // Send A is in flight (its user row stored, no reply yet) when send B loads history and appends its own message.
    const merged = mergeConsecutiveTurns([u("q1"), m("a1"), u("pending"), u("new")]);
    assert.deepEqual(merged, [u("q1"), m("a1"), u("pending\n\nnew")]);
  });

  it("folds the interleaved rows two overlapping sends leave behind", () => {
    // Stored order for overlapping sends: user A, user B, reply A, reply B.
    const merged = mergeConsecutiveTurns([u("A"), u("B"), m("rA"), m("rB"), u("next")]);
    assert.deepEqual(merged, [u("A\n\nB"), m("rA\n\nrB"), u("next")]);
  });

  it("does not mutate the turns it is given", () => {
    const turns = [u("x"), u("y")];
    mergeConsecutiveTurns(turns);
    assert.deepEqual(turns, [u("x"), u("y")]);
  });

  it("handles an empty history", () => {
    assert.deepEqual(mergeConsecutiveTurns([]), []);
  });
});
