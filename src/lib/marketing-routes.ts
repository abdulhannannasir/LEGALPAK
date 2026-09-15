/**
 * Marketing pages (homepage, consult, login, signup) render their own
 * full-bleed layout with GlassNavbar instead of the functional app chrome —
 * see AppShell and src/components/marketing/*. Matching is exact, not
 * prefix-based: "/consult/does-not-exist" is a functional-app 404, not a
 * marketing page.
 */
export const MARKETING_ROUTES = new Set(["/", "/consult", "/login", "/signup"]);

export function isMarketingRoute(pathname: string): boolean {
  return MARKETING_ROUTES.has(pathname);
}
