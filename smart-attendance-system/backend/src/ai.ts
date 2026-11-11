import Groq from "groq-sdk";
import { config } from "./config";
import { AppError } from "./errors";
import type { ReportRow } from "./routes/reports";

let client: Groq | null = null;

export interface InsightInput {
  from: string;
  to: string;
  className: string;
  rows: ReportRow[];
}

// Only roll numbers and aggregate counts leave the server: no names or face data.
export function buildInsightPrompt({ from, to, className, rows }: InsightInput): string {
  const lines = rows.map(
    (r) =>
      `${r.rollNumber}: sessions=${r.sessions} present=${r.present} late=${r.late} absent=${r.absent} rate=${r.rate}%`,
  );
  return [`Attendance report for ${className}, ${from} to ${to}.`, `Students (${rows.length}):`, ...lines].join("\n");
}

export const aiClient = {
  async summarize(input: InsightInput): Promise<string> {
    if (!config.GROQ_API_KEY) throw new AppError(503, "AI insights are not configured on this server");
    client ??= new Groq({ apiKey: config.GROQ_API_KEY, maxRetries: 2, timeout: 30_000 });
    try {
      const completion = await client.chat.completions.create({
        model: config.GROQ_MODEL,
        temperature: 0.3,
        max_completion_tokens: 1200,
        reasoning_effort: "low",
        messages: [
          {
            role: "system",
            content:
              "You are an academic attendance analyst helping a teacher. Write a concise summary in Markdown: " +
              "a one-sentence overview with the class average, then 3-5 bullet points covering students below 75% " +
              "attendance (by roll number), lateness patterns, and one practical follow-up action. " +
              "Use only the data given; never invent numbers. Under 180 words.",
          },
          { role: "user", content: buildInsightPrompt(input) },
        ],
      });
      const text = completion.choices[0]?.message?.content?.trim();
      if (!text) throw new AppError(502, "The AI service returned an empty response");
      return text;
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (err instanceof Groq.RateLimitError) {
        throw new AppError(429, "AI insights are rate limited right now, please try again in a minute");
      }
      console.error("Groq error:", err instanceof Error ? err.message : err);
      throw new AppError(502, "AI insights are temporarily unavailable");
    }
  },
};
