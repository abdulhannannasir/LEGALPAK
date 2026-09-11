import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isMarketingRoute } from "./marketing-routes.ts";

describe("isMarketingRoute", () => {
  it("recognizes the homepage", () => assert.equal(isMarketingRoute("/"), true));
  it("recognizes consult, login, and signup", () => {
    assert.equal(isMarketingRoute("/consult"), true);
    assert.equal(isMarketingRoute("/login"), true);
    assert.equal(isMarketingRoute("/signup"), true);
  });
  it("rejects functional app routes", () => {
    assert.equal(isMarketingRoute("/dashboard"), false);
    assert.equal(isMarketingRoute("/accounts"), false);
    assert.equal(isMarketingRoute("/matters/abc123"), false);
  });
  it("does not prefix-match — a sub-path of a marketing route is not marketing", () => {
    assert.equal(isMarketingRoute("/consult/"), false);
    assert.equal(isMarketingRoute("/consult/thanks"), false);
    assert.equal(isMarketingRoute("/login/callback"), false);
  });
  it("rejects an empty or unrelated string", () => {
    assert.equal(isMarketingRoute(""), false);
    assert.equal(isMarketingRoute("consult"), false);
  });
});
