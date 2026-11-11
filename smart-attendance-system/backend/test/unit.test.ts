import { describe, expect, it } from "vitest";
import { buildInsightPrompt } from "../src/ai";
import { bestMatch, cosineSimilarity } from "../src/face";
import { rand, schoolDays } from "../src/seed";

describe("cosineSimilarity", () => {
  it("is 1 for identical direction and 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns -1 for mismatched or empty vectors", () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(-1);
    expect(cosineSimilarity([], [])).toBe(-1);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(-1);
  });
});

describe("bestMatch", () => {
  const candidates = [
    { id: "a", embedding: [1, 0, 0] },
    { id: "b", embedding: [0.8, 0.6, 0] },
  ];

  it("picks the most similar candidate above the threshold", () => {
    expect(bestMatch([0.9, 0.4, 0], candidates, 0.5)?.id).toBe("b");
    expect(bestMatch([1, 0.05, 0], candidates, 0.5)?.id).toBe("a");
  });

  it("returns null when nothing clears the threshold", () => {
    expect(bestMatch([0, 0, 1], candidates, 0.363)).toBeNull();
  });
});

describe("seed helpers", () => {
  it("rand is deterministic and within [0, 1)", () => {
    expect(rand("x")).toBe(rand("x"));
    for (const k of ["a", "b", "MCA24001:2026-01-05"]) {
      expect(rand(k)).toBeGreaterThanOrEqual(0);
      expect(rand(k)).toBeLessThan(1);
    }
  });

  it("schoolDays skips weekends", () => {
    // 2026-11-09 is a Monday
    expect(schoolDays("2026-11-09", 3)).toEqual(["2026-11-09", "2026-11-06", "2026-11-05"]);
  });
});

describe("buildInsightPrompt", () => {
  it("sends roll numbers and counts, never names", () => {
    const prompt = buildInsightPrompt({
      from: "2026-11-01",
      to: "2026-11-09",
      className: "MCA-1A",
      rows: [
        {
          studentId: "1",
          name: "Secret Name",
          rollNumber: "MCA24001",
          className: "MCA-1A",
          sessions: 5,
          present: 3,
          late: 1,
          absent: 1,
          rate: 80,
        },
      ],
    });
    expect(prompt).toContain("MCA24001");
    expect(prompt).toContain("rate=80%");
    expect(prompt).not.toContain("Secret Name");
  });
});
