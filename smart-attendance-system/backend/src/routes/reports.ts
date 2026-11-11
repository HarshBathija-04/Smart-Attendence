import { Router } from "express";
import { z } from "zod";
import { aiClient } from "../ai";
import { config } from "../config";
import { query, today } from "../db";
import { AppError } from "../errors";
import { isoDate, uuid } from "../validation";

export interface ReportRow {
  studentId: string;
  name: string;
  rollNumber: string;
  className: string | null;
  sessions: number;
  present: number;
  late: number;
  absent: number;
  rate: number;
}

const rangeInput = z
  .object({ from: isoDate.optional(), to: isoDate.optional(), classId: uuid.optional() })
  .transform(({ from, to, classId }) => {
    const end = to ?? today();
    const start = from ?? shiftDate(end, -29);
    return { from: start, to: end, classId };
  })
  .refine((r) => r.from <= r.to, "'from' must be on or before 'to'");

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A "session" is a day on which any attendance was taken for the student's class. */
async function buildReport(from: string, to: string, classId?: string): Promise<ReportRow[]> {
  const rows = await query<Omit<ReportRow, "absent" | "rate">>(
    `WITH sessions AS (
       SELECT s.class_id, count(DISTINCT a.date)::int AS n
         FROM attendance a JOIN students s ON s.id = a.student_id
        WHERE a.date BETWEEN $1 AND $2
        GROUP BY s.class_id
     )
     SELECT s.id AS "studentId", s.name, s.roll_number AS "rollNumber", c.name AS "className",
            COALESCE(se.n, 0) AS sessions,
            count(a.id) FILTER (WHERE a.status = 'present')::int AS present,
            count(a.id) FILTER (WHERE a.status = 'late')::int AS late
       FROM students s
       LEFT JOIN classes c ON c.id = s.class_id
       LEFT JOIN sessions se ON se.class_id IS NOT DISTINCT FROM s.class_id
       LEFT JOIN attendance a ON a.student_id = s.id AND a.date BETWEEN $1 AND $2
      WHERE ($3::uuid IS NULL OR s.class_id = $3)
      GROUP BY s.id, c.name, se.n
      ORDER BY c.name NULLS LAST, s.roll_number`,
    [from, to, classId ?? null],
  );
  return rows.map((r) => {
    const attended = r.present + r.late;
    return {
      ...r,
      absent: Math.max(r.sessions - attended, 0),
      rate: r.sessions ? Math.round((attended / r.sessions) * 100) : 0,
    };
  });
}

export const reportsRouter = Router();

reportsRouter.get("/attendance", async (req, res) => {
  const { from, to, classId } = rangeInput.parse(req.query);
  const rows = await buildReport(from, to, classId);
  const withSessions = rows.filter((r) => r.sessions > 0);
  const averageRate = withSessions.length
    ? Math.round(withSessions.reduce((sum, r) => sum + r.rate, 0) / withSessions.length)
    : 0;
  res.json({ from, to, classId: classId ?? null, averageRate, rows });
});

reportsRouter.post("/insights", async (req, res) => {
  const { from, to, classId } = rangeInput.parse(req.body ?? {});
  const rows = (await buildReport(from, to, classId)).filter((r) => r.sessions > 0);
  if (!rows.length) throw new AppError(422, "No attendance was recorded in this period");
  const className = classId ? (rows[0].className ?? "the class") : "all classes";
  const summary = await aiClient.summarize({ from, to, className, rows: rows.slice(0, 200) });
  res.json({ summary, model: config.GROQ_MODEL });
});
