import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MINIMUM_WAGE,
  ageOn,
  amountInWords,
  checkEmploymentContract,
  formatPKR,
  generateEmploymentContract,
  grossMonthly,
  nonCompeteAllowed,
  isOnProbation,
  probationEndDate,
  type EmploymentContractInput,
} from "./punjab-employment-contract.ts";

function base(overrides: Partial<EmploymentContractInput> = {}): EmploymentContractInput {
  return {
    employerName: "Horizon Ventures (Pvt) Ltd",
    employerAddress: "12 Gulberg III, Lahore",
    employerCuin: "0123456",
    signatoryName: "Ayesha Khan",
    signatoryTitle: "Chief Executive Officer",
    headcount: 25,
    fullName: "Bilal Ahmed",
    fatherName: "Nadeem Ahmed",
    gender: "male",
    dateOfBirth: "1994-03-12",
    cnic: "35202-1234567-1",
    passportNo: "",
    address: "House 5, Street 3, Model Town, Lahore",
    phone: "0300-1234567",
    email: "bilal@example.com",
    employeeCode: "EMP-014",
    jobTitle: "Senior Accountant",
    department: "Finance",
    reportsTo: "Chief Financial Officer",
    jobDescription: "Maintains the general ledger, prepares monthly management accounts and supports statutory filings.",
    placeOfWork: "Head office, Lahore",
    isManagerial: false,
    employmentType: "permanent",
    fixedTermBasis: "",
    fixedTermReason: "",
    workPattern: "full_time",
    dateOfJoining: "2026-10-01",
    endDate: "",
    probationMonths: 3,
    weeklyHours: 48,
    workingSchedule: "Monday to Saturday, 9:00 am to 6:00 pm",
    weeklyRestDay: "Sunday",
    basicSalary: 120_000,
    allowances: [
      { name: "House rent allowance", amount: 30_000 },
      { name: "Medical allowance", amount: 10_000 },
    ],
    socialSecurityNo: "",
    eobiNo: "",
    contractDate: "2026-09-25",
    city: "Lahore",
    minimumWage: DEFAULT_MINIMUM_WAGE,
    providentFund: false,
    nonSolicitMonths: 12,
    nonCompete: false,
    nonCompeteMonths: 6,
    nonCompeteScope: "",
    additionalTerms: "",
    ...overrides,
  };
}

describe("formatting helpers", () => {
  it("formats rupees with thousands separators", () => {
    assert.equal(formatPKR(1234567), "PKR 1,234,567");
  });

  it("writes amounts in words using lakh and crore", () => {
    assert.equal(amountInWords(120_000), "Rupees One Lakh Twenty Thousand Only");
    assert.equal(amountInWords(40_000), "Rupees Forty Thousand Only");
    assert.equal(amountInWords(12_500_000), "Rupees One Crore Twenty Five Lakh Only");
    assert.equal(amountInWords(85_250.5), "Rupees Eighty Five Thousand Two Hundred Fifty and Fifty Paisa Only");
  });

  it("adds allowances to the basic wage for gross remuneration", () => {
    assert.equal(grossMonthly(base()), 160_000);
  });

  it("is on probation only between the joining date and the end of probation", () => {
    assert.equal(isOnProbation("2026-10-01", 3, "2026-09-30"), false, "not started yet");
    assert.equal(isOnProbation("2026-10-01", 3, "2026-10-01"), true);
    assert.equal(isOnProbation("2026-10-01", 3, "2026-12-31"), true);
    assert.equal(isOnProbation("2026-10-01", 3, "2027-01-01"), false, "probation over");
    assert.equal(isOnProbation("2026-10-01", 0, "2026-10-15"), false, "no probation");
    assert.equal(isOnProbation(null, 3, "2026-10-15"), false);
  });

  it("finds the last day of probation and a birthday-aware age", () => {
    assert.equal(probationEndDate("2026-10-01", 3), "2026-12-31");
    assert.equal(probationEndDate("2026-10-01", 0), null);
    assert.equal(ageOn("2010-10-02", "2026-10-01"), 15);
    assert.equal(ageOn("2010-10-01", "2026-10-01"), 16);
  });
});

describe("generateEmploymentContract — core content", () => {
  const text = generateEmploymentContract(base());

  it("names both parties and the governing Code", () => {
    assert.match(text, /Horizon Ventures \(Pvt\) Ltd/);
    assert.match(text, /Bilal Ahmed, son of Nadeem Ahmed/);
    assert.match(text, /Punjab Labour Code 2026, Act IX of 2026/);
  });

  it("covers every particular section 142(1) requires", () => {
    assert.match(text, /CNIC No\. 35202-1234567-1/);
    assert.match(text, /born on 12 March 1994/);
    assert.match(text, /Senior Accountant/);
    assert.match(text, /commences on 1 October 2026/);
    assert.match(text, /probationary period of 3 months from 1 October 2026 to 31 December 2026/);
    assert.match(text, /forty-eight hours per week/);
    assert.match(text, /eighteen calendar days of annual leave/);
    assert.match(text, /PKR 120,000 \(Rupees One Lakh Twenty Thousand Only\)/);
    assert.match(text, /House rent allowance PKR 30,000/);
  });

  it("states the statutory leave, overtime and pay-timing figures", () => {
    assert.match(text, /eight days in a calendar year/);
    assert.match(text, /ten days in a calendar year/);
    assert.match(text, /two times the normal hourly remuneration/);
    assert.match(text, /three times/);
    assert.match(text, /seventh day of the succeeding month/);
  });

  it("numbers clauses consecutively and ends with a remuneration schedule", () => {
    assert.match(text, /^1\. TYPE AND COMMENCEMENT OF EMPLOYMENT$/m);
    assert.match(text, /^8\. TERMINATION AND NOTICE$/m);
    assert.match(text, /SCHEDULE A - REMUNERATION \(PER MONTH\)/);
    assert.match(text, /Gross monthly remuneration \.+ PKR 160,000/);
  });

  it("leaves no bracketed placeholders when every particular is supplied", () => {
    assert.doesNotMatch(text, /\[[A-Za-z][^\]\n]*\]/);
  });

  it("marks missing particulars as placeholders", () => {
    const sparse = generateEmploymentContract(base({ cnic: "", dateOfBirth: "", jobDescription: "" }));
    assert.match(sparse, /\[CNIC or passport number\]/);
    assert.match(sparse, /\[Date of birth\]/);
    assert.match(sparse, /\[Description of duties\]/);
  });
});

describe("generateEmploymentContract — tailoring to the employer's size", () => {
  it("uses 30 days' notice and states gratuity outright for 20+ workers", () => {
    const text = generateEmploymentContract(base({ headcount: 25 }));
    assert.match(text, /entitled to 30 days' written notice or the last drawn 30 days' remuneration in lieu of notice/);
    assert.match(text, /thirty days' remuneration for every year of service/);
    assert.match(text, /shares in the profit bonus in accordance with section 253/);
  });

  it("uses 14 days' notice for a micro-enterprise (under ten employees)", () => {
    const text = generateEmploymentContract(base({ headcount: 6 }));
    assert.match(text, /entitled to 14 days' written notice/);
    assert.match(text, /resign by giving the Employer 14 days' written notice/);
    assert.doesNotMatch(text, /30 days' written notice/);
  });

  it("never lets the Employer terminate at will — notice is an entitlement on top of a valid reason", () => {
    const text = generateEmploymentContract(base());
    assert.match(text, /whose employment is to be terminated by the Employer, other than for gross misconduct, is entitled to/);
    assert.doesNotMatch(text, /either Party may terminate this Agreement by giving/);
    assert.match(text, /only as section 146\(1\) provides/);
  });

  it("drops statutory gratuity for fewer than twenty workers", () => {
    const text = generateEmploymentContract(base({ headcount: 12 }));
    assert.match(text, /fewer than twenty workers, so statutory gratuity under section 159 does not apply/);
    assert.doesNotMatch(text, /profit bonus/);
  });

  it("states thresholds conditionally when headcount is unknown", () => {
    const text = generateEmploymentContract(base({ headcount: null }));
    assert.match(text, /Where the Employer's establishment engages twenty or more workers, gratuity is payable/);
    assert.match(text, /Where the Employer is a micro-enterprise employing fewer than ten employees, the notice period for both Parties is 14 days/);
    assert.match(text, /If the Employer has fifty or more employees/);
  });

  it("adds group insurance for 50+ employees only", () => {
    assert.match(generateEmploymentContract(base({ headcount: 60 })), /As the Employer has fifty or more employees/);
    assert.doesNotMatch(generateEmploymentContract(base({ headcount: 25 })), /fifty or more employees/);
  });
});

describe("generateEmploymentContract — gratuity categories by pay (section 160)", () => {
  it("leaves gratuity uncapped at or below five times minimum wage", () => {
    const text = generateEmploymentContract(base({ basicSalary: 100_000, allowances: [] }));
    assert.match(text, /gratuity is uncapped/);
  });

  it("caps at twelve months between five and ten times minimum wage", () => {
    const text = generateEmploymentContract(base({ basicSalary: 300_000, allowances: [] }));
    assert.match(text, /redundancy or retrenchment only and is capped at twelve months/);
  });

  it("caps at six months above ten times minimum wage", () => {
    const text = generateEmploymentContract(base({ basicSalary: 500_000, allowances: [] }));
    assert.match(text, /redundancy or retrenchment only and is capped at six months/);
  });
});

describe("generateEmploymentContract — probation, restraint and gender clauses", () => {
  it("states no probation when none is set", () => {
    const text = generateEmploymentContract(base({ probationMonths: 0 }));
    assert.match(text, /No probationary period applies/);
    assert.doesNotMatch(text, /may terminate this Agreement at any time without notice/);
  });

  it("voids post-employment restraints for an ordinary employee, even if asked for", () => {
    const text = generateEmploymentContract(base({ nonCompete: true }));
    assert.match(text, /Nothing in this Agreement restrains the Employee from engaging in a lawful profession/);
    assert.doesNotMatch(text, /directly competes/);
  });

  it("includes a non-compete only for a managerial employee above five times minimum wage", () => {
    const eligible = base({ nonCompete: true, isManagerial: true, basicSalary: 250_000, allowances: [] });
    assert.equal(nonCompeteAllowed(eligible), true);
    assert.match(generateEmploymentContract(eligible), /directly competes with the Employer's business/);

    assert.equal(nonCompeteAllowed({ ...eligible, isManagerial: false }), false);
    assert.equal(nonCompeteAllowed({ ...eligible, basicSalary: 150_000 }), false);
  });

  it("includes maternity and iddat provisions for a female employee, paternity for a male one", () => {
    const female = generateEmploymentContract(base({ gender: "female" }));
    assert.match(female, /daughter of/);
    assert.match(female, /six weeks pre-natal and eight weeks post-natal/);
    assert.doesNotMatch(female, /Paternity leave: seven calendar days/);

    const male = generateEmploymentContract(base({ gender: "male" }));
    assert.match(male, /Paternity leave: seven calendar days with full pay/);
    assert.doesNotMatch(male, /six weeks pre-natal/);
    assert.doesNotMatch(male, /Where the Employee is a woman/);
  });

  it("adds the provident-fund clause only when a fund applies", () => {
    assert.match(generateEmploymentContract(base({ providentFund: true })), /provident fund/);
    assert.doesNotMatch(generateEmploymentContract(base({ providentFund: false })), /contributor to the Employer's provident fund/);
  });
});

describe("generateEmploymentContract — fixed-term and part-time", () => {
  it("states the objective reason and renewal limits for a fixed-term agreement", () => {
    const text = generateEmploymentContract(
      base({
        employmentType: "fixed_term",
        fixedTermBasis: "special_project",
        fixedTermReason: "commissioning the new ERP system",
        dateOfJoining: "2026-10-01",
        endDate: "2027-09-30",
        basicSalary: 250_000,
        allowances: [],
      }),
    );
    assert.match(text, /This is a fixed-term employment agreement \(section 138\)/);
    assert.match(text, /ends on 30 September 2027 or, if earlier, on completion of the specific task or project/);
    assert.match(text, /commissioning the new ERP system/);
    assert.match(text, /renewed for not more than two successive terms/);
    assert.match(text, /No notice is required when a fixed-term agreement ends by expiry/);
  });

  it("makes a replacement contract end on the absent employee's return", () => {
    const text = generateEmploymentContract(base({ employmentType: "fixed_term", fixedTermBasis: "replacement", endDate: "" }));
    assert.match(text, /ends on the return to work of the absent employee being replaced/);
  });

  it("applies pro-rata terms to part-time work", () => {
    const text = generateEmploymentContract(base({ workPattern: "part_time", weeklyHours: 24 }));
    assert.match(text, /part-time employment \(section 136\) with normal hours of 24 hours per week/);
    assert.match(text, /pro rata temporis/);
  });
});

describe("checkEmploymentContract", () => {
  const messages = (i: EmploymentContractInput, level?: string) =>
    checkEmploymentContract(i)
      .filter((x) => !level || x.level === level)
      .map((x) => x.message)
      .join("\n");

  it("is clean apart from tailoring notes for a complete, compliant permanent hire", () => {
    const issues = checkEmploymentContract(base());
    assert.equal(issues.filter((x) => x.level === "error").length, 0);
    assert.equal(issues.filter((x) => x.level === "warning").length, 0);
  });

  it("errors when the basic wage is below the notified minimum wage", () => {
    assert.match(messages(base({ basicSalary: 30_000, allowances: [] }), "error"), /below the notified minimum wage/);
  });

  it("errors when normal hours exceed 48 a week", () => {
    assert.match(messages(base({ weeklyHours: 54 }), "error"), /exceeds the 48-hour limit/);
  });

  it("errors on probation longer than three months", () => {
    assert.match(messages(base({ probationMonths: 6 }), "error"), /cannot exceed three months/);
  });

  it("lists missing section 142 particulars as a warning", () => {
    const text = messages(base({ cnic: "", passportNo: "", address: "" }), "warning");
    assert.match(text, /employee's residence/);
    assert.match(text, /CNIC or passport number/);
  });

  it("requires an objective reason and end date for a fixed term", () => {
    const text = messages(base({ employmentType: "fixed_term", fixedTermBasis: "", endDate: "" }), "error");
    assert.match(text, /objective reason/);
    assert.match(text, /end date/);
  });

  it("warns that a general fixed term over three months is deemed permanent", () => {
    const text = messages(
      base({ employmentType: "fixed_term", fixedTermBasis: "temporary_work", fixedTermReason: "peak season", dateOfJoining: "2026-10-01", endDate: "2027-01-31" }),
      "warning",
    );
    assert.match(text, /cannot exceed three months/);
  });

  it("accepts a general fixed term of exactly three months", () => {
    const issues = checkEmploymentContract(
      base({ employmentType: "fixed_term", fixedTermBasis: "temporary_work", fixedTermReason: "peak season", dateOfJoining: "2026-10-01", endDate: "2026-12-31" }),
    );
    assert.equal(issues.some((x) => x.ref === "s.139(3), s.138(5)(b)"), false);
  });

  it("errors on a special-project term paid under five times minimum wage, or over five years", () => {
    const low = messages(
      base({ employmentType: "fixed_term", fixedTermBasis: "special_project", fixedTermReason: "x", endDate: "2027-09-30", basicSalary: 100_000, allowances: [] }),
      "error",
    );
    assert.match(low, /at least five times the minimum wage/);

    const long = messages(
      base({ employmentType: "fixed_term", fixedTermBasis: "special_project", fixedTermReason: "x", endDate: "2032-10-01", basicSalary: 250_000, allowances: [] }),
      "error",
    );
    assert.match(long, /cannot exceed five years/);
  });

  it("errors for a child and warns for a young person", () => {
    assert.match(messages(base({ dateOfBirth: "2012-01-01" }), "error"), /cannot be engaged/);
    assert.match(messages(base({ dateOfBirth: "2009-06-01" }), "warning"), /young person/);
  });

  it("explains a dropped non-compete rather than silently ignoring it", () => {
    assert.match(messages(base({ nonCompete: true }), "warning"), /will be left out/);
  });
});
