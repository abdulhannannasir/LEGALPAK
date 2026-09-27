/**
 * Client-side helpers shared by the two chat pages (citizen help desk, AI Counsel).
 * The anonymous session credentials live in localStorage; a session the server no
 * longer recognises has to be dropped, or every later send fails until the user
 * clears site data by hand.
 */

/** What the chat server functions throw when a session id/token pair matches no stored session. */
export const INVALID_SESSION_MESSAGE = "Invalid or expired chat session";

export type StoredChatSession = { sessionId: string; sessionToken: string };

export function isInvalidSessionError(err: unknown): boolean {
  return (err as { message?: unknown } | null)?.message === INVALID_SESSION_MESSAGE;
}

export function loadStoredSession(storageKey: string): StoredChatSession | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
    return typeof parsed?.sessionId === "string" && typeof parsed?.sessionToken === "string"
      ? { sessionId: parsed.sessionId, sessionToken: parsed.sessionToken }
      : null;
  } catch {
    return null;
  }
}

export function saveStoredSession(storageKey: string, session: StoredChatSession) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(session));
  } catch {
    /* localStorage unavailable — chat still works, just won't persist across reloads */
  }
}

export function clearStoredSession(storageKey: string) {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    /* localStorage unavailable — nothing was persisted to clear */
  }
}

/**
 * Runs `attempt` with the current session. If the server rejects that session as
 * invalid, forgets it and runs `attempt` once more with no session, so the chat
 * starts fresh instead of failing on every send.
 */
export async function withSessionRecovery<T>(
  storageKey: string,
  session: { current: StoredChatSession | null },
  attempt: (session: StoredChatSession | null) => Promise<T>,
): Promise<T> {
  const used = session.current;
  try {
    return await attempt(used);
  } catch (err) {
    // Judge by the session this attempt actually used, not by the shared ref: while the request
    // was in flight something else (a late transcript rejection) may already have cleared it,
    // and that must not stop the retry.
    if (!used || !isInvalidSessionError(err)) throw err;
    // Only forget it if it is still the current one; if it was already cleared or replaced,
    // that has been dealt with, and the retry goes with whatever is current now.
    if (session.current === used) {
      clearStoredSession(storageKey);
      session.current = null;
    }
    return attempt(session.current);
  }
}
