/** Prefixed, human-legible row id (e.g. `ws_...`, `company_...`, `matter_...`). */
export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
