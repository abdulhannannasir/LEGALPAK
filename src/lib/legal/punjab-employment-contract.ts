import { addDaysISO, addMonthsISO, isAfterISO } from "./date.ts";

/**
 * Employment-contract generator built on the Punjab Labour Code 2026
 * (Act IX of 2026 — passed 4 Feb 2026, assented 10 Feb 2026, Punjab Gazette
 * (Extraordinary) 10 Feb 2026). Every "s." citation below was checked against
 * the official Act text; the generator writes them into the contract so a
 * reviewing lawyer can verify each clause against its source.
 *
 * Pure text in / text out, like the other packs in this folder, so it can be
 * unit-tested and exported to .txt/.docx/.pdf through PackOutput unchanged.
 */

export const LABOUR_CODE_NAME = "Punjab Labour Code 2026";
export const LABOUR_CODE_CITATION = "Act IX of 2026";

/**
 * s.1(3): the Code "shall come into force on such date as the Government may,
 * by notification in the official Gazette, specify". Press reports in May 2026
 * say it has been enforced, while later legal commentary says a commencement
 * notification is not yet confirmed — so the app surfaces this rather than
 * asserting either way. Edit here when the position is settled.
 */
export const COMMENCEMENT_NOTE =
  "The Code was enacted on 10 February 2026, but s.1(3) brings it into force on a date the Punjab Government notifies in the Gazette, and sources currently disagree on whether that has happened. This contract follows the Code (which cannot be contracted out of once in force, s.3) — confirm the commencement status with the Punjab Labour Department or your lawyer.";

/**
 * Punjab monthly minimum wage for unskilled workers (26 working days),
 * per the Punjab Government notification of 8 September 2025. The Government
 * re-notifies this each fiscal year (s.13(1)(h) "notified ... from time to
 * time"), so it is an editable input everywhere it is used — never treated as
 * fixed. It drives three checks: the s.165(1) pay floor, the s.163 five-times
 * non-compete carve-out, and the s.160 gratuity categories.
 */
export const DEFAULT_MINIMUM_WAGE = 40_000;

export type Gender = "male" | "female" | "other";
export type EmploymentType = "permanent" | "fixed_term";
export type WorkPattern = "full_time" | "part_time";
export type FixedTermBasis = "temporary_work" | "seasonal" | "replacement" | "special_project";
export type Allowance = { name: string; amount: number };

export const GENDER_LABEL: Record<Gender, string> = { male: "Male", female: "Female", other: "Other" };
export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  permanent: "Permanent",
  fixed_term: "Fixed-term",
};
export const WORK_PATTERN_LABEL: Record<WorkPattern, string> = { full_time: "Full-time", part_time: "Part-time" };

/** Objective reasons a fixed-term agreement may rest on (s.138(3), (7), (9)). */
export const FIXED_TERM_BASIS_LABEL: Record<FixedTermBasis, string> = {
  temporary_work: "Temporary work (up to three months)",
  seasonal: "Seasonal work",
  replacement: "Replacing a temporarily absent employee",
  special_project: "Special project / specialised task",
};

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export type EmploymentContractInput = {
  // Employer
  employerName: string;
  employerAddress: string;
  employerCuin: string;
  signatoryName: string;
  signatoryTitle: string;
  /** Total workers the employer engages — drives notice (s.150(5)), gratuity (s.159), profit bonus (s.253) and group insurance (s.262). null = not known. */
  headcount: number | null;

  // Employee
  fullName: string;
  fatherName: string;
  gender: Gender | "";
  dateOfBirth: string;
  cnic: string;
  passportNo: string;
  address: string;
  phone: string;
  email: string;
  employeeCode: string;

  // Role
  jobTitle: string;
  department: string;
  reportsTo: string;
  jobDescription: string;
  placeOfWork: string;
  isManagerial: boolean;

  // Terms
  employmentType: EmploymentType;
  fixedTermBasis: FixedTermBasis | "";
  fixedTermReason: string;
  workPattern: WorkPattern;
  dateOfJoining: string;
  endDate: string;
  probationMonths: number;
  weeklyHours: number;
  workingSchedule: string;
  weeklyRestDay: string;

  // Pay
  basicSalary: number;
  allowances: Allowance[];

  // Registrations
  socialSecurityNo: string;
  eobiNo: string;

  // Drafting options
  contractDate: string;
  city: string;
  minimumWage: number;
  providentFund: boolean;
  nonSolicitMonths: number;
  nonCompete: boolean;
  nonCompeteMonths: number;
  nonCompeteScope: string;
  additionalTerms: string;
};

// ---------------------------------------------------------------- helpers

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function fmtDate(iso: string, label: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return `[${label}]`;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

function ph(value: string | undefined | null, label: string): string {
  const v = (value ?? "").trim();
  return v || `[${label}]`;
}

function groupThousands(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatPKR(n: number): string {
  return `PKR ${groupThousands(n)}`;
}

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowThousand(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ""));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

function wholeInWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 10_000_000);
  n %= 10_000_000;
  const lakh = Math.floor(n / 100_000);
  n %= 100_000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${wholeInWords(crore)} Crore`);
  if (lakh) parts.push(`${belowThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${belowThousand(thousand)} Thousand`);
  if (n) parts.push(belowThousand(n));
  return parts.join(" ");
}

/** "Rupees One Lakh Twenty Thousand Only" — amounts in words as Pakistani contracts customarily state them. */
export function amountInWords(amount: number): string {
  const rupees = Math.floor(Math.max(0, amount));
  const paisa = Math.round((Math.max(0, amount) - rupees) * 100);
  const words = `Rupees ${wholeInWords(rupees)}`;
  return paisa > 0 ? `${words} and ${wholeInWords(paisa)} Paisa Only` : `${words} Only`;
}

export function grossMonthly(i: Pick<EmploymentContractInput, "basicSalary" | "allowances">): number {
  return i.basicSalary + i.allowances.reduce((sum, a) => sum + (Number.isFinite(a.amount) ? a.amount : 0), 0);
}

/** Last day of probation: the day before the same date `months` later. */
export function probationEndDate(joining: string, months: number): string | null {
  if (!joining || months <= 0) return null;
  const end = addMonthsISO(joining, months);
  return end ? addDaysISO(end, -1) : null;
}

/** Whether `today` falls inside the probationary period — false before the employee has actually started. */
export function isOnProbation(dateOfJoining: string | null, probationMonths: number, today: string): boolean {
  if (!dateOfJoining || today < dateOfJoining) return false;
  const end = probationEndDate(dateOfJoining, probationMonths);
  return end !== null && today <= end;
}

/** Complete years between two ISO dates (birthday-aware), or null if either is unusable. */
export function ageOn(dateOfBirth: string, onDate: string): number | null {
  const b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth);
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(onDate);
  if (!b || !d) return null;
  let age = Number(d[1]) - Number(b[1]);
  if (Number(d[2]) < Number(b[2]) || (Number(d[2]) === Number(b[2]) && Number(d[3]) < Number(b[3]))) age -= 1;
  return age;
}

type Threshold = "yes" | "no" | "unknown";
function atLeast(headcount: number | null, n: number): Threshold {
  if (headcount === null) return "unknown";
  return headcount >= n ? "yes" : "no";
}

/** s.13(1)(g): a micro-enterprise employs fewer than ten employees. */
function isMicro(headcount: number | null): Threshold {
  if (headcount === null) return "unknown";
  return headcount < 10 ? "yes" : "no";
}

function isFixedTermSpecial(i: EmploymentContractInput): boolean {
  return i.employmentType === "fixed_term" && i.fixedTermBasis === "special_project";
}

/** The s.163(1) carve-out: a managerial/administrative employee earning more than five times the minimum wage may be bound by a non-compete. */
export function nonCompeteAllowed(i: EmploymentContractInput): boolean {
  return i.isManagerial && i.minimumWage > 0 && grossMonthly(i) > 5 * i.minimumWage;
}

// ------------------------------------------------------------- compliance

export type ComplianceIssue = {
  level: "error" | "warning" | "info";
  message: string;
  /** Section of the Code the point rests on, e.g. "s.165(1)". */
  ref?: string;
};

/**
 * Pre-flight checks against the Code, run before (and displayed alongside) the
 * generated draft. Errors mean the draft as configured would breach or be
 * defeated by the Code; warnings are missing s.142 particulars or judgement
 * calls; info explains how the draft was tailored.
 */
export function checkEmploymentContract(i: EmploymentContractInput): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const gross = grossMonthly(i);
  const minWage = i.minimumWage;

  // s.142(1) mandatory particulars
  const missing: string[] = [];
  if (!i.employerName.trim()) missing.push("employer name");
  if (!i.employerAddress.trim()) missing.push("employer address");
  if (!i.signatoryName.trim() || !i.signatoryTitle.trim()) missing.push("name and position of the person signing for the employer");
  if (!i.fullName.trim()) missing.push("employee's full name");
  if (!i.dateOfBirth) missing.push("employee's date of birth");
  if (!i.gender) missing.push("employee's gender");
  if (!i.address.trim()) missing.push("employee's residence");
  if (!i.cnic.trim() && !i.passportNo.trim()) missing.push("employee's CNIC or passport number");
  if (!i.jobTitle.trim()) missing.push("job title");
  if (!i.jobDescription.trim()) missing.push("detailed description of duties");
  if (!i.dateOfJoining) missing.push("date of commencement");
  if (missing.length > 0) {
    issues.push({
      level: "warning",
      message: `The Code requires the agreement to state: ${missing.join("; ")}. These appear as [bracketed] placeholders until filled in.`,
      ref: "s.142(1)",
    });
  }

  // pay
  if (!(i.basicSalary > 0)) {
    issues.push({ level: "error", message: "Enter a basic salary — it is a mandatory term of the agreement.", ref: "s.142(1)(k)" });
  } else if (minWage > 0 && i.basicSalary < minWage && i.workPattern === "full_time") {
    issues.push({
      level: "error",
      message: `Basic wage ${formatPKR(i.basicSalary)} is below the notified minimum wage of ${formatPKR(minWage)}.`,
      ref: "s.165(1), s.167",
    });
  } else if (minWage > 0 && i.basicSalary < minWage) {
    issues.push({
      level: "info",
      message: `Part-time basic wage ${formatPKR(i.basicSalary)} is below the full-time minimum wage; make sure it is at least the pro-rata equivalent for the agreed hours.`,
      ref: "s.136(4), s.167",
    });
  }

  // hours
  if (i.weeklyHours > 48) {
    issues.push({
      level: "error",
      message: `${i.weeklyHours} normal hours a week exceeds the 48-hour limit (50 for seasonal establishments, 56 for continuous-process workplaces). Hours beyond the limit are overtime, payable at double rate and only with consent.`,
      ref: "s.176(1)-(3), s.179",
    });
  }
  if (i.workPattern === "part_time" && i.weeklyHours >= 48) {
    issues.push({
      level: "warning",
      message: "A part-time employee works fewer hours than a comparable full-time employee — reduce the weekly hours or mark the role full-time.",
      ref: "s.136(1)",
    });
  }

  // probation
  if (i.probationMonths > 3) {
    issues.push({ level: "error", message: "Probation cannot exceed three months.", ref: "s.144(1)" });
  }
  if (i.employmentType === "fixed_term" && i.probationMonths > 0) {
    issues.push({
      level: "info",
      message: "For a fixed-term agreement the probation period must be proportionate to the agreement's duration and the nature of the work.",
      ref: "s.144(2)",
    });
  }

  // fixed-term
  if (i.employmentType === "fixed_term") {
    if (!i.fixedTermBasis) {
      issues.push({
        level: "error",
        message: "A fixed-term agreement must state the objective reason for the fixed term.",
        ref: "s.138(2)-(3)",
      });
    } else if (!i.fixedTermReason.trim()) {
      issues.push({ level: "warning", message: "Describe the objective reason (the task, project, season or absent employee).", ref: "s.138(3)" });
    }
    if (!i.endDate && i.fixedTermBasis !== "replacement") {
      issues.push({ level: "error", message: "Enter the end date (or expected duration) of the fixed term.", ref: "s.142(1)(f)" });
    }
    if (i.endDate && i.dateOfJoining) {
      if (isAfterISO(i.dateOfJoining, i.endDate)) {
        issues.push({ level: "error", message: "The end date is before the start date.", ref: "s.142(1)(f)" });
      } else {
        const limit = isFixedTermSpecial(i) ? 60 : 3;
        const cutoff = addMonthsISO(i.dateOfJoining, limit);
        if (cutoff && !isAfterISO(cutoff, i.endDate)) {
          issues.push(
            isFixedTermSpecial(i)
              ? { level: "error", message: "A special-project fixed term cannot exceed five years; longer terms are deemed permanent.", ref: "s.139(4), s.138(5)(b)" }
              : {
                  level: "warning",
                  message: "A general fixed-term agreement cannot exceed three months (nine months across three successive agreements). A longer term is deemed a permanent agreement.",
                  ref: "s.139(3), s.138(5)(b)",
                },
          );
        }
      }
    }
    if (isFixedTermSpecial(i) && minWage > 0 && gross < 5 * minWage) {
      issues.push({
        level: "error",
        message: `A special-project fixed-term agreement is only allowed where remuneration is at least five times the minimum wage (${formatPKR(5 * minWage)} a month).`,
        ref: "s.138(8)",
      });
    }
    issues.push({
      level: "info",
      message: "A fixed-term agreement cannot be used for work of a permanent nature or a post connected with the core operations of the establishment — it is then deemed permanent. It may be renewed for two successive terms only.",
      ref: "s.138(4)-(5), s.139(1)",
    });
  }

  // age
  const ageAtJoining = i.dateOfBirth && i.dateOfJoining ? ageOn(i.dateOfBirth, i.dateOfJoining) : null;
  if (ageAtJoining !== null) {
    if (ageAtJoining < 16) {
      issues.push({
        level: "error",
        message: `The employee would be ${ageAtJoining} at commencement. A child (under 16) cannot be engaged in any occupation; only light work from age 14 within Schedule 1 limits is allowed, and not under an ordinary employment agreement.`,
        ref: "s.22(a), s.23(1), s.24",
      });
    } else if (ageAtJoining < 18) {
      issues.push({
        level: "warning",
        message: "The employee is a young person (16–17). Hazardous work is prohibited and working time is restricted.",
        ref: "s.26, s.27",
      });
    }
  }

  // restraints
  if (i.nonCompete) {
    if (nonCompeteAllowed(i)) {
      issues.push({
        level: "info",
        message: "A post-employment non-compete is permitted here only because the employee is managerial/administrative and earns over five times the minimum wage. It must still be reasonable in duration and scope to be enforceable — have it reviewed.",
        ref: "s.163(1)",
      });
    } else {
      issues.push({
        level: "warning",
        message:
          "A non-compete was requested but will be left out: post-employment restraints of trade are void unless the employee is a managerial/administrative employee earning over five times the minimum wage. Confidentiality and client non-solicitation are still included.",
        ref: "s.163(1)-(4)",
      });
    }
  }

  // tailoring notes
  if (i.headcount === null) {
    issues.push({
      level: "info",
      message: "Set the company's total headcount to tailor notice (14 vs 30 days), gratuity (20+ workers), profit bonus (20+) and group insurance (50+). Until then the draft states each rule conditionally.",
      ref: "s.150(5), s.159(1), s.253, s.262",
    });
  } else if (isMicro(i.headcount) === "yes") {
    issues.push({ level: "info", message: `With ${i.headcount} employees the employer is a micro-enterprise (under ten): the notice period is 14 days, not 30.`, ref: "s.13(1)(g), s.150(5)" });
  }
  if (atLeast(i.headcount, 20) === "no") {
    issues.push({ level: "info", message: "Statutory gratuity does not apply to establishments with fewer than 20 workers.", ref: "s.159(1)" });
  }
  if (i.providentFund) {
    issues.push({
      level: "info",
      message: "Provident fund: gratuity is not payable for the fund's period only if the employer's contribution is at least the employee's and at least the gratuity that would be due.",
      ref: "s.161(1)",
    });
  }

  return issues;
}

// -------------------------------------------------------------- generator

type Section = { heading: string; items: string[] };

function relation(gender: Gender | ""): string {
  if (gender === "male") return "son of";
  if (gender === "female") return "daughter of";
  return "child of";
}

function pad(text: string, width: number): string {
  return text.length >= width ? text + "  " : text + " ".repeat(width - text.length);
}

function leader(label: string, value: string, width = 46): string {
  const dots = Math.max(3, width - label.length);
  return `${label} ${".".repeat(dots)} ${value}`;
}

function buildSections(i: EmploymentContractInput): Section[] {
  const sections: Section[] = [];
  const gross = grossMonthly(i);
  const fixed = i.employmentType === "fixed_term";
  const partTime = i.workPattern === "part_time";
  const start = fmtDate(i.dateOfJoining, "Date of commencement");
  const gratuity = atLeast(i.headcount, 20);
  const micro = isMicro(i.headcount);

  // 1 — type and commencement
  {
    const items: string[] = [];
    if (fixed) {
      const basis = i.fixedTermBasis as FixedTermBasis | "";
      const end = i.endDate ? fmtDate(i.endDate, "End date") : "[End date]";
      let ending = `ends on ${end}`;
      if (basis === "replacement") ending = i.endDate ? `ends on ${end} or, if earlier, on the return to work of the absent employee being replaced` : "ends on the return to work of the absent employee being replaced";
      if (basis === "special_project") ending = `ends on ${end} or, if earlier, on completion of the specific task or project`;
      if (basis === "seasonal") ending = `ends on ${end}, the close of the season for which the work is required`;
      items.push(`This is a fixed-term employment agreement (section 138). The Employee's employment commences on ${start} and ${ending}.`);
      items.push(
        `The objective reason for the fixed term, stated as section 138(3) requires, is: ${basis ? FIXED_TERM_BASIS_LABEL[basis as FixedTermBasis] : "[Objective reason]"}${i.fixedTermReason.trim() ? ` - ${i.fixedTermReason.trim()}` : ""}.`,
      );
      items.push(
        "This Agreement may be renewed for not more than two successive terms, and the terms and conditions of a renewal shall not be reduced from this Agreement (section 139(1)). A fixed-term agreement is deemed a permanent employment agreement if it fills on a lasting basis a post connected with the core operations of the establishment, exceeds the maximum duration the Code allows, or is renewed for more than two successive terms (sections 138(5) and 139).",
      );
      items.push("The Employee shall not be treated less favourably than a comparable permanent employee solely because this is a fixed-term agreement, unless different treatment is justified on objective grounds (section 140).");
    } else {
      items.push(`This is a permanent employment agreement (section 137). The Employee's employment commences on ${start} and continues until it is terminated in accordance with clause 8.`);
    }
    if (partTime) {
      items.push(
        `The Employee is in part-time employment (section 136) with normal hours of ${i.weeklyHours} hours per week. Remuneration, bonuses and allowances are determined and paid in proportion to the agreed hours (pro rata temporis, section 136(4)), and pecuniary leave entitlements are proportionate to hours of work (section 136(6)). The Employee has informed the Employer of any existing part-time employment agreement with another employer (section 136(2)). The Employee shall not be treated less favourably than a comparable full-time employee solely because of working part-time, unless justified on objective grounds (section 136(3)).`,
      );
    } else {
      items.push(
        i.weeklyHours < 48
          ? `The Employee is in full-time employment (section 135) on a working week of ${i.weeklyHours} hours, which the Code permits an agreement to fix below 48 hours (section 135(2)).`
          : "The Employee is in full-time employment: normal hours of work of eight hours a day and forty-eight hours a week (section 135).",
      );
    }
    sections.push({ heading: "TYPE AND COMMENCEMENT OF EMPLOYMENT", items });
  }

  // 2 — position and duties
  {
    const items: string[] = [];
    const dept = i.department.trim() ? `, in the ${i.department.trim()} department` : "";
    const code = i.employeeCode.trim() ? ` The Employee's personnel number is ${i.employeeCode.trim()}.` : "";
    items.push(
      `The Employee is employed as ${ph(i.jobTitle, "Job title")}${dept}${i.reportsTo.trim() ? `, reporting to ${i.reportsTo.trim()}` : ""}. The Employee is ${i.isManagerial ? "a managerial or administrative employee within the meaning of section 5(2)" : "not a managerial or administrative employee within the meaning of section 5(2)"}.${code}`,
    );
    items.push(`Detailed description of the tasks to be performed (section 142(1)(d)): ${ph(i.jobDescription, "Description of duties")}`);
    items.push(
      `The Employee's place of work is ${ph(i.placeOfWork || i.employerAddress, "Place of work")}. Where the Employee has no fixed or main place of work, the place of work is the Employer's registered place of business (section 142(1)(c)).`,
    );
    items.push("The Employee shall perform the duties diligently and in good faith, and shall follow the lawful and reasonable instructions of the Employer that are consistent with this Agreement and the Code.");
    items.push("The Employer shall give the Employee an employment card showing name, personnel number, designation and photograph, which the Employee shall display during working hours (section 143).");
    sections.push({ heading: "POSITION, DUTIES AND PLACE OF WORK", items });
  }

  // 3 — probation
  {
    const items: string[] = [];
    if (i.probationMonths > 0) {
      const pEnd = probationEndDate(i.dateOfJoining, i.probationMonths);
      const span = pEnd ? ` from ${start} to ${fmtDate(pEnd, "End of probation")}` : "";
      items.push(`The Employee shall serve a probationary period of ${i.probationMonths} month${i.probationMonths === 1 ? "" : "s"}${span}. A probationary period shall not in any event exceed three months (section 144(1)).${fixed ? " As this is a fixed-term agreement, the probationary period is proportionate to its expected duration and the nature of the work (section 144(2))." : ""}`);
      items.push("During the probationary period either Party may terminate this Agreement at any time without notice (section 144(3)), and unsuccessful completion of probation is a valid reason for termination (section 146(2)(e)).");
      items.push(
        "If the Employer does not expressly terminate this Agreement during the probationary period and the period expires without notice from either Party, the Employee is presumed to have successfully cleared probation (section 144(4)). A successfully completed probationary period forms part of the Employee's total length of service (section 144(6)), and if the Employee is later re-engaged for the same job the Employer may not require a new probationary period (section 144(5)).",
      );
    } else {
      items.push("No probationary period applies. The Employee's employment is confirmed from the date of commencement (section 142(1)(g)).");
    }
    sections.push({ heading: "PROBATIONARY PERIOD", items });
  }

  // 4 — hours
  {
    const items: string[] = [];
    items.push(
      partTime
        ? `Normal hours of work are ${i.weeklyHours} hours per week and shall not exceed eight hours on any day (section 176(1)).`
        : i.weeklyHours >= 48
          ? "Normal hours of work are eight hours per day and forty-eight hours per week (section 176(1))."
          : `Normal hours of work are ${i.weeklyHours} hours per week and shall not exceed eight hours on any day (sections 135(2) and 176(1)).`,
    );
    if (i.workingSchedule.trim()) items.push(`Working schedule: ${i.workingSchedule.trim()}.`);
    items.push(
      `Weekly rest day: ${ph(i.weeklyRestDay, "Weekly rest day")}. The Employee is entitled to a weekly rest of at least twenty-four consecutive hours (section 182), a rest break of at least one hour when working continuously for more than six hours (section 180), and a daily rest of at least twelve consecutive hours between finishing and resuming work (section 181).`,
    );
    items.push("The Employee shall be paid for all public holidays declared by the Government (section 183).");
    items.push(
      "The Employer may ask the Employee to work overtime only if the Employee agrees, and overtime shall not exceed two hours on any day or eight hours in any week (section 179(1)). Ordinary overtime and work on the weekly rest day are paid at two times the normal hourly remuneration, and work on a public holiday at three times (section 179(3)). Where the Employer and the Employee so agree, a substitute weekly rest day within three days (for weekly-rest-day work), or a substitute day off and compensatory rest day within seven days (for public-holiday work), may be given instead of overtime pay (section 179(3)).",
    );
    if (i.gender === "female" || i.gender === "" || i.gender === "other") {
      items.push("Where the Employee is a woman, work beyond 8:00 pm is subject to the Employee's prior consent and to the Employer arranging pick-and-drop transport as section 176(5) requires.");
    }
    items.push("After twelve months of service the Employee may request flexible working arrangements, which the Employer shall consider and answer, giving reasons for any refusal or postponement (section 177).");
    sections.push({ heading: "WORKING HOURS, REST AND OVERTIME", items });
  }

  // 5 — remuneration
  {
    const items: string[] = [];
    items.push(
      `The Employee's initial basic wage is ${formatPKR(i.basicSalary)} (${amountInWords(i.basicSalary)}) per month${partTime ? ", for the agreed part-time hours" : ""}, which is not below the minimum wage notified by the Government (sections 165(1) and 167).`,
    );
    if (i.allowances.length > 0) {
      items.push(`The following allowances are payable in addition, shown separately as section 142(1)(k) requires: ${i.allowances.map((a) => `${a.name} ${formatPKR(a.amount)}`).join("; ")}. The gross monthly remuneration is ${formatPKR(gross)} (${amountInWords(gross)}), as set out in Schedule A.`);
    } else {
      items.push(`No allowances are payable. The gross monthly remuneration is ${formatPKR(gross)}, as set out in Schedule A.`);
    }
    items.push(
      "Remuneration is payable monthly in Pakistani rupees by credit to the Employee's bank account, before the expiry of the seventh day of the succeeding month (section 165(5) and (11)(d)). The Employer bears the cost of transferring remuneration (section 165(7)), and the Employer and the Employee shall together ensure that the Employee has a bank account (section 165(6)).",
    );
    items.push("With each payment the Employer shall give the Employee an accurate itemised pay slip showing basic wage, allowances, gross remuneration, deductions, net remuneration and leave balances (section 165(15)).");
    items.push(
      "Deductions may be made only as the Code authorises (section 168), including statutory contributions and income tax. The Employer shall not pay remuneration in vouchers or coupons, or require the Employee to repay remuneration or to pay anything to obtain or keep the job (section 166).",
    );
    items.push("The Employee is free to disclose and discuss the Employee's remuneration and the terms that determine it with anyone, including other employees (section 162).");
    items.push("Any increment or discretionary bonus is at the Employer's discretion unless agreed in writing.");
    if (gratuity === "yes") {
      items.push("As the Employer has twenty or more employees, an Employee who has been employed for a continuous period of not less than ninety days in a year in which the Employer makes a profit shares in the profit bonus in accordance with section 253.");
    } else if (gratuity === "unknown") {
      items.push("If the Employer has twenty or more employees and makes a profit in a year, an Employee employed for a continuous period of not less than ninety days in that year shares in the profit bonus in accordance with section 253.");
    }
    sections.push({ heading: "REMUNERATION", items });
  }

  // 6 — leave
  {
    const items: string[] = [];
    items.push(
      "Annual leave: the Employee is entitled to eighteen calendar days of annual leave with pay after twelve months of continuous service, the leave year running from 1 January to 31 December irrespective of the start date, with proportionate leave for shorter service in a calendar year (section 192(1)-(2)). Untaken annual leave may accumulate up to thirty days, and leave beyond thirty days is paid for in full (section 192(5)). Public holidays are not counted as annual leave (section 192(6)). Any agreement to give up annual leave is void (section 192(14)).",
    );
    items.push("Sick leave: eight days in a calendar year with full remuneration, a registered medical practitioner's certificate being required for sick leave beyond two days, with accumulation up to sixteen days (section 193).");
    items.push("Casual leave: ten days in a calendar year with full remuneration, not ordinarily more than three days at a time, not to be accumulated and not to be taken together with other leave (section 195).");
    items.push("Quarantine leave: up to fourteen days of paid quarantine leave in a calendar year where the Employee has an infectious disease during an epidemic or pandemic and attendance is hazardous to others, on the recommendation of the district medical superintendent (section 194).");
    if (i.gender === "female") {
      items.push(
        "Maternity leave: the Employee is entitled to paid maternity leave at the rate of average monthly remuneration - six weeks pre-natal and eight weeks post-natal leave (six weeks of which are compulsory), and further leave in the cases of medical complication and miscarriage that section 197(1) provides - provided the Employee has been employed for at least six months before the expected confinement. The Employer shall not terminate the Employee during pregnancy or maternity leave or for four months after return to work, except on grounds unrelated to pregnancy, birth or nursing (section 197). Iddat leave of up to 130 days with full pay is available on the death of the Employee's husband, in line with the Employee's faith (section 196).",
      );
    } else if (i.gender === "male") {
      items.push("Paternity leave: seven calendar days with full pay, commencing on or immediately before the date of delivery of the Employee's child, except where the Employee already has two or more surviving children (section 198).");
    } else {
      items.push("Maternity leave (section 197), paternity leave (section 198) and iddat leave (section 196) are available to the Employee to the extent those sections apply.");
    }
    items.push("Sections 194 and 196 do not apply to an Employee who is covered by the Provincial Employees' Social Security Ordinance, 1965 or the law in force in its place.");
    if (partTime) items.push("For part-time employment, pecuniary leave entitlements are proportionate to the hours of work (section 136(6)).");
    sections.push({ heading: "LEAVE AND HOLIDAYS", items });
  }

  // 7 — social security, provident fund, insurance
  {
    const items: string[] = [];
    items.push(
      `Registration details (section 142(1)(l)): employees' social security number - ${i.socialSecurityNo.trim() || "not yet registered"}; employees' old-age benefits number - ${i.eobiNo.trim() || "not yet registered"}. The Employer shall register the Employee with the employees' social security institution and the employees' old-age benefits institution as the law requires, and shall tell the Employee the registration numbers.`,
    );
    if (i.providentFund) {
      items.push(
        "The Employee shall be a contributor to the Employer's provident fund. The Employer and the Employee shall each contribute to the fund an amount equal to one month's remuneration in a year (section 161(2)). No gratuity is payable for the period the fund has existed if the Employer's contribution is not less than the Employee's and not less than the gratuity payable under the Code (section 161(1)). The Employee is entitled to the amount standing to the Employee's credit, including the Employer's contributions, whatever the reason for termination (section 161(3)).",
      );
    }
    const insurance = atLeast(i.headcount, 50);
    if (insurance === "yes") {
      items.push("As the Employer has fifty or more employees, the Employer shall insure the Employee, after three months of service, against death and disability whether natural or from employment injury or occupational disease, for not less than the amount specified in Schedule 8 of the Code, and shall bear the premiums (section 262).");
    } else if (insurance === "unknown") {
      items.push("If the Employer has fifty or more employees, it shall insure the Employee, after three months of service, against death and disability for not less than the amount specified in Schedule 8 of the Code, and shall bear the premiums (section 262).");
    }
    sections.push({ heading: "SOCIAL SECURITY, PROVIDENT FUND AND INSURANCE", items });
  }

  // 8 — termination
  {
    const items: string[] = [];
    items.push(
      "This Agreement may be terminated only as section 146(1) provides: by agreement of both Parties; in the case of a fixed-term agreement, on reaching the specified date, completing the specific task or the occurrence of the specific event; on the death or legal incapacity of either Party; or by the Employee's resignation. The Employer may also terminate it for a valid reason connected with the Employee's capacity or conduct or the operational requirements of the establishment, including absence of more than ten days without intimation, redundancy, gross misconduct, unsatisfactory performance, or unsuccessful completion of probation (section 146(2)).",
    );
    items.push(
      "Termination by the Employer shall be by an order in writing stating the reason (section 146(3)). Before terminating for the Employee's conduct or performance the Employer shall give the Employee an opportunity to defend against the allegations (section 146(4)), and it shall terminate for unsatisfactory performance only after giving appropriate instructions and a written warning and allowing a reasonable time for improvement (section 146(5)).",
    );
    const days = micro === "yes" ? 14 : 30;
    const noticeBasis = micro === "yes" ? "section 150(1) and (5)" : "section 150(1)";
    items.push(
      `Except during the probationary period, an Employee whose employment is to be terminated by the Employer, other than for gross misconduct, is entitled to ${days} days' written notice or the last drawn ${days} days' remuneration in lieu of notice (${noticeBasis}). The Employee may resign by giving the Employer ${days} days' written notice or by paying the Employer the last drawn ${days} days' remuneration in lieu of notice (section 150(2)${micro === "yes" ? " and (5)" : ""}).${micro === "unknown" ? " Where the Employer is a micro-enterprise employing fewer than ten employees, the notice period for both Parties is 14 days (section 150(5))." : ""}`,
    );
    if (fixed) items.push("No notice is required when a fixed-term agreement ends by expiry of its term, completion of the task or occurrence of the event (section 146(1)(b)); termination earlier than that is subject to this clause 8.");
    items.push(
      "During the notice period the employment continues in its original form (section 150(3)); the Employee is entitled to one paid day off each week, in addition to the weekly rest day, to seek other employment (section 150(4)); and the notice period is not counted as annual leave (section 192(9)).",
    );
    items.push(
      "Gross misconduct means the acts and omissions listed in section 151, including theft, fraud or dishonesty in connection with the Employer's business or property, wilful damage to the Employer's property, taking or giving bribes, habitual absence or absence without leave for more than ten days cumulatively, and being at work impaired by drink or drugs. Before acting on an allegation of gross misconduct the Employer shall give the Employee the opportunity to defend that section 146(4) requires and, where it employs more than twenty employees, follow the procedure in sections 154 and 155.",
    );
    items.push("The Employer shall not terminate this Agreement on any ground prohibited by section 147, including trade union membership or activities, filing a complaint or taking part in proceedings against the Employer, discrimination, or absence on statutory leave. Termination for redundancy is governed by section 149, including its consultation requirements and the principle that the last person employed in a category is the first to go.");
    sections.push({ heading: "TERMINATION AND NOTICE", items });
  }

  // 9 — final dues, gratuity, certificate
  {
    const items: string[] = [];
    items.push(
      "On termination for any reason, the Employer shall pay all remuneration earned and other dues, including payment for untaken annual leave (calculated pro rata for service of less than one year), before the expiry of the second working day after termination (sections 146(6), 165(12) and 192(13)).",
    );
    items.push(
      "Within ten working days after termination the Employer shall give the Employee a certificate of employment stating the Employer's name, address and the nature of its business, the length of the Employee's continuous employment, the capacity in which the Employee was employed and the reason for termination. The certificate shall not evaluate the Employee's work unless the Employee asks for that (section 158).",
    );
    const min = i.minimumWage;
    let tier: string;
    if (!(min > 0)) {
      tier = "The cap on gratuity under section 160 depends on the Employee's average monthly remuneration relative to the notified monthly minimum wage.";
    } else if (gross <= 5 * min) {
      tier = "Because the Employee's average monthly remuneration does not exceed five times the notified monthly minimum wage, gratuity is uncapped (section 160(1)).";
    } else if (gross <= 10 * min) {
      tier = "Because the Employee's average monthly remuneration exceeds five times but does not exceed ten times the notified monthly minimum wage, gratuity is payable on termination for redundancy or retrenchment only and is capped at twelve months of remuneration (section 160(1)).";
    } else {
      tier = "Because the Employee's average monthly remuneration exceeds ten times the notified monthly minimum wage, gratuity is payable on termination for redundancy or retrenchment only and is capped at six months of remuneration (section 160(1)).";
    }
    const rule =
      "On termination by either Party, other than for gross misconduct, after a year of continuous service, the Employee (or, on the Employee's death, the Employee's heirs) is entitled to a gratuity equal to thirty days' remuneration for every year of service, calculated on the remuneration for the last month of service; after the first year, service exceeding six months is treated as a full year (section 159(2)). Gratuity due to heirs is paid only by deposit with the Commissioner, in the manner section 159(4) provides.";
    if (gratuity === "yes") {
      items.push(`${rule} ${tier}`);
    } else if (gratuity === "no") {
      items.push("The Employer engages fewer than twenty workers, so statutory gratuity under section 159 does not apply to this Agreement (section 159(1)). The Parties may agree a more favourable term in writing.");
    } else {
      items.push(`Where the Employer's establishment engages twenty or more workers, gratuity is payable as follows. ${rule} ${tier} Section 159 does not apply to an establishment that engages fewer than twenty workers (section 159(1)).`);
    }
    sections.push({ heading: "FINAL DUES, GRATUITY AND CERTIFICATE OF EMPLOYMENT", items });
  }

  // 10 — confidentiality, non-solicitation, work product
  {
    const items: string[] = [];
    items.push(
      "During and after employment the Employee shall keep confidential, and shall not use except for the Employer's business, the Employer's trade secrets and its confidential and proprietary information, including confidential client information (section 163(4)(a)). This clause does not restrict the Employee from discussing remuneration and the terms that determine it (section 162), from filing a complaint or taking part in proceedings under the Code (section 147(1)(d)), or from making a disclosure the law requires.",
    );
    if (i.nonSolicitMonths > 0) {
      items.push(`For ${i.nonSolicitMonths} months after the employment ends the Employee shall not solicit the Employer's clients whom the Employee learned about during the employment (section 163(4)(b)).`);
    }
    items.push("Work product, inventions and materials that the Employee creates in the course of the employment and within its scope belong to the Employer, and the Employee shall do what is reasonably needed to vest those rights in the Employer.");
    items.push("On termination the Employee shall return all property, documents and data of the Employer in the Employee's possession.");
    sections.push({ heading: "CONFIDENTIALITY, NON-SOLICITATION AND WORK PRODUCT", items });
  }

  // 11 — restraint of trade
  {
    const items: string[] = [];
    if (i.nonCompete && nonCompeteAllowed(i) && i.nonCompeteMonths > 0) {
      items.push(
        `Section 163(1) does not apply to this Agreement because the Employee is a managerial or administrative employee whose average monthly remuneration exceeds five times the notified monthly minimum wage. For ${i.nonCompeteMonths} months after the employment ends the Employee shall not, ${i.nonCompeteScope.trim() || "within the territory in which the Employer carries on business"}, engage in a business that directly competes with the Employer's business. This restraint is limited to what is reasonably necessary to protect the Employer's legitimate interests.`,
      );
    } else {
      items.push(
        "Nothing in this Agreement restrains the Employee from engaging in a lawful profession, trade or business of any kind after the employment ends. A term to that effect is void, and the Employer shall not include one (section 163(2)-(3)). This clause is subject only to the confidentiality and client non-solicitation obligations that section 163(4) permits, set out in clause 10.",
      );
    }
    sections.push({ heading: "RESTRAINT OF TRADE", items });
  }

  // 12 — internal regulations, discipline, safety
  sections.push({
    heading: "INTERNAL WORK REGULATIONS, DISCIPLINE AND SAFETY",
    items: [
      "The Employee shall comply with the Employer's internal work regulations under section 145, which the Employer shall make accessible to the Employee. The regulations cannot be contrary to the Code (section 145(2)), and they and any disciplinary rules applicable to the Employee form part of the terms of employment by reference (section 142(1)(n) and (2)).",
      "Disciplinary measures shall be taken only as the Code allows: a written notice of the alleged misconduct, at least two weeks for the Employee to respond, and, where the Employer employs more than twenty employees, an independent inquiry before any penalty (sections 154 to 156). Penalties are limited to those in section 156, and a fine shall not exceed three percent of a month's remuneration.",
      "The Employer shall provide a safe and healthy workplace under Chapter 2.5 of the Code, and the Employee shall observe the safety and health rules (section 45). Both Parties shall refrain from violence and harassment at work (section 50), and the Employee may bring a complaint to the Grievance Redressal Committee (section 51).",
      "The Employer shall not discriminate against the Employee on any prohibited ground and shall pay equal remuneration for work of equal value (Chapter 2.4, including section 36).",
    ],
  });

  // 13 — statutory protection and general
  sections.push({
    heading: "STATUTORY PROTECTION AND GENERAL TERMS",
    items: [
      "Nothing in this Agreement excludes or limits any provision of the Code. A term that does so, or by which the Employee gives up a right the Code confers, is void, while terms more favourable to the Employee than the Code are valid (section 3).",
      "This Agreement is the entire agreement between the Parties about the Employee's employment. It may be varied only in writing, and the Employer shall communicate any change in the conditions of employment to the Employee in writing within seven days of the change (section 141(7)).",
      "Either Party may take a dispute to the dispute resolution bodies constituted under the Code, and nothing in this Agreement prevents either Party from doing so (section 3(1)(b)).",
      `This Agreement is governed by the laws of the Islamic Republic of Pakistan in force in the Punjab, including the Code. Subject to the previous clause, the courts at ${ph(i.city, "City")} have jurisdiction.`,
      "This Agreement is made in duplicate. The Employer shall keep a copy throughout the Employee's employment (section 142(4)), and the Employee has received a copy before commencing employment (section 141(4)-(5)). The Employer has explained the contents of this Agreement verbally to the Employee in plain local language (section 142(3)).",
    ],
  });

  if (i.additionalTerms.trim()) {
    sections.push({
      heading: "ADDITIONAL TERMS",
      items: [`The following additional terms apply, to the extent they are consistent with the Code: ${i.additionalTerms.trim().replace(/\s*\n+\s*/g, " ")}`],
    });
  }

  return sections;
}

export function generateEmploymentContract(i: EmploymentContractInput): string {
  const employer = ph(i.employerName, "Employer name");
  const cuin = i.employerCuin.trim() ? `CUIN ${i.employerCuin.trim()}, ` : "";
  const idNo = i.cnic.trim()
    ? `CNIC No. ${i.cnic.trim()}`
    : i.passportNo.trim()
      ? `Passport No. ${i.passportNo.trim()}`
      : "CNIC / Passport No. [CNIC or passport number]";
  const contact = [i.phone.trim() && `Phone: ${i.phone.trim()}`, i.email.trim() && `Email: ${i.email.trim()}`].filter(Boolean).join("; ");
  const city = ph(i.city, "City");
  const date = fmtDate(i.contractDate, "Date of agreement");

  const lines: string[] = [];
  lines.push("EMPLOYMENT AGREEMENT");
  lines.push(`(made under the ${LABOUR_CODE_NAME}, ${LABOUR_CODE_CITATION})`);
  lines.push("");
  lines.push(`This Employment Agreement (the "Agreement") is made at ${city} on ${date}.`);
  lines.push("");
  lines.push("BETWEEN");
  lines.push("");
  lines.push(
    `${employer}, ${cuin}having its registered office at ${ph(i.employerAddress, "Employer address")}, acting through ${ph(i.signatoryName, "Authorised signatory")}, ${ph(i.signatoryTitle, "Position")}, who is authorised to conclude this Agreement on its behalf (the "Employer");`,
  );
  lines.push("");
  lines.push("AND");
  lines.push("");
  lines.push(
    `${ph(i.fullName, "Employee full name")}, ${relation(i.gender)} ${ph(i.fatherName, "Father's / husband's name")}, ${idNo}, born on ${fmtDate(i.dateOfBirth, "Date of birth")}, gender: ${i.gender ? GENDER_LABEL[i.gender] : "[Gender]"}, residing at ${ph(i.address, "Employee residential address")}${contact ? ` (${contact})` : ""} (the "Employee").`,
  );
  lines.push("");
  lines.push(
    `The Employer and the Employee are together the "Parties". In this Agreement "Code" means the ${LABOUR_CODE_NAME} (${LABOUR_CODE_CITATION}) and the rules made under it, and a reference to a "section" is to a section of the Code. The Parties agree as follows:`,
  );

  buildSections(i).forEach((section, index) => {
    const n = index + 1;
    lines.push("");
    lines.push(`${n}. ${section.heading}`);
    section.items.forEach((item, itemIndex) => lines.push(`${n}.${itemIndex + 1} ${item}`));
  });

  const left = 38;
  lines.push("");
  lines.push(`IN WITNESS WHEREOF the Parties have signed this Agreement at ${city} on ${date}.`);
  lines.push("");
  lines.push(`${pad("FOR THE EMPLOYER", left)}THE EMPLOYEE`);
  lines.push("");
  lines.push(`${pad("_________________________", left)}_________________________`);
  lines.push(`${pad(ph(i.signatoryName, "Authorised signatory"), left)}${ph(i.fullName, "Employee full name")}`);
  lines.push(`${pad(ph(i.signatoryTitle, "Position"), left)}${idNo}`);
  lines.push(employer);
  lines.push("");
  lines.push("ACKNOWLEDGEMENT OF THE EMPLOYEE");
  lines.push(
    "I confirm that I received a copy of this Agreement before starting work, that its contents were explained to me verbally in a language I understand, and that I have understood them.",
  );
  lines.push("");
  lines.push(`_________________________          Date: ________________`);
  lines.push(ph(i.fullName, "Employee full name"));
  lines.push("");
  lines.push("WITNESSES");
  lines.push("1. Name: _________________________   CNIC: _________________   Signature: _____________");
  lines.push("2. Name: _________________________   CNIC: _________________   Signature: _____________");

  lines.push("");
  lines.push("SCHEDULE A - REMUNERATION (PER MONTH)");
  lines.push(leader("Basic wage", formatPKR(i.basicSalary)));
  i.allowances.forEach((a) => lines.push(leader(a.name, formatPKR(a.amount))));
  lines.push(leader("Gross monthly remuneration", formatPKR(grossMonthly(i))));
  lines.push(`Amount in words: ${amountInWords(grossMonthly(i))}`);
  lines.push("");
  lines.push(
    `NOTE: Drafted under the ${LABOUR_CODE_NAME} (${LABOUR_CODE_CITATION}, assented 10 February 2026). Before signing, confirm that the Code is in force and the current notified minimum wage, and have a lawyer review the agreement. The Code cannot be contracted out of (section 3).`,
  );

  return lines.join("\n");
}
