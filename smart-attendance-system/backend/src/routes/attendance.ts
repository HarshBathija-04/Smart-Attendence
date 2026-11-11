import { Router } from "express";
import { z } from "zod";
import { pool, query, today } from "../db";
import { AppError } from "../errors";
import { bestMatch, faceClient } from "../face";
import { imageDataUrl, isoDate, status, uuid } from "../validation";

export const attendanceRouter = Router();

const rosterQuery = z.object({ date: isoDate.optional(), classId: uuid.optional() });

/** Every student (optionally in one class) with their status for the day, or null if unmarked. */
attendanceRouter.get("/", async (req, res) => {
  const { date = today(), classId } = rosterQuery.parse(req.query);
  const rows = await query(
    `SELECT s.id AS "studentId", s.name, s.roll_number AS "rollNumber", s.class_id AS "classId",
            c.name AS "className", (s.face_embedding IS NOT NULL) AS "faceEnrolled",
            a.status, a.method, a.match_score AS "matchScore", a.marked_at AS "markedAt"
       FROM students s
       LEFT JOIN classes c ON c.id = s.class_id
       LEFT JOIN attendance a ON a.student_id = s.id AND a.date = $1
      WHERE ($2::uuid IS NULL OR s.class_id = $2)
      ORDER BY s.roll_number`,
    [date, classId ?? null],
  );
  res.json({ date, records: rows });
});

const bulkInput = z.object({
  date: isoDate.refine((d) => d <= today(), "Cannot mark attendance for a future date"),
  records: z
    .array(z.object({ studentId: uuid, status: status.nullable() }))
    .min(1)
    .max(500),
});

/** Manual marking from the class roster. A null status clears the record. */
attendanceRouter.put("/", async (req, res) => {
  const { date, records } = bulkInput.parse(req.body);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const r of records) {
      if (r.status === null) {
        await client.query("DELETE FROM attendance WHERE student_id = $1 AND date = $2", [r.studentId, date]);
      } else {
        await client.query(
          `INSERT INTO attendance (student_id, date, status, method) VALUES ($1, $2, $3, 'manual')
           ON CONFLICT (student_id, date)
           DO UPDATE SET status = EXCLUDED.status, method = 'manual', match_score = NULL, marked_at = now()`,
          [r.studentId, date, r.status],
        );
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  res.json({ updated: records.length });
});

const recognizeInput = z.object({ image: imageDataUrl, classId: uuid.optional() });

/** Face check-in: identifies the student and marks them present for today. */
attendanceRouter.post("/recognize", async (req, res) => {
  const { image, classId } = recognizeInput.parse(req.body);
  const candidates = await query<{ id: string; embedding: number[] }>(
    `SELECT id, face_embedding AS embedding FROM students
      WHERE face_embedding IS NOT NULL AND ($1::uuid IS NULL OR class_id = $1)`,
    [classId ?? null],
  );
  if (!candidates.length) {
    throw new AppError(422, "No students have an enrolled face yet. Enroll a face from the Students page first");
  }

  const { embedding } = await faceClient.embed(image);
  const match = bestMatch(embedding, candidates);
  if (!match) throw new AppError(422, "Face not recognized. Make sure the student is enrolled and well lit");

  const score = Math.round(match.score * 1000) / 10;
  const date = today();
  const [inserted] = await query<{ id: string }>(
    `INSERT INTO attendance (student_id, date, status, method, match_score) VALUES ($1, $2, 'present', 'face', $3)
     ON CONFLICT (student_id, date) DO NOTHING RETURNING id`,
    [match.id, date, score],
  );
  const [student] = await query(
    `SELECT s.id, s.name, s.roll_number AS "rollNumber", c.name AS "className",
            a.status, a.marked_at AS "markedAt"
       FROM students s LEFT JOIN classes c ON c.id = s.class_id
       LEFT JOIN attendance a ON a.student_id = s.id AND a.date = $2
      WHERE s.id = $1`,
    [match.id, date],
  );
  res.json({ student, score, alreadyMarked: !inserted });
});
