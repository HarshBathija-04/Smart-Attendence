import { Router } from "express";
import { query, today } from "../db";

export const dashboardRouter = Router();

dashboardRouter.get("/", async (_req, res) => {
  const date = today();
  const [[totals], statusRows, trend, classes, recent] = await Promise.all([
    query<{ total: number; enrolled: number }>(
      "SELECT count(*)::int AS total, count(face_embedding)::int AS enrolled FROM students",
    ),
    query<{ status: string; n: number }>(
      "SELECT status, count(*)::int AS n FROM attendance WHERE date = $1 GROUP BY status",
      [date],
    ),
    query(
      `SELECT d::date::text AS date,
              count(a.id) FILTER (WHERE a.status IN ('present','late'))::int AS attended,
              count(a.id)::int AS marked
         FROM generate_series($1::date - 13, $1::date, interval '1 day') AS d
         LEFT JOIN attendance a ON a.date = d::date
        GROUP BY d ORDER BY d`,
      [date],
    ),
    query(
      `SELECT c.id, c.code, c.name, count(s.id)::int AS total,
              count(a.id) FILTER (WHERE a.status IN ('present','late'))::int AS attended
         FROM classes c
         LEFT JOIN students s ON s.class_id = c.id
         LEFT JOIN attendance a ON a.student_id = s.id AND a.date = $1
        GROUP BY c.id ORDER BY c.code`,
      [date],
    ),
    query(
      `SELECT a.id, s.name, s.roll_number AS "rollNumber", c.code AS "classCode", a.status, a.method,
              a.match_score AS "matchScore", a.marked_at AS "markedAt"
         FROM attendance a JOIN students s ON s.id = a.student_id
         LEFT JOIN classes c ON c.id = s.class_id
        WHERE a.date = $1 AND a.status <> 'absent'
        ORDER BY a.marked_at DESC LIMIT 8`,
      [date],
    ),
  ]);

  const count = (s: string) => statusRows.find((r) => r.status === s)?.n ?? 0;
  const present = count("present");
  const late = count("late");
  res.json({
    date,
    today: {
      totalStudents: totals.total,
      enrolledFaces: totals.enrolled,
      present,
      late,
      absent: Math.max(totals.total - present - late, 0),
      rate: totals.total ? Math.round(((present + late) / totals.total) * 100) : 0,
    },
    trend: trend.map((t) => ({ ...t, total: totals.total })),
    classes,
    recent,
  });
});
