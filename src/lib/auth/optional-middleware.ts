import { createMiddleware } from "@tanstack/react-start";
import { settleOptionalUserId } from "./optional-user";

/**
 * Like `authMiddleware`, for a server function that is open to signed-out
 * callers (the free citizen chat) but must refuse them for part of what it
 * does (the paid corporate advisor). It never rejects a request itself:
 * `context.userId` is the verified user id, or `null` for anybody it could
 * not verify. The function MUST check `userId !== null` before doing anything
 * that needs a signed-in user.
 *
 * Identity is resolved exactly as `authMiddleware` does it — same bearer-token
 * forwarding for the live preview, same same-site request isolation, same
 * `requireUserId` — but an unverifiable caller becomes `null` instead of an
 * error; see `settleOptionalUserId`. Use `authMiddleware` for anything that
 * doesn't need to serve signed-out callers.
 */
export const optionalAuthMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    // Same live-preview bearer forwarding as authMiddleware; null (a no-op) when deployed.
    const { getBearerToken } = await import("./client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    // ONLY import `*.server` modules here (see authMiddleware for why).
    const { assertSameSiteRequest } = await import("./isolation.server");
    const { requireUserId } = await import("./verify.server");
    const userId = await settleOptionalUserId(async () => {
      assertSameSiteRequest();
      return requireUserId(context.bearerToken);
    });
    return next({ context: { userId } });
  });
