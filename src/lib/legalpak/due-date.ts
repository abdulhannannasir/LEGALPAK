import { classifyAccounts, type AccountsInput } from "@/lib/legal/accounts";
import { formAAdvice, type FormAInput } from "@/lib/legal/form-a";
import { form9Advice, type Form9Input } from "@/lib/legal/form9";
import type { MatterType } from "./workflow";

/**
 * The single most relevant upcoming deadline for a matter, derived from its
 * saved workflow data using the SAME calculators the matter's own page uses —
 * so the compliance calendar never disagrees with what the matter itself
 * shows. `data` is whatever has been saved so far (often partial/empty for a
 * fresh matter), so every calculator call is defensive: absent fields read as
 * falsy/undefined, which each calculator already treats as "not due yet"
 * rather than throwing.
 */
export function computeMatterDueDate(type: MatterType, data: Record<string, unknown>): string | null {
  try {
    if (type === "FINANCIAL_STATEMENTS") {
      const advice = classifyAccounts(data as unknown as AccountsInput);
      // The accounts-to-registrar deadline is the actionable one when it
      // applies; otherwise the AGM itself is the next thing due.
      return advice.accountsDue ?? advice.agmDue ?? null;
    }
    if (type === "FORM_A") {
      return formAAdvice(data as unknown as FormAInput).due;
    }
    if (type === "FORM_9") {
      return form9Advice(data as unknown as Form9Input).due;
    }
    // CONTRACT has no statutory filing deadline.
    return null;
  } catch {
    return null;
  }
}
