/**
 * The failure rule behind `optionalAuthMiddleware`, kept dependency-free so it
 * can be unit-tested: run `verify` (which should assert the request is
 * same-site AND resolve the session's user id) and treat ANY failure as
 * "anonymous" — signed out, a cross-site scripted request, or an auth
 * misconfiguration. Fail closed: an identity that can't be verified is never
 * upgraded to a user, so a function that requires one simply refuses.
 */
export async function settleOptionalUserId(verify: () => Promise<string>): Promise<string | null> {
  try {
    const userId = await verify();
    return userId || null;
  } catch {
    return null;
  }
}
