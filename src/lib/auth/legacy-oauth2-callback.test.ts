import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  legacyCallbackPath,
  legacyOAuth2CallbackPath,
  toCoreCallbackPath,
} from "./legacy-oauth2-callback.ts";

const ids = new Set(["grok-google", "grok-x"]);

describe("toCoreCallbackPath", () => {
  it("maps the broker's registered callback to the core 1.7 route", () => {
    assert.equal(
      toCoreCallbackPath("/api/auth/oauth2/callback/grok-google", ids),
      "/api/auth/callback/grok-google",
    );
    assert.equal(
      toCoreCallbackPath("/api/auth/oauth2/callback/grok-x/", ids),
      "/api/auth/callback/grok-x",
    );
  });

  it("leaves unknown providers and other auth paths alone", () => {
    assert.equal(toCoreCallbackPath("/api/auth/oauth2/callback/github", ids), null);
    assert.equal(toCoreCallbackPath("/api/auth/callback/grok-google", ids), null);
    assert.equal(toCoreCallbackPath("/api/auth/get-session", ids), null);
    assert.equal(toCoreCallbackPath("/api/auth/oauth2/callback/grok-google/extra", ids), null);
  });
});

describe("legacyOAuth2CallbackPath", () => {
  it("pins the callback path on listed providers only", () => {
    const providers: { id: string; callbackPath?: string }[] = [
      { id: "grok-google" },
      { id: "grok-x" },
      { id: "google" },
    ];
    const plugin = legacyOAuth2CallbackPath([...ids]);
    plugin.init?.({ socialProviders: providers } as never);
    assert.equal(providers[0].callbackPath, legacyCallbackPath("grok-google"));
    assert.equal(providers[1].callbackPath, "/oauth2/callback/grok-x");
    assert.equal(providers[2].callbackPath, undefined);
  });

  it("rewrites an incoming legacy callback request, keeping query and headers", async () => {
    const plugin = legacyOAuth2CallbackPath([...ids]);
    const req = new Request(
      "https://app.example/api/auth/oauth2/callback/grok-google?code=c1&state=s1",
      { headers: { cookie: "a=1" } },
    );
    const out = (await plugin.onRequest?.(req, {} as never)) as { request: Request } | undefined;
    assert.ok(out && "request" in out);
    assert.equal(
      out.request.url,
      "https://app.example/api/auth/callback/grok-google?code=c1&state=s1",
    );
    assert.equal(out.request.headers.get("cookie"), "a=1");
  });

  it("passes other requests through untouched", async () => {
    const plugin = legacyOAuth2CallbackPath([...ids]);
    const req = new Request("https://app.example/api/auth/get-session");
    assert.equal(await plugin.onRequest?.(req, {} as never), undefined);
  });
});
