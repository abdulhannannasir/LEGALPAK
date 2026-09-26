/**
 * Thin wrapper around Google AI Studio's Gemini API (REST, no SDK — the
 * request shape is simple enough that a dependency isn't worth it). Used
 * only for the citizen legal-chat advisor; every other generator in this app
 * stays deterministic/rules-based by design (see due-date.ts, contracts.ts).
 */
const MODEL = "gemini-flash-latest";

export type ChatTurn = { role: "user" | "model"; text: string };

/**
 * Gemini expects turns to alternate. Two sends overlapping in one session can leave a
 * user message stored (or still pending) before the previous reply lands, so the history
 * can hold same-role neighbours — fold them into a single turn instead of sending them
 * back to back.
 */
export function mergeConsecutiveTurns(turns: ChatTurn[]): ChatTurn[] {
  const merged: ChatTurn[] = [];
  for (const turn of turns) {
    const last = merged[merged.length - 1];
    if (last && last.role === turn.role) last.text += `\n\n${turn.text}`;
    else merged.push({ ...turn });
  }
  return merged;
}

export async function askGemini(systemPrompt: string, history: ChatTurn[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: mergeConsecutiveTurns(history).map((turn) => ({
          role: turn.role,
          parts: [{ text: turn.text }],
        })),
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) throw new Error("Gemini returned no text");
  return text;
}
