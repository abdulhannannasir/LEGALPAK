import type { BetterAuthPlugin } from "better-auth";

/**
 * Keeps the broker providers' OAuth callback at the pre-1.7 path.
 *
 * Better Auth 1.7 moved generic OAuth callbacks from
 * `/api/auth/oauth2/callback/:id` to the core `/api/auth/callback/:id`. The
 * auth broker only accepts `redirect_uri`s under `/oauth2/callback/*` (deployed
 * per-app clients and the shared preview client alike — see `preview.ts`), so
 * this plugin keeps that URL working without touching broker registrations:
 *
 * - `init`: sets `callbackPath` on the listed providers, so the `redirect_uri`
 *   sent to the broker (authorize AND token exchange) stays
 *   `<baseURL>/oauth2/callback/<id>`.
 * - `onRequest`: serves that path by routing it to the core `/callback/:id`
 *   handler, which does the actual sign-in.
 *
 * Must be listed AFTER `genericOAuth(...)` so its providers already exist when
 * `init` runs (plugins initialise in order).
 */
export function legacyOAuth2CallbackPath(providerIds: readonly string[]): BetterAuthPlugin {
  const ids = new Set(providerIds);
  return {
    id: "legacy-oauth2-callback-path",
    init(ctx) {
      for (const provider of ctx.socialProviders) {
        if (ids.has(provider.id)) provider.callbackPath = legacyCallbackPath(provider.id);
      }
    },
    async onRequest(request) {
      const rewritten = toCoreCallbackPath(new URL(request.url).pathname, ids);
      if (!rewritten) return;
      const url = new URL(request.url);
      url.pathname = rewritten;
      const hasBody = request.method !== "GET" && request.method !== "HEAD";
      return {
        request: new Request(url, {
          method: request.method,
          headers: request.headers,
          body: hasBody ? await request.arrayBuffer() : undefined,
        }),
      };
    },
  };
}

/** `/oauth2/callback/<id>` — the callback path the broker has registered. */
export function legacyCallbackPath(providerId: string): string {
  return `/oauth2/callback/${providerId}`;
}

/**
 * Maps `…/oauth2/callback/<id>` to `…/callback/<id>` for a known provider id;
 * returns null for anything else (other paths, unknown ids).
 */
export function toCoreCallbackPath(pathname: string, ids: ReadonlySet<string>): string | null {
  const match = /^(.*)\/oauth2\/callback\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  const [, prefix, id] = match;
  if (!ids.has(decodeURIComponent(id))) return null;
  return `${prefix}/callback/${id}`;
}
