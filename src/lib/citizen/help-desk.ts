/**
 * Logic + document generators for the Help Desk & Rights Navigator
 * (/help-desk). Same pattern as citizen/documents.ts: pure functions, no
 * server round-trip — drafts are generated client-side and are starting
 * points, not filed documents.
 */
import type { Lang } from "./i18n";

function today(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function pkr(n: number): string {
  return n ? `PKR ${n.toLocaleString("en-PK")}` : "[amount]";
}

export type EmergencyContact = {
  label: string;
  labelUrdu: string;
  labelRoman: string;
  number: string;
};

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { label: "Police Emergency", labelUrdu: "پولیس ایمرجنسی", labelRoman: "Police Emergency", number: "15" },
  {
    label: "Cybercrime (NCCIA/FIA)",
    labelUrdu: "سائبر کرائم",
    labelRoman: "Cybercrime (NCCIA/FIA)",
    number: "1799",
  },
  {
    label: "Free Legal Aid (Human Rights)",
    labelUrdu: "مفت قانونی امداد",
    labelRoman: "Muft Qanooni Imdad",
    number: "1099",
  },
  { label: "Disaster & Rescue", labelUrdu: "ریسکیو", labelRoman: "Rescue", number: "1122" },
  {
    label: "Overbilling (Wafaqi Mohtasib)",
    labelUrdu: "محتسب اوور بلنگ",
    labelRoman: "Mohtasib Overbilling",
    number: "1055",
  },
];

export type HelpDeskCategory = {
  id: string;
  to: string;
  title: string;
  titleUrdu: string;
  body: string;
};

export const HELP_DESK_CATEGORIES: HelpDeskCategory[] = [
  {
    id: "utility-dispute",
    to: "/help-desk/utility-dispute",
    title: "Utility Overbilling",
    titleUrdu: "بجلی/گیس اوور بلنگ",
    body: "Detection bills and meter-tampering claims from LESCO, K-Electric, IESCO, MEPCO or SNGPL.",
  },
  {
    id: "cyber-report",
    to: "/help-desk/cyber-report",
    title: "Cyber Harassment & Scams",
    titleUrdu: "سائبر ہراسانی و فراڈ",
    body: "Blackmail, non-consensual imagery, OTP scams, impersonation on WhatsApp, Facebook, Instagram, TikTok.",
  },
  {
    id: "tenant-protection",
    to: "/help-desk/tenant-protection",
    title: "Tenancy & Eviction",
    titleUrdu: "کرایہ داری و بے دخلی",
    body: "Illegal lockouts, utility disconnection, and eviction grounds under provincial rent law.",
  },
  {
    id: "police-encounter",
    to: "/help-desk/police-encounter",
    title: "Police Stop & Bail Rights",
    titleUrdu: "پولیس تفتیش و ضمانت",
    body: "Search & checkpoint rights, FIR vs. non-cognizable offences, bail-before-arrest.",
  },
  {
    id: "succession",
    to: "/help-desk/succession",
    title: "Inheritance & Succession",
    titleUrdu: "وراثت و جانشینی",
    body: "NADRA Succession Facilitation Unit vs. a civil partition suit — which path applies.",
  },
];

/* ---------------------------------------------------------------------- */
/* 1. Utility overbilling / detection bills                                */
/* ---------------------------------------------------------------------- */

export const UTILITY_PROVIDERS = ["LESCO", "K-Electric", "IESCO", "MEPCO", "SNGPL"] as const;

export type UtilityDisputeInput = {
  provider: (typeof UTILITY_PROVIDERS)[number];
  consumerName: string;
  consumerAddress: string;
  referenceNumber: string;
  averageMonthlyUnits: number;
  disputedUnitsBilled: number;
  detectionSurcharge: number;
  city: string;
};

/** True when the bill looks like an unauthorized detection/tampering charge rather than ordinary consumption. */
export function isLikelyDetectionBill(i: Pick<UtilityDisputeInput, "averageMonthlyUnits" | "disputedUnitsBilled" | "detectionSurcharge">): boolean {
  return i.detectionSurcharge > 0 || i.disputedUnitsBilled > i.averageMonthlyUnits * 2;
}

export function generateUtilityRepresentationLetter(i: UtilityDisputeInput): string {
  const flagged = isLikelyDetectionBill(i);
  return `REPRESENTATION AGAINST DISPUTED ${i.provider || "[Provider]"} BILL

To,
The Provincial Electric Inspector
/ NEPRA Consumer Affairs Tribunal (for electricity) or SNGPL Redressal Committee (for gas)

From,
${i.consumerName || "[Consumer Name]"}
${i.consumerAddress || "[Consumer Address]"}
Reference / Consumer No.: ${i.referenceNumber || "[Reference Number]"}

Date: ${today()}

Subject: Representation against disputed/detection bill of ${i.provider || "[Provider]"}

Respected Sir/Madam,

1. That I am a bona fide consumer of ${i.provider || "[Provider]"} bearing reference/consumer number ${i.referenceNumber || "[Reference Number]"}.
2. That my average monthly consumption over the preceding months has been approximately ${i.averageMonthlyUnits || "[N]"} units, whereas the disputed bill charges ${i.disputedUnitsBilled || "[N]"} units${i.detectionSurcharge ? ` together with a detection/surcharge amount of ${pkr(i.detectionSurcharge)}` : ""}.
3. ${flagged ? `That this abrupt and disproportionate charge appears to be an unauthorized detection/meter-tampering claim, and any such claim must be preceded by a proper inspection report and notice under Section 26(6) of the Electricity Act, 1910, which has not been furnished to me.` : `That the disputed amount does not correspond to my actual consumption pattern and requires re-verification of the meter reading.`}
4. That I have not tampered with the meter and no inspection in my presence, nor any inspection report, has been shared with me prior to the raising of this bill.
5. That I hereby request suspension of recovery of the disputed amount pending an independent re-inspection of the meter in my presence, and disclosure of the inspection report relied upon.

PRAYER

It is therefore most respectfully requested that:
(a) recovery of the disputed amount of ${pkr(i.detectionSurcharge || i.disputedUnitsBilled)} be suspended pending inspection;
(b) a joint re-inspection of the meter be conducted in my presence with prior written notice; and
(c) the matter be disposed of under Section 26(6) of the Electricity Act, 1910 read with the applicable NEPRA Consumer Service Manual / Rules.

Dated: ${today()} at ${i.city || "[City]"}

_________________________
${i.consumerName || "[Consumer Name]"}

Attach: copies of the last six months' bills, the disputed bill, and any prior correspondence with ${i.provider || "the provider"}.
Send by registered post / courier and retain proof of dispatch; a copy may also be filed at the ${i.provider || "provider"}'s customer service centre against a dated receiving.`;
}

/* ---------------------------------------------------------------------- */
/* 2. Cyber harassment, blackmail & online scams                           */
/* ---------------------------------------------------------------------- */

export const CYBER_OFFENSE_TYPES = [
  "Non-consensual imagery / blackmail",
  "Financial / OTP scam",
  "Impersonation",
  "Defamatory posts",
] as const;

export const CYBER_PLATFORMS = ["WhatsApp", "Facebook", "Instagram", "TikTok", "Other"] as const;

const PECA_SECTIONS: Record<(typeof CYBER_OFFENSE_TYPES)[number], string> = {
  "Non-consensual imagery / blackmail": "Section 21 (offences against modesty/dignity) and Section 24 (cyberstalking) PECA 2016",
  "Financial / OTP scam": "Section 20 (offences against dignity) read with Sections 13/14/16 (unauthorized use of identity information / electronic fraud) PECA 2016",
  Impersonation: "Section 20 (offences against dignity of a natural person) and Section 16 (unauthorized use of identity information) PECA 2016",
  "Defamatory posts": "Section 20 (offences against dignity of a natural person) PECA 2016",
};

export type CyberReportInput = {
  offenseType: (typeof CYBER_OFFENSE_TYPES)[number];
  platform: (typeof CYBER_PLATFORMS)[number];
  culpritIdentifier: string;
  victimName: string;
  victimCnic: string;
  victimAddress: string;
  victimPhone: string;
  incidentDescription: string;
  city: string;
};

export function cyberApplicableLaw(offenseType: (typeof CYBER_OFFENSE_TYPES)[number]): string {
  return PECA_SECTIONS[offenseType] ?? "the Prevention of Electronic Crimes Act (PECA), 2016";
}

export function generateCyberComplaintPacket(i: CyberReportInput): string {
  return `COMPLAINT TO THE NATIONAL CYBER CRIME INVESTIGATION AGENCY (NCCIA) / FIA CYBERCRIME WING

To,
The Investigating Officer
NCCIA / FIA Cybercrime Wing
(24/7 Helpline: 1799 · report also at cybercrime.gov.pk)

From,
${i.victimName || "[Your Name]"}
CNIC: ${i.victimCnic || "[CNIC]"}
Address: ${i.victimAddress || "[Address]"}
Phone: ${i.victimPhone || "[Phone]"}

Date: ${today()}

Subject: Complaint of ${i.offenseType} on ${i.platform}

Respected Sir/Madam,

1. That I am the complainant and a victim of ${i.offenseType.toLowerCase()} committed through ${i.platform}.
2. That the offender is identifiable by the following: ${i.culpritIdentifier || "[phone number / profile link / account title]"}.
3. That the facts of the incident are as follows: ${i.incidentDescription || "[describe what happened, including dates and any demands made]"}.
4. That the aforesaid acts constitute an offence under ${cyberApplicableLaw(i.offenseType)}.
5. That I request registration of an FIR/complaint, preservation of the offender's account data and IP logs by the platform, and appropriate legal action.

EVIDENCE CHAIN-OF-CUSTODY — DO THIS BEFORE ANYTHING ELSE:
(a) Do NOT delete the chats, posts, or messages — take full-screen screenshots showing the date/time and username/URL bar.
(b) Save original media files (photos/videos/voice notes) without editing or compressing them; note the original file names and dates.
(c) Export the chat (WhatsApp: chat > export chat > include media) and email it to yourself for a timestamped copy.
(d) Do NOT pay any demanded amount and do NOT block the account until advised by the investigating officer — blocking can stop evidence collection.
(e) Note down the exact URL/profile link and any phone numbers or bank/easypaisa/jazzcash account details used by the offender.
(f) Bring a printed copy of this complaint, your CNIC, and the evidence on a USB drive when visiting the nearest Cybercrime Reporting Centre.

Dated: ${today()} at ${i.city || "[City]"}

_________________________
${i.victimName || "[Your Name]"}

If you are in immediate danger or being blackmailed for money, also call the Police Emergency helpline 15 and the Cybercrime helpline 1799 without waiting for this complaint to be processed.`;
}

/* ---------------------------------------------------------------------- */
/* 3. Residential tenant eviction shield                                   */
/* ---------------------------------------------------------------------- */

export const TENANCY_PROVINCES = ["Punjab", "Sindh", "ICT (Islamabad)"] as const;

const TENANCY_LAW: Record<(typeof TENANCY_PROVINCES)[number], string> = {
  Punjab: "the Punjab Rented Premises Act, 2009",
  Sindh: "the Sindh Rented Premises Ordinance, 1979",
  "ICT (Islamabad)": "the Islamabad Rent Restriction Ordinance, 2001",
};

export type TenantProtectionInput = {
  province: (typeof TENANCY_PROVINCES)[number];
  hasWrittenAgreement: "yes" | "no";
  rentPaidStatus: "receipts" | "cash";
  landlordReason: string;
  tenantName: string;
  landlordName: string;
  propertyAddress: string;
  city: string;
};

const TENANCY_GROUNDS_TEMPLATE = {
  en: (law: string) =>
    `Under ${law}, a landlord may generally seek eviction only on limited statutory grounds — typically: default in payment of rent, expiry of the agreed tenancy term, the landlord's bona fide personal need, the tenant subletting without consent, or the tenant causing material damage to the premises. A landlord cannot lawfully lock out a tenant, remove belongings, or disconnect electricity/gas/water to force a vacation — that self-help route is itself unlawful and can be restrained by a rent tribunal/court, regardless of who is "right" about the underlying dispute.`,
  ur: (law: string) =>
    `${law} کے تحت، مکان مالک عموماً صرف محدود قانونی بنیادوں پر بے دخلی کا مطالبہ کر سکتا ہے — عموماً: کرایہ ادا نہ کرنا، طے شدہ مدتِ کرایہ داری ختم ہونا، مالک کی نیک نیتی پر مبنی ذاتی ضرورت، کرایہ دار کا بلا اجازت دوبارہ کرائے پر دینا، یا کرایہ دار کا جائیداد کو نقصان پہنچانا۔ مکان مالک قانونی طور پر تالا نہیں لگا سکتا، سامان نہیں ہٹا سکتا، یا بجلی/گیس/پانی منقطع کر کے زبردستی خالی نہیں کروا سکتا — یہ خود اپنے ہاتھوں فیصلہ کرنے کا طریقہ غیر قانونی ہے اور رینٹ ٹریبونل/عدالت اسے روک سکتی ہے، چاہے اصل تنازع میں کون "حق بجانب" ہو۔`,
  roman: (law: string) =>
    `${law} ke tehat, makan malik umooman sirf mehdood qanooni bunyadon par bedakhli ka mutaliba kar sakta hai — umooman: kiraya ada na karna, tay shuda muddat-e-kirayadari khatam hona, malik ki nek niyati par mabni zati zaroorat, kirayadar ka bila ijazat dobara kiraye par dena, ya kirayadar ka jaidad ko nuqsan pohnchana. Makan malik qanooni tor par tala nahi laga sakta, samaan nahi hata sakta, ya bijli/gas/pani munqate kar ke zabardasti khali nahi karwa sakta — yeh khud apne hathon faisla karne ka tareeqa ghair qanooni hai aur Rent Tribunal/adalat isay rok sakti hai, chahay asal tanaza mein kaun "haq bajanib" ho.`,
} satisfies Record<Lang, (law: string) => string>;

export function tenancyGroundsExplainer(
  i: Pick<TenantProtectionInput, "province">,
  lang: Lang = "en",
): string {
  return TENANCY_GROUNDS_TEMPLATE[lang](TENANCY_LAW[i.province]);
}

export function generateUrgentObjectionNotice(i: TenantProtectionInput): string {
  return `URGENT OBJECTION NOTICE — UNLAWFUL EVICTION / DISCONNECTION

To,
${i.landlordName || "[Landlord's Name]"}

From,
${i.tenantName || "[Tenant's Name]"}
Premises: ${i.propertyAddress || "[Property Address]"}, ${i.city || "[City]"}

Date: ${today()}

Subject: Objection to attempted unlawful eviction / lockout / utility disconnection

Dear Sir/Madam,

1. That I am the lawful tenant of the above premises${i.hasWrittenAgreement === "yes" ? " under a written tenancy agreement" : ", the tenancy having been created and continued by conduct/payment of rent even without a written agreement"}.
2. That rent has been ${i.rentPaidStatus === "receipts" ? "paid regularly and receipts are available as proof" : "paid, though not always against a formal receipt — bank/mobile-wallet transfer records and witnesses are available"}.
3. That you have cited the following reason for seeking my eviction: "${i.landlordReason || "[reason cited by landlord]"}" — this does not, by itself, entitle you to evict me without following due process under ${TENANCY_LAW[i.province]}.
4. That any attempt to forcibly lock the premises, remove my belongings, or disconnect electricity/gas/water supply without a valid eviction order from the competent Rent Controller/Tribunal is unlawful self-help and may attract both criminal liability (mischief/criminal trespass) and civil liability for damages.
5. That I hereby put you on notice that I will approach the Rent Controller/Tribunal for an injunction and for restoration of any disconnected utility, and will hold you liable for all losses caused by any unlawful act, should you proceed without a lawful order.

You are called upon to restore normalcy immediately and to pursue any eviction claim strictly through the Rent Controller/Tribunal having jurisdiction, failing which appropriate legal proceedings will be initiated against you without further notice.

Dated: ${today()} at ${i.city || "[City]"}

_________________________
${i.tenantName || "[Tenant's Name]"}

Send a copy by courier/registered post to the landlord and keep a copy for filing before the Rent Controller if the disconnection/lockout continues.`;
}

/* ---------------------------------------------------------------------- */
/* 4. Police stop, remand & bailable rights                                */
/* ---------------------------------------------------------------------- */

export type OffenseLookupEntry = { offense: string; cognizable: boolean; note: string };

/** Representative, non-exhaustive list — always confirm against the First Schedule, CrPC. */
export const OFFENSE_LOOKUP: OffenseLookupEntry[] = [
  { offense: "Theft", cognizable: true, note: "Police may arrest without warrant and register an FIR directly (Section 154 CrPC)." },
  { offense: "Robbery / Dacoity", cognizable: true, note: "FIR registered directly; typically non-bailable." },
  { offense: "Murder / Qatl-e-Amd", cognizable: true, note: "FIR registered directly; non-bailable, bail granted only by a court on merits." },
  { offense: "Hurt (simple)", cognizable: false, note: "Requires a complaint before a Magistrate (Section 155 CrPC); police need Magistrate's permission to investigate." },
  { offense: "Cheating (simple, s.420 without dishonest inducement of property delivery)", cognizable: false, note: "Generally requires a Magistrate's order under Section 155(2) CrPC before police can investigate." },
  { offense: "Defamation", cognizable: false, note: "Private complaint before a Magistrate; police cannot register an FIR on their own." },
  { offense: "Domestic violence / assault causing hurt", cognizable: true, note: "Usually cognizable — an FIR can be registered directly; insist on it being recorded verbatim." },
  { offense: "489-F (dishonoured cheque)", cognizable: true, note: "Cognizable and non-bailable in practice, though courts frequently grant bail; pre-arrest bail under Section 498 CrPC is commonly sought." },
];

export function findOffense(offense: string): OffenseLookupEntry | undefined {
  return OFFENSE_LOOKUP.find((o) => o.offense === offense);
}

export const POLICE_RIGHTS_NOTES = {
  checkpoint: `Under Article 10 of the Constitution of Pakistan, a person arrested or detained must be produced before a Magistrate within 24 hours of arrest (excluding travel time). Police cannot search your phone or personal devices without a judicial warrant or your informed consent — you may politely ask for the legal basis and record/note the officer's name, badge number, and vehicle/post.`,
  firVsComplaint: `A cognizable offence (Section 154 CrPC) lets police register an FIR and investigate/arrest without a Magistrate's prior permission. A non-cognizable offence (Section 155 CrPC) requires the complainant to approach a Magistrate first — police cannot investigate without the Magistrate's order. If police refuse to register an FIR for a cognizable offence, you may apply directly to the relevant Magistrate under Section 22-A/22-B CrPC.`,
  preArrestBail: `Pre-arrest bail ("bail before arrest") under Section 498 CrPC may be sought from the Sessions Court or High Court when a person apprehends arrest in a criminal case and believes the case against them is mala fide or does not disclose their guilt. It is an interim protection pending the court's final decision, and typically requires surety bonds; consult an advocate promptly once you learn an FIR names you.`,
};

export const POLICE_ENCOUNTER_STATUSES = [
  "Stopped / questioned only",
  "Detained at a police station",
  "Arrested",
  "Named in an FIR, not yet arrested",
] as const;

export type PoliceEncounterInput = {
  personName: string;
  city: string;
  offense: string;
  currentStatus: (typeof POLICE_ENCOUNTER_STATUSES)[number];
  incidentDescription: string;
};

export function generatePoliceEncounterBrief(i: PoliceEncounterInput): string {
  const entry = findOffense(i.offense);
  return `ADVOCATE INTAKE BRIEF — POLICE ENCOUNTER / POSSIBLE CRIMINAL MATTER

Name: ${i.personName || "[Your Name]"}
City: ${i.city || "[City]"}
Date: ${today()}

Current status: ${i.currentStatus}
Offense involved (as understood by the person): ${i.offense || "[offense]"}
${entry ? `Classification: ${entry.cognizable ? "Cognizable (Section 154 CrPC) — police may register an FIR directly." : "Non-cognizable (Section 155 CrPC) — requires a Magistrate's order first."}\nNote: ${entry.note}` : ""}

What happened: ${i.incidentDescription || "[describe the encounter — date, time, location, and what officers said/did]"}

Immediate priorities for the advocate:
1. ${i.currentStatus === "Arrested" ? "Confirm production before a Magistrate within 24 hours of arrest (Article 10, Constitution of Pakistan) and assess regular bail." : i.currentStatus === "Named in an FIR, not yet arrested" ? "Assess urgency of pre-arrest bail under Section 498 CrPC before any arrest is attempted." : i.currentStatus === "Detained at a police station" ? "Confirm the legal basis for detention and whether 24-hour production timelines are being observed." : "Confirm whether any FIR has been or is likely to be registered, and preserve details of the stop."}
2. Verify whether the offense is cognizable or non-cognizable and whether an FIR has actually been registered.
3. Identify the investigating officer, police station, and any case/FIR number.

This is a starting brief for an advocate, not a filed pleading — bring this brief, your CNIC, and any paperwork received from police (FIR copy, recovery memo, notice) to the consultation.`;
}

/* ---------------------------------------------------------------------- */
/* 5. Succession / inheritance triage                                      */
/* ---------------------------------------------------------------------- */

export type SuccessionInput = {
  deceasedName: string;
  allHeirsAliveAndBiometric: "yes" | "no";
  disputedTitleOrMinorHeir: "yes" | "no";
  heirs: string;
  city: string;
};

export type SuccessionRoute = "nadra" | "civil";

export function successionRoute(i: Pick<SuccessionInput, "allHeirsAliveAndBiometric" | "disputedTitleOrMinorHeir">): SuccessionRoute {
  return i.allHeirsAliveAndBiometric === "yes" && i.disputedTitleOrMinorHeir === "no" ? "nadra" : "civil";
}

export function generateNadraSfuChecklist(i: SuccessionInput): string {
  return `NADRA SUCCESSION FACILITATION UNIT (SFU) — CHECKLIST
(Under the Succession Act / NADRA Ordinance, as extended by the Succession Act, 2021 for movable and certain immovable assets)

Deceased: ${i.deceasedName || "[Deceased's Name]"}
City: ${i.city || "[City]"}
Date: ${today()}

All named legal heirs are reportedly alive and biometrically available, and there is no disputed title or unrepresented minor heir — this matter can likely proceed through the NADRA SFU rather than a civil court.

Documents to bring to the SFU / NADRA e-Sahulat centre:
1. Original death certificate of the deceased (from Union Council/NADRA).
2. Original CNICs of all legal heirs (all must appear in person for biometric verification, or via valid power of attorney where permitted).
3. Family Registration Certificate (FRC) showing all heirs.
4. CNIC of the deceased (if available) or B-Form/domicile as identity proof.
5. Details/documents of the deceased's assets (bank account numbers, property registration documents, vehicle registration, shares, etc.).
6. No-objection/consent among heirs, if the SFU process requires it for the specific asset class.

Named heirs on record: ${i.heirs || "[list heirs and relationship to deceased]"}

Process outline:
(a) All heirs visit the NADRA SFU/e-Sahulat centre together (or as scheduled) for biometric verification.
(b) NADRA issues a Succession Certificate / Letter of Administration for the relevant assets once verification is complete.
(c) The certificate is then presented to the bank/registrar/transport authority to transfer the specific asset into the heirs' names per their Sharia/statutory shares.

If, during this process, any heir's share, identity, or the property's title becomes disputed, or a minor heir is found without a guardian appointed by the court, this matter must move to the civil court partition-suit route instead.`;
}

export function generateCivilPartitionBrief(i: SuccessionInput): string {
  return `ADVOCATE INTAKE BRIEF — CIVIL PARTITION / SUCCESSION SUIT

Deceased: ${i.deceasedName || "[Deceased's Name]"}
City: ${i.city || "[City]"}
Date: ${today()}

Trigger for civil-court route: ${i.allHeirsAliveAndBiometric === "no" ? "not all legal heirs are alive/biometrically available (a legal heir may be deceased, abroad without valid documentation, or missing), " : ""}${i.disputedTitleOrMinorHeir === "yes" ? "the property title is disputed or a minor heir is involved without a court-appointed guardian." : ""}

Named heirs on record: ${i.heirs || "[list heirs and relationship to deceased]"}

Because a title dispute, missing/deceased heir, or unrepresented minor is involved, the NADRA Succession Facilitation Unit cannot conclusively resolve this matter — it will need:
1. A succession/inheritance certificate from the civil court (if not already obtained) establishing the heirs and their shares.
2. Where a minor heir is involved: a guardian appointed under the Guardians and Wards Act, 1890, to represent the minor's interest and, where immovable property is to be sold/transferred, prior permission of the Guardian Court.
3. Where the property/title is disputed: a partition suit under Order XX Rule 18, Code of Civil Procedure, 1908, before the civil court of competent jurisdiction, seeking division of the property by metes and bounds (or by sale and distribution of proceeds if physical division is not possible).
4. Supporting documents to gather: death certificate, CNICs of all heirs, property registration/title documents (fard/registry/mutation), FRC, and any prior wills or family settlements.

This is a starting brief for an advocate, not a filed pleading — the exact prayer and forum depend on the specific property records and the heirs' documented status.`;
}

/* ---------------------------------------------------------------------- */
/* 6. Recovery of money — demand notice                                    */
/* ---------------------------------------------------------------------- */

export const DEBT_BASES = [
  "Loan / borrowed money",
  "Unpaid invoice for goods or services",
  "Written agreement / contract",
  "Other",
] as const;

export type MoneyRecoveryInput = {
  claimantName: string;
  claimantAddress: string;
  debtorName: string;
  debtorAddress: string;
  basisOfDebt: (typeof DEBT_BASES)[number];
  amountOwed: number;
  dueDate: string;
  city: string;
};

/** A written promise, cheque, or acknowledged account can go by the faster Order XXXVII CPC summary-suit route. */
export function moneyRecoverySuitRoute(
  i: Pick<MoneyRecoveryInput, "basisOfDebt">,
): "summary" | "regular" {
  return i.basisOfDebt === "Written agreement / contract" ? "summary" : "regular";
}

export function generateMoneyRecoveryNotice(i: MoneyRecoveryInput): string {
  const route = moneyRecoverySuitRoute(i);
  return `LEGAL NOTICE FOR RECOVERY OF MONEY

To,
${i.debtorName || "[Debtor's Name]"}
${i.debtorAddress || "[Debtor's Address]"}

From,
${i.claimantName || "[Your Name]"}
${i.claimantAddress || "[Your Address]"}

Date: ${today()}

Subject: Legal notice for recovery of PKR ${i.amountOwed ? i.amountOwed.toLocaleString("en-PK") : "[Amount]"}

Dear Sir/Madam,

Under instructions from and on behalf of ${i.claimantName || "[Your Name]"}, I serve upon you the following legal notice:

1. That a sum of PKR ${i.amountOwed ? i.amountOwed.toLocaleString("en-PK") : "[Amount]"} is due and payable by you to my client on account of ${i.basisOfDebt || "[basis of the debt]"}, the same having fallen due on ${i.dueDate || "[due date]"}.
2. That despite the said amount being due and payable, and despite repeated requests, you have failed and neglected to make payment of the same.
3. That your failure to pay renders you liable to my client for the said amount along with damages, costs, and interest as may be allowed by law.

You are hereby called upon to make payment of the above sum of PKR ${i.amountOwed ? i.amountOwed.toLocaleString("en-PK") : "[Amount]"} within fourteen (14) days of receipt of this notice, failing which my client shall be constrained to initiate ${route === "summary" ? "a summary suit for recovery under Order XXXVII of the Code of Civil Procedure, 1908" : "a civil suit for recovery under the Code of Civil Procedure, 1908"}, entirely at your risk, cost, and consequences as to costs and interest.

This notice is issued without prejudice to any other right or remedy available to my client under the law, including under the Contract Act, 1872.

Dated: ${today()} at ${i.city || "[City]"}

Yours faithfully,

_________________________
${i.claimantName || "[Your Name]"}

Send by registered post with acknowledgement due (AD), and retain the postal receipt and a copy of this notice.`;
}

/* ---------------------------------------------------------------------- */
/* 7. General-purpose legal notice                                         */
/* ---------------------------------------------------------------------- */

export const LEGAL_NOTICE_PURPOSES = [
  "Demand for payment",
  "Breach of agreement",
  "Stop harassment / nuisance",
  "Property / possession dispute",
  "Other",
] as const;

export type GeneralLegalNoticeInput = {
  purpose: (typeof LEGAL_NOTICE_PURPOSES)[number];
  senderName: string;
  senderAddress: string;
  recipientName: string;
  recipientAddress: string;
  facts: string;
  demand: string;
  deadlineDays: number;
  city: string;
};

export function generateGeneralLegalNotice(i: GeneralLegalNoticeInput): string {
  const deadline = i.deadlineDays || 14;
  return `LEGAL NOTICE

To,
${i.recipientName || "[Recipient's Name]"}
${i.recipientAddress || "[Recipient's Address]"}

From,
${i.senderName || "[Your Name]"}
${i.senderAddress || "[Your Address]"}

Date: ${today()}

Subject: Legal notice — ${i.purpose || "[subject of notice]"}

Dear Sir/Madam,

Under instructions from and on behalf of ${i.senderName || "[Your Name]"}, I serve upon you the following legal notice:

1. That the facts giving rise to this notice are as follows: ${i.facts || "[describe what happened, with relevant dates]"}.
2. That the aforesaid acts/omissions on your part are unlawful and have caused loss and inconvenience to my client.
3. That my client hereby demands the following: ${i.demand || "[state exactly what you want the recipient to do]"}.

You are hereby called upon to comply with the above demand within ${deadline} days of receipt of this notice, failing which my client shall be constrained to initiate appropriate legal proceedings against you, entirely at your risk, cost, and consequences.

This notice is issued without prejudice to any other right or remedy available to my client under the law.

Dated: ${today()} at ${i.city || "[City]"}

Yours faithfully,

_________________________
${i.senderName || "[Your Name]"}

Send by registered post with acknowledgement due (AD), or by courier, and retain proof of dispatch and a copy of this notice.`;
}
