import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { settleOptionalUserId } from "./optional-user.ts";

describe("settleOptionalUserId", () => {
  it("returns the verified user id", async () => {
    assert.equal(await settleOptionalUserId(async () => "user-1"), "user-1");
  });

  it("treats a signed-out caller as anonymous rather than an error", async () => {
    assert.equal(
      await settleOptionalUserId(async () => {
        throw new Error("Unauthorized");
      }),
      null,
    );
  });

  it("fails closed on a cross-site request or an auth misconfiguration — never a user", async () => {
    for (const message of ["Forbidden: cross-site request blocked", "Auth is disabled but DATABASE_URL is set"]) {
      assert.equal(
        await settleOptionalUserId(() => Promise.reject(new Error(message))),
        null,
        message,
      );
    }
  });

  it("never turns an empty id into a user", async () => {
    assert.equal(await settleOptionalUserId(async () => ""), null);
  });

  it("also catches a verifier that throws synchronously", async () => {
    assert.equal(
      await settleOptionalUserId(() => {
        throw new Error("boom");
      }),
      null,
    );
  });
});
