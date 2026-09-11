import { useEffect, useRef, useState } from "react";

/**
 * Same shape as useState, but the value is mirrored to localStorage under `key`
 * so a page reload (or accidental tab close) doesn't lose an in-progress draft.
 * Falls back silently to plain in-memory state if storage is unavailable
 * (private browsing, SSR) — never throws.
 *
 * Always renders `initial` on the first pass, matching the server (which has
 * no localStorage) — reading localStorage during the lazy `useState`
 * initializer instead makes the CLIENT's first render disagree with the
 * server's, which is a hydration-mismatch error, not just a lint nit. The
 * persisted value is loaded in an effect (post-hydration) and swapped in
 * then, so a returning visitor sees their draft appear right after mount
 * rather than in the same paint as the server-rendered shell.
 *
 * `skipNextSave` guards the one render pass where a loaded value is still
 * `initial` in this closure (the setValue from the load effect hasn't been
 * committed yet) — without it, the save effect below would fire first with
 * the stale `initial` and clobber localStorage before the loaded value ever
 * reaches state. Effects run in declaration order within a commit, so the
 * load effect always sets this before the save effect below reads it.
 */
export function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const skipNextSave = useRef(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        setValue(JSON.parse(raw) as T);
        return; // leave skipNextSave true — the save effect must not run with the still-stale `initial`
      }
    } catch {
      // storage unavailable — keep the initial value
    }
    skipNextSave.current = false;
    // Only ever run this load once, on mount, for this key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or unavailable — drafts just won't persist this session
    }
  }, [key, value]);

  return [value, setValue] as const;
}
