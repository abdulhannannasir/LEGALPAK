import { addDaysISO } from "./date.ts";

export type FormAInput = {
  companyName: string;
  kind: "smc" | "private" | "public" | "listed" | "inactive";
  paidUp: number;
  changed: boolean;
  agmDate: string;
  fyEnd: string;
};

export function formAAdvice(input: FormAInput) {
  const noChangeSmall =
    !input.changed &&
    (input.kind === "smc" || (input.kind === "private" && input.paidUp <= 3_000_000));
  const form24 =
    !input.changed &&
    !noChangeSmall &&
    input.kind !== "inactive" &&
    (input.kind === "public" || input.kind === "listed" || input.paidUp > 3_000_000);

  let which: "Form A" | "Form 24" | "No annual return" = "Form A";
  if (noChangeSmall) which = "No annual return";
  else if (form24) which = "Form 24";
  if (input.kind === "inactive") which = "Form A";

  const due = input.agmDate ? addDaysISO(input.agmDate, 30) : null;

  const flags: { level: "high" | "med" | "low"; title: string; detail: string }[] = [];
  if (which === "No annual return") {
    flags.push({
      level: "med",
      title: "No Form A this year only if nothing changed",
      detail: "SMC or private paid-up ≤ Rs 3 million. If officers or members changed, file Form A (and Form 9 for officers).",
    });
  }
  if (input.changed) {
    flags.push({
      level: "med",
      title: "Officer change is not covered by Form A alone",
      detail: "File Form 9 within 15 days of the AGM/appointment. Use Elected/Re-elected for directors chosen at the AGM.",
    });
  }
  flags.push({
    level: "low",
    title: "UBO / Form 19",
    detail: "File beneficial ownership with the annual filing journey, or within 30 days after calendar year-end if no return is due.",
  });

  const pack = `FORM A / ANNUAL RETURN MEMORANDUM
s. 130 Companies Act 2017 · Companies Regulations 2024

Company: ${input.companyName || "[Company]"}
Type: ${input.kind}
Paid-up: PKR ${input.paidUp.toLocaleString("en-PK")}
Particulars changed since last return: ${input.changed ? "Yes" : "No"}

FILE: ${which}
Due: ${due || "30 days after AGM (or 30 January if no AGM — made up to 31 December)"}
AGM: ${input.agmDate || "[date]"}  |  FY end: ${input.fyEnd || "[date]"}

eZfile: Annual filing of company (Form A / Form 24 + UBO).

Part I — CUIN, name, active/inactive, challan
Part II (active) — AGM date, office, contacts (WhatsApp mobile), authorised & paid-up capital, officers, directors, members, transfers since last return, ≥25% holdings and holdings on behalf of others
Part III (inactive) — correspondence, directors/members, inactive confirmation

Form A is not the financial statements and not the FBR return.
`;

  return { which, due, flags, pack };
}
