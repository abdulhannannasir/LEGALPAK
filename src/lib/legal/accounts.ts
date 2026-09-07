export type CompanyKind = "smc" | "private" | "public" | "listed" | "s42";

export type AccountsInput = {
  companyName: string;
  cuin: string;
  kind: CompanyKind;
  paidUp: number;
  publicLinked: boolean;
  fyEnd: string;
  agmDate: string;
  incorporationDate: string;
  turnover: number;
  employees: number;
  hasSubsidiary: boolean;
};

export type AccountsAdvice = {
  auditRequired: boolean;
  fileWithSecp: boolean;
  filingDaysAfterAgm: 15 | 30 | null;
  directorsReport: boolean;
  caFirm: boolean;
  qcr: boolean;
  bucket: string;
  notes: string[];
  flags: { level: "high" | "med" | "low"; title: string; detail: string }[];
  agmDue: string | null;
  accountsDue: string | null;
  formADue: string | null;
  firstAgmDue: string | null;
};

function addDays(iso: string, days: number): string | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function classifyAccounts(input: AccountsInput): AccountsAdvice {
  const paid = Number(input.paidUp) || 0;
  const publicLike =
    input.publicLinked ||
    input.kind === "public" ||
    input.kind === "listed" ||
    input.kind === "s42";

  const auditRequired = publicLike || paid > 1_000_000;
  const fileWithSecp = publicLike || paid > 10_000_000;
  const filingDaysAfterAgm: 15 | 30 | null = !fileWithSecp
    ? null
    : input.kind === "listed"
      ? 30
      : 15;
  const directorsReport = publicLike || paid > 3_000_000;
  const caFirm = publicLike || paid > 10_000_000;
  const qcr = paid >= 200_000_000 || input.turnover >= 1_000_000_000 || input.employees >= 750;

  let bucket = "Small private — books only";
  if (fileWithSecp && input.kind === "listed") bucket = "Listed — audit + file in 30 days of AGM";
  else if (fileWithSecp) bucket = "Must file audited pack with SECP (15 days of AGM)";
  else if (auditRequired) bucket = "Audit and lay at AGM — SECP upload usually not required";
  else bucket = "Audit and SECP accounts filing generally not required";

  const notes: string[] = [];
  if (!auditRequired) {
    notes.push(
      "s. 223: private/SMC with paid-up ≤ Rs 1 million (and not public-linked) is exempt from statutory audit.",
    );
  } else {
    notes.push("Statutory audit is required. Appoint a practising auditor; confirm at the AGM.");
  }
  if (fileWithSecp) {
    notes.push(
      `s. 233: file the signed FS + directors’ report + auditor’s report with the registrar within ${filingDaysAfterAgm} days of the AGM.`,
    );
  } else if (auditRequired) {
    notes.push(
      "s. 233 exemption: private company with paid-up ≤ Rs 10 million (not public-linked) generally does not file the audited pack with SECP — still prepare, audit, authenticate and lay at the AGM.",
    );
  } else {
    notes.push(
      "2020 amendments removed the old s. 234 unaudited filing for this band. Keep books (s. 220) and signed management accounts at the registered office.",
    );
  }
  if (directorsReport) notes.push("s. 227 directors’ report is required.");
  else notes.push("Directors’ report exempt (private, not a public subsidiary, paid-up ≤ Rs 3 million).");
  if (caFirm) notes.push("Auditor should be a practising chartered accountant / CA firm (paid-up > Rs 10 million or public-like).");
  if (qcr) notes.push("Large-sized company tests met — use a QCR-rated audit firm.");
  if (input.hasSubsidiary) notes.push("Prepare consolidated financial statements if you have a subsidiary or the framework requires it.");
  notes.push("Form A is a separate filing (30 days after AGM). FBR tax return is a third clock.");
  notes.push("File on eZfile (leap.secp.gov.pk) — Annual filing of company. Do not use legacy eServices for this.");

  const flags: AccountsAdvice["flags"] = [];
  if (input.kind === "listed" && !input.fyEnd) {
    flags.push({ level: "med", title: "Set financial year-end", detail: "Listed quarterly (s. 237) and annual clocks both hang off FY end." });
  }
  if (auditRequired && paid <= 1_000_000 && publicLike) {
    flags.push({
      level: "high",
      title: "Small capital but public-linked — audit still required",
      detail: "The Rs 1 million audit exemption does not apply to a public-interest company, a subsidiary of a public company, or a holding company of a public company.",
    });
  }
  if (auditRequired && !fileWithSecp) {
    flags.push({
      level: "med",
      title: "Do not skip the audit just because SECP filing is exempt",
      detail: "Paid-up above Rs 1 million means audit + AGM even when the registrar does not take the PDF.",
    });
  }
  if (fileWithSecp && filingDaysAfterAgm === 15) {
    flags.push({
      level: "high",
      title: "Accounts due in 15 days — Form A is 30",
      detail: "Unlisted s. 233 filers miss the accounts deadline while still thinking they have a month for Form A.",
    });
  }
  if (input.agmDate && input.fyEnd) {
    const fy = new Date(input.fyEnd + "T00:00:00");
    const agm = new Date(input.agmDate + "T00:00:00");
    const max = new Date(fy);
    max.setDate(max.getDate() + 120);
    if (agm > max) {
      flags.push({
        level: "high",
        title: "AGM later than 120 days from FY end",
        detail: `s. 132: AGM must be held within 120 days of year-end (for 30 June that is 28 October, not 31 October). Your AGM is ${fmt(input.agmDate)}.`,
      });
    }
  }
  if (input.incorporationDate) {
    const inc = new Date(input.incorporationDate + "T00:00:00");
    const first = new Date(inc);
    first.setMonth(first.getMonth() + 16);
    if (input.agmDate) {
      const agm = new Date(input.agmDate + "T00:00:00");
      if (agm > first) {
        flags.push({
          level: "high",
          title: "First AGM beyond 16 months of incorporation",
          detail: `First AGM due by ${fmt(first.toISOString().slice(0, 10))}.`,
        });
      }
    }
  }

  const agmDue = input.fyEnd ? addDays(input.fyEnd, 120) : null;
  const firstAgmDue = input.incorporationDate ? addDays(input.incorporationDate, 16 * 30) : null;
  // 16 months is calendar months not 480 days — compute properly
  let firstAgm: string | null = null;
  if (input.incorporationDate) {
    const d = new Date(input.incorporationDate + "T00:00:00");
    d.setMonth(d.getMonth() + 16);
    firstAgm = d.toISOString().slice(0, 10);
  }

  const accountsDue =
    fileWithSecp && input.agmDate && filingDaysAfterAgm
      ? addDays(input.agmDate, filingDaysAfterAgm)
      : null;
  const formADue = input.agmDate ? addDays(input.agmDate, 30) : null;

  if (flags.length === 0) {
    flags.push({
      level: "low",
      title: "Classifier complete",
      detail: "Have a Pakistani advocate or company secretary confirm the live eZfile process and any SECP notification changing the Rs 1m / Rs 10m bands.",
    });
  }

  return {
    auditRequired,
    fileWithSecp,
    filingDaysAfterAgm,
    directorsReport,
    caFirm,
    qcr,
    bucket,
    notes,
    flags,
    agmDue,
    accountsDue,
    formADue,
    firstAgmDue: firstAgm ?? firstAgmDue,
  };
}

export function formatDateLong(iso: string): string {
  if (!iso) return "____________";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function pkr(n: number): string {
  return "PKR " + Math.round(n).toLocaleString("en-PK");
}

export function generateAccountsPack(input: AccountsInput, advice: AccountsAdvice): string {
  const name = input.companyName || "[Company Name]";
  const cuin = input.cuin || "[CUIN]";
  return `FINANCIAL STATEMENT FILING MEMORANDUM
(Companies Act, 2017 — ss. 223, 227, 232, 233 / 234)

Company: ${name}
CUIN: ${cuin}
Type: ${input.kind.toUpperCase()}${input.publicLinked ? " (public-linked: PIC / public subsidiary / public holding)" : ""}
Paid-up capital: ${pkr(input.paidUp)}
Financial year ended: ${formatDateLong(input.fyEnd)}
AGM date: ${formatDateLong(input.agmDate)}
Incorporation: ${formatDateLong(input.incorporationDate)}

CLASSIFICATION
${advice.bucket}

- Statutory audit: ${advice.auditRequired ? "REQUIRED" : "Not required (s. 223 exemption — confirm public-linked status)"}
- File pack with SECP: ${advice.fileWithSecp ? `YES — within ${advice.filingDaysAfterAgm} days of AGM (s. 233)` : "Generally no (keep signed set at registered office)"}
- Directors’ report (s. 227): ${advice.directorsReport ? "REQUIRED" : "Exempt"}
- CA firm: ${advice.caFirm ? "Yes" : "Not mandated solely by the Rs 10 million test"}
- QCR-rated firm: ${advice.qcr ? "Yes (large-sized tests)" : "No"}
- Consolidated statements: ${input.hasSubsidiary ? "Consider / prepare" : "Not indicated"}

DEADLINES
- AGM (s. 132): within 120 days of FY end → ${formatDateLong(advice.agmDue || "")}
- First AGM: within 16 months of incorporation → ${formatDateLong(advice.firstAgmDue || "")}
- Accounts to registrar: ${advice.accountsDue ? formatDateLong(advice.accountsDue) : "Not a registrar filing for this bucket"}
- Form A (separate): ${advice.formADue ? formatDateLong(advice.formADue) : "30 days after AGM if Form A is due"}

AUTHENTICATION (s. 232)
The financial statements must be approved by the Board and signed by the Chief Executive and at least one Director${input.kind === "listed" ? ", and authenticated by the CFO" : ""}${input.kind === "smc" ? " (SMC: the sole director / CEO signs)" : ""}.
The auditor’s report must be dated on or after the board approval date.

PACK TO UPLOAD ON eZfile (if filing)
1. Statement of financial position
2. Statement of profit or loss (and OCI if applicable)
3. Statement of changes in equity
4. Statement of cash flows
5. Notes including accounting policies and comparatives
${advice.directorsReport ? "6. Directors’ report (s. 227)\n" : ""}${advice.auditRequired ? "7. Auditor’s report\n" : ""}8. Pattern of shareholding (public companies and private subsidiaries of public companies)

BOARD RESOLUTION (draft)

Resolved that the financial statements of ${name} for the year ended ${formatDateLong(input.fyEnd)}, together with ${advice.directorsReport ? "the directors’ report and " : ""}${advice.auditRequired ? "the auditor’s report, " : ""}be and are hereby approved, and that the Chief Executive and any one Director be authorised to sign the same for and on behalf of the Board, and that the same be laid before the members at the annual general meeting to be held on ${formatDateLong(input.agmDate)}.

${advice.fileWithSecp ? `Further resolved that the Company Secretary / authorised officer be directed to file the authenticated financial statements with the registrar through eZfile (leap.secp.gov.pk) within ${advice.filingDaysAfterAgm} days of the AGM.` : "Further resolved that the authenticated financial statements be kept at the registered office and circulated to members as required, noting that a registrar filing under s. 233 is not indicated for this company on the facts stated."}

DIRECTORS’ REPORT — SKELETON (s. 227)
${advice.directorsReport ? `The Directors present their report together with the audited financial statements of ${name} for the year ended ${formatDateLong(input.fyEnd)}.

1. Principal activities
2. Financial results (turnover, profit/(loss) after tax, EPS if applicable)
3. Dividend (or reasons for not declaring a dividend despite profits — listed)
4. Principal risks and uncertainties
5. Changes in the board during the year
6. Auditors — retiring auditors, being eligible, offer themselves for reappointment
7. Pattern of shareholding (if applicable)
8. Acknowledgement

On behalf of the Board
________________________
Chief Executive
Dated: ${formatDateLong(input.agmDate)}
` : "[Exempt — private company, not a public subsidiary, paid-up ≤ Rs 3 million.]"}

eZfile PATH
leap.secp.gov.pk → company dashboard → Annual filing of company → upload a single signed PDF.

This memorandum is a drafting aid only. It is not legal, audit or tax advice. Confirm live SECP fee, framework (IFRS / IFRS for SMEs / AFRS for SSEs) and any notification changing capital thresholds with a licensed Pakistani professional.
`;
}
