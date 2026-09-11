import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatCnic, isValidCnic, isValidCuin } from "./validate.ts";

describe("isValidCnic", () => {
  it("accepts 13 raw digits", () => assert.equal(isValidCnic("3520212345671"), true));
  it("accepts the conventional 5-7-1 dashed form", () =>
    assert.equal(isValidCnic("35202-1234567-1"), true));
  it("rejects fewer than 13 digits", () => assert.equal(isValidCnic("35202-123456-1"), false));
  it("rejects an empty string", () => assert.equal(isValidCnic(""), false));
});

describe("formatCnic", () => {
  it("inserts dashes as digits accumulate", () => {
    assert.equal(formatCnic("3520212345671"), "35202-1234567-1");
  });
  it("ignores non-digit characters while typing", () => {
    assert.equal(formatCnic("35202-1234567-1"), "35202-1234567-1");
  });
  it("truncates beyond 13 digits", () => {
    assert.equal(formatCnic("352021234567199"), "35202-1234567-1");
  });
});

describe("isValidCuin", () => {
  it("accepts a plain 7-digit CUIN", () => assert.equal(isValidCuin("0071234"), true));
  it("accepts a 6-digit CUIN", () => assert.equal(isValidCuin("071234"), true));
  it("rejects garbage input", () => assert.equal(isValidCuin("abc"), false));
});
