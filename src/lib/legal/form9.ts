import { addDaysISO } from "./date.ts";

export type Form9Event = "induct" | "cease" | "replace" | "particulars";

export type Form9Input = {
  companyName: string;
  cuin: string;
  kind: "smc" | "private" | "public";
  currentDirectors: number;
  event: Form9Event;
  incomingName: string;
  incomingCnic: string;
  outgoingName: string;
  outgoingCnic: string;
  modeIn: string;
  modeOut: string;
  effectiveDate: string;
  designation: string;
};

export function form9Advice(input: Form9Input) {
  const min = input.kind === "smc" ? 1 : input.kind === "public" ? 3 : 2;
  let after = input.currentDirectors;
  if (input.event === "induct") after += 1;
  if (input.event === "cease") after -= 1;
  const belowMin = after < min;
  const due = input.effectiveDate ? addDaysISO(input.effectiveDate, 15) : null;

  const flags: { level: "high" | "med" | "low"; title: string; detail: string }[] = [];
  if (belowMin) {
    flags.push({
      level: "high",
      title: "Board would fall below statutory minimum",
      detail: `Minimum directors: ${min}. File cessation and induction in the same eZfile process.`,
    });
  }
  if (input.modeIn === "Appointed" && (input.event === "induct" || input.event === "replace")) {
    flags.push({
      level: "med",
      title: "Check mode of appointment",
      detail: "Use Elected / Re-elected for AGM elections. “Appointed” is for casual vacancy / additional director.",
    });
  }
  if (!input.incomingCnic && (input.event === "induct" || input.event === "replace")) {
    flags.push({
      level: "high",
      title: "Incoming person needs CNIC and an eZfile account",
      detail: "eZfile notifies them when they are added. Consent (old Form 28) is still required in substance.",
    });
  }
  if (flags.length === 0) {
    flags.push({
      level: "low",
      title: "Pack looks structurally complete",
      detail: "File on eZfile: Induction, Cessation and change in particulars of directors and officers (Form 9). Market still says Form 29.",
    });
  }

  const pack = `FORM 9 / DIRECTOR CHANGE PACK
(Companies Regulations 2024 — replaces Form 29 + Form 28)
eZfile process: Induction, Cessation and change in particulars of directors and officers

Company: ${input.companyName || "[Company]"}
CUIN: ${input.cuin || "[CUIN]"}
Event: ${input.event}
Effective date: ${input.effectiveDate || "[date]"}  → file by ${due || "[date + 15 days]"}
Current board: ${input.currentDirectors}  |  Minimum: ${min}  |  After this event: ${after}

${input.event !== "cease" && input.event !== "particulars" ? `INCOMING
Name: ${input.incomingName}
CNIC: ${input.incomingCnic}
Designation: ${input.designation}
Mode: ${input.modeIn}
Attachments: consent to act, CNIC, board/members resolution
` : ""}${input.event === "cease" || input.event === "replace" ? `OUTGOING
Name: ${input.outgoingName}
CNIC: ${input.outgoingCnic}
Mode: ${input.modeOut}
Attachments: resignation letter or members’ removal resolution
` : ""}
BOARD RESOLUTION (draft)
Resolved that ${input.event === "cease" || input.event === "replace" ? `the resignation/cessation of ${input.outgoingName || "[outgoing]"} as ${input.designation} be accepted with effect from ${input.effectiveDate || "[date]"}` : ""}${input.event === "replace" ? ", and that " : ""}${input.event === "induct" || input.event === "replace" ? `${input.incomingName || "[incoming]"} be appointed/elected as ${input.designation} with effect from ${input.effectiveDate || "[date]"}, having consented to act and confirmed they are not disqualified under ss. 153–156 of the Companies Act, 2017` : ""}.

Further resolved that Form 9 be filed on eZfile within 15 days.

CONSENT TO ACT (draft)
I, ${input.incomingName || "[name]"}, CNIC ${input.incomingCnic || "[CNIC]"}, hereby consent to act as ${input.designation} of ${input.companyName || "[Company]"} and confirm that I am not ineligible under the Companies Act, 2017.

Open: https://leap.secp.gov.pk/
`;

  return { min, after, belowMin, due, flags, pack };
}
