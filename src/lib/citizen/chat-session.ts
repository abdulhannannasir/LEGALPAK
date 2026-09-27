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
  try {
    return await attempt(session.current);
  } catch (err) {
    if (!session.current || !isInvalidSessionError(err)) throw err;
    clearStoredSession(storageKey);
    session.current = null;
    return attempt(null);
  }
}
