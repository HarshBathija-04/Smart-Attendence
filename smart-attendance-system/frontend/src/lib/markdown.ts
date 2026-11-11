export type Inline = { text: string; bold: boolean }[];
export type Block = { type: "p" | "h"; content: Inline } | { type: "ul"; items: Inline[] };

/** Splits **bold** spans; everything else stays plain text (rendered via React, so no HTML injection). */
export function parseInline(text: string): Inline {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**")
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    );
}

/** Tiny Markdown subset for AI summaries: headings, paragraphs, bullet lists, bold. */
export function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      const last = blocks.at(-1);
      if (last?.type === "ul") last.items.push(parseInline(bullet[1]));
      else blocks.push({ type: "ul", items: [parseInline(bullet[1])] });
    } else if (/^#{1,6}\s/.test(line)) {
      blocks.push({ type: "h", content: parseInline(line.replace(/^#+\s*/, "")) });
    } else {
      blocks.push({ type: "p", content: parseInline(line) });
    }
  }
  return blocks;
}
