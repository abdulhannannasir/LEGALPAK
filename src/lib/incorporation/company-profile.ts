/**
 * "Cap Table & Vault" integration — a structured, portable JSON snapshot of
 * a company's incorporation data (name, CUIN, NTN, director/shareholder
 * table) that a founder can download once and re-upload into any later
 * LegalPak filing tool (Form 21, Form 45, Legal Notices, another
 * incorporation draft) to skip re-typing the same details.
 *
 * This is deliberately a local file, not a server record: the real,
 * durable copy of a company lives in the `company` Postgres table (see
 * lib/legalpak/companies.ts) once the founder signs in and saves a
 * profile there. This JSON is the client-side "carry it with you" layer
 * for people using these tools anonymously, or before that save happens.
 */
import type { EntityTypeId, Subscriber } from "./secp-rules";

export const COMPANY_PROFILE_SCHEMA_VERSION = 1;

export type CompanyProfile = {
  schemaVersion: number;
  name: string;
  cuin: string;
  ntn: string;
  entityType: EntityTypeId;
  registeredAddress: string;
  province: string;
  authorizedCapital: number;
  shareFaceValue: number;
  paidUpCapital: number;
  subscribers: Subscriber[];
  exportedAt: string;
};

export function buildCompanyProfile(input: {
  name: string;
  cuin?: string;
  ntn?: string;
  entityType: EntityTypeId;
  registeredAddress: string;
  province: string;
  authorizedCapital: number;
  shareFaceValue: number;
  paidUpCapital: number;
  subscribers: Subscriber[];
}): CompanyProfile {
  return {
    schemaVersion: COMPANY_PROFILE_SCHEMA_VERSION,
    name: input.name,
    cuin: input.cuin ?? "",
    ntn: input.ntn ?? "",
    entityType: input.entityType,
    registeredAddress: input.registeredAddress,
    province: input.province,
    authorizedCapital: input.authorizedCapital,
    shareFaceValue: input.shareFaceValue,
    paidUpCapital: input.paidUpCapital,
    subscribers: input.subscribers,
    exportedAt: new Date().toISOString(),
  };
}

export function downloadCompanyProfile(profile: CompanyProfile): void {
  const filename = `${(profile.name || "company").trim().replace(/\s+/g, "-").toLowerCase()}-profile.json`;
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Loose shape check — this is a file a user could hand-edit, so validate rather than trust. */
function isCompanyProfileShape(v: unknown): v is CompanyProfile {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.name === "string" && typeof o.entityType === "string" && Array.isArray(o.subscribers);
}

export function parseCompanyProfile(text: string): CompanyProfile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  if (!isCompanyProfileShape(parsed)) {
    throw new Error("That file doesn't look like a LegalPak company profile.");
  }
  return {
    schemaVersion: parsed.schemaVersion ?? COMPANY_PROFILE_SCHEMA_VERSION,
    name: parsed.name ?? "",
    cuin: parsed.cuin ?? "",
    ntn: parsed.ntn ?? "",
    entityType: parsed.entityType,
    registeredAddress: parsed.registeredAddress ?? "",
    province: parsed.province ?? "",
    authorizedCapital: Number(parsed.authorizedCapital) || 0,
    shareFaceValue: Number(parsed.shareFaceValue) || 0,
    paidUpCapital: Number(parsed.paidUpCapital) || 0,
    subscribers: Array.isArray(parsed.subscribers) ? parsed.subscribers : [],
    exportedAt: parsed.exportedAt ?? new Date().toISOString(),
  };
}

export function readCompanyProfileFile(file: File): Promise<CompanyProfile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(parseCompanyProfile(String(reader.result)));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsText(file);
  });
}
