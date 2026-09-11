import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

/**
 * Turns one of LegalPak's plain-text packs (board resolutions, memos,
 * contracts) into a formatted, editable .docx — the same line-based
 * heuristics apply everywhere so every generator gets Word export for free
 * via PackOutput, instead of each one needing a bespoke template.
 *
 * Heuristics on each line:
 *   - ALL-CAPS, no trailing colon-only content, longer than 3 chars → a
 *     section heading (bold, larger, spaced above).
 *   - A short line ending in a signature blank ("_____") → kept as-is,
 *     monospace-ish via Courier so blanks still visually line up.
 *   - Blank line → paragraph spacing, no visible text.
 *   - Everything else → a normal paragraph, wrapping naturally (unlike the
 *     fixed-width .txt, Word reflows to the page).
 */
function isHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 4 || trimmed.length > 80) return false;
  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 3) return false;
  return trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
}

export function textToDocxBlob(title: string, text: string): Promise<Blob> {
  const lines = text.split("\n");
  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
  ];

  for (const line of lines) {
    if (line.trim() === "") {
      paragraphs.push(new Paragraph({ text: "" }));
      continue;
    }
    if (isHeading(line)) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line.trim(), bold: true, size: 24 })],
          spacing: { before: 300, after: 150 },
        }),
      );
      continue;
    }
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: line, font: "Courier New", size: 20 })],
        spacing: { after: 60 },
      }),
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }],
  });
  return Packer.toBlob(doc);
}
