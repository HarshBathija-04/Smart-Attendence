import { Router } from "express";
import { z } from "zod";
import { query } from "../db";
import { AppError } from "../errors";
import { bestMatch, faceClient } from "../face";
import { idParam, imageDataUrl, studentInput, uuid } from "../validation";

export const studentsRouter = Router();

// Never select face_embedding into API responses.
const columns = `s.id, s.name, s.roll_number AS "rollNumber", s.department, s.class_id AS "classId",
  c.name AS "className", c.code AS "classCode", (s.face_embedding IS NOT NULL) AS "faceEnrolled",
  s.face_enrolled_at AS "faceEnrolledAt", s.created_at AS "createdAt"`;

async function getStudent(id: string) {
  const [row] = await query(
    `SELECT ${columns} FROM students s LEFT JOIN classes c ON c.id = s.class_id WHERE s.id = $1`,
    [id],
  );
  if (!row) throw new AppError(404, "Student not found");
  return row;
}

/** Embeds the image and rejects group shots or faces already enrolled for someone else. */
async function enrollFace(studentId: string, image: string) {
  const { embedding, faces } = await faceClient.embed(image);
  if (faces > 1) throw new AppError(422, "Multiple faces detected. Capture one person at a time");

  const others = await query<{ id: string; name: string; embedding: number[] }>(
    "SELECT id, name, face_embedding AS embedding FROM students WHERE face_embedding IS NOT NULL AND id <> $1",
    [studentId],
  );
  const dup = bestMatch(embedding, others);
  if (dup) {
    const name = others.find((o) => o.id === dup.id)?.name;
    throw new AppError(409, `This face is already enrolled for ${name}`);
  }
  await query("UPDATE students SET face_embedding = $2, face_enrolled_at = now() WHERE id = $1", [
    studentId,
    JSON.stringify(embedding),
  ]);
}

const listQuery = z.object({
  classId: uuid.optional(),
  search: z.string().trim().max(64).optional(),
});

studentsRouter.get("/", async (req, res) => {
  const { classId, search } = listQuery.parse(req.query);
  const rows = await query(
    `SELECT ${columns} FROM students s LEFT JOIN classes c ON c.id = s.class_id
      WHERE ($1::uuid IS NULL OR s.class_id = $1)
        AND ($2::text IS NULL OR s.name ILIKE '%' || $2 || '%' OR s.roll_number ILIKE '%' || $2 || '%')
      ORDER BY s.roll_number`,
    [classId ?? null, search || null],
  );
  res.json(rows);
});

studentsRouter.post("/", async (req, res) => {
  const input = studentInput.extend({ image: imageDataUrl.optional() }).parse(req.body);
  const [created] = await query<{ id: string }>(
    "INSERT INTO students (name, roll_number, department, class_id) VALUES ($1, $2, $3, $4) RETURNING id",
    [input.name, input.rollNumber, input.department, input.classId ?? null],
  );
  if (input.image) {
    try {
      await enrollFace(created.id, input.image);
    } catch (err) {
      // Keep registration atomic from the user's point of view.
      await query("DELETE FROM students WHERE id = $1", [created.id]);
      throw err;
    }
  }
  res.status(201).json(await getStudent(created.id));
});

studentsRouter.patch("/:id", async (req, res) => {
  const { id } = idParam.parse(req.params);
  const input = studentInput.partial().parse(req.body);
  const rows = await query(
    `UPDATE students SET name = COALESCE($2, name), roll_number = COALESCE($3, roll_number),
            department = COALESCE($4, department),
            class_id = CASE WHEN $5::boolean THEN $6::uuid ELSE class_id END
      WHERE id = $1 RETURNING id`,
    [
      id,
      input.name ?? null,
      input.rollNumber ?? null,
      input.department ?? null,
      input.classId !== undefined,
      input.classId ?? null,
    ],
  );
  if (!rows.length) throw new AppError(404, "Student not found");
  res.json(await getStudent(id));
});

studentsRouter.post("/:id/face", async (req, res) => {
  const { id } = idParam.parse(req.params);
  const { image } = z.object({ image: imageDataUrl }).parse(req.body);
  await getStudent(id);
  await enrollFace(id, image);
  res.json(await getStudent(id));
});

studentsRouter.delete("/:id", async (req, res) => {
  const { id } = idParam.parse(req.params);
  const rows = await query("DELETE FROM students WHERE id = $1 RETURNING id", [id]);
  if (!rows.length) throw new AppError(404, "Student not found");
  res.status(204).end();
});
