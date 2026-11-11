import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";
import { initials, shiftISO } from "./format";
import { parseMarkdown } from "./markdown";

describe("csv", () => {
  it("quotes cells with commas, quotes and newlines", () => {
    expect(csvCell('Rao, "Ananya"')).toBe('"Rao, ""Ananya"""');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(42)).toBe("42");
  });

  it("neutralises formula injection in text but not numbers", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell(-5)).toBe("-5");
  });

  it("joins rows with CRLF", () => {
    expect(
      toCsv([
        ["a", 1],
        ["b", 2],
      ]),
    ).toBe("a,1\r\nb,2");
  });
});

describe("markdown", () => {
  it("parses paragraphs, bullets and bold", () => {
    const blocks = parseMarkdown("**Avg: 80%**\n\n- one\n- **two** items\nAfter");
    expect(blocks).toEqual([
      { type: "p", content: [{ text: "Avg: 80%", bold: true }] },
      {
        type: "ul",
        items: [
          [{ text: "one", bold: false }],
          [
            { text: "two", bold: true },
            { text: " items", bold: false },
          ],
        ],
      },
      { type: "p", content: [{ text: "After", bold: false }] },
    ]);
  });

  it("keeps HTML as plain text", () => {
    expect(parseMarkdown("<img onerror=x>")[0]).toEqual({
      type: "p",
      content: [{ text: "<img onerror=x>", bold: false }],
    });
  });
});

describe("format", () => {
  it("shifts ISO dates across month boundaries", () => {
    expect(shiftISO("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("builds initials and skips titles", () => {
    expect(initials("Prof. Ananya Rao")).toBe("AR");
  });
});
