import { PackOutput } from "@/components/pack-output";
import { EzfileMappingGuide } from "./EzfileMappingGuide";
import {
  generateAoa,
  generateComplianceChecklist,
  generateForm28,
  generateMoa,
  type IncorporationState,
} from "@/lib/incorporation/secp-rules";

/** Final-step document bundle: MOA, AOA, one Form-28 per officer, the eZfile map, and the Day 1–30 checklist. */
export function DocumentPack({ state }: { state: IncorporationState }) {
  const officers = state.subscribers.filter((s) => s.isOfficer);
  const name = state.proposedNames[0]?.trim().replace(/\s+/g, "-").toLowerCase() || "company";

  return (
    <div className="space-y-6">
      <PackOutput text={generateMoa(state)} filename={`${name}-moa.txt`} title="Memorandum of Association" />
      <PackOutput text={generateAoa(state)} filename={`${name}-aoa.txt`} title="Articles of Association" />
      {officers.map((o) => (
        <PackOutput
          key={o.id}
          text={generateForm28(state, o)}
          filename={`${name}-form-28-${(o.fullName || "director").replace(/\s+/g, "-").toLowerCase()}.txt`}
          title={`Form 28 — ${o.fullName || "Director"}`}
        />
      ))}
      <EzfileMappingGuide state={state} />
      <PackOutput
        text={generateComplianceChecklist(state)}
        filename={`${name}-day-1-30-checklist.txt`}
        title="Day 1–30 compliance checklist"
      />
    </div>
  );
}
