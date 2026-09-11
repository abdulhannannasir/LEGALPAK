import { Document, Page, pdf, StyleSheet, Text, View } from "@react-pdf/renderer";

/**
 * Purpose-built PDF export for LegalPak's plain-text packs, replacing
 * browser print-to-PDF. Same line-based heuristics as generate-docx.ts so
 * headings/body render consistently across every export format.
 */
function isHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 4 || trimmed.length > 80) return false;
  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 3) return false;
  return trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 18 },
  heading: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6 },
  body: { fontFamily: "Courier", fontSize: 9, lineHeight: 1.4, marginBottom: 3 },
  blank: { height: 8 },
});

function PackDocument({ title, text }: { title: string; text: string }) {
  const lines = text.split("\n");
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        {lines.map((line, i) => {
          if (line.trim() === "") return <View key={i} style={styles.blank} />;
          if (isHeading(line)) {
            return (
              <Text key={i} style={styles.heading}>
                {line.trim()}
              </Text>
            );
          }
          return (
            <Text key={i} style={styles.body}>
              {line}
            </Text>
          );
        })}
      </Page>
    </Document>
  );
}

export async function textToPdfBlob(title: string, text: string): Promise<Blob> {
  return pdf(<PackDocument title={title} text={text} />).toBlob();
}
