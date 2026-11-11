import { Router } from "express";
import { query, today } from "../db";
import { AppError } from "../errors";
import { classInput, idParam } from "../validation";

export const classesRouter = Router();

classesRouter.get("/", async (_req, res) => {
  const rows = await query(
    `SELECT c.id, c.code, c.name, c.department, c.created_at AS "createdAt",
            count(s.id)::int AS "studentCount",
            count(s.face_embedding)::int AS "enrolledCount",
            count(a.id) FILTER (WHERE a.status IN ('present','late'))::int AS "attendedToday"
       FROM classes c
       LEFT JOIN students s ON s.class_id = c.id
       LEFT JOIN attendance a ON a.student_id = s.id AND a.date = $1
      GROUP BY c.id
      ORDER BY c.code`,
    [today()],
  );
  res.json(rows);
});

const columns = `id, code, name, department, created_at AS "createdAt"`;

classesRouter.post("/", async (req, res) => {
  const { code, name, department } = classInput.parse(req.body);
  const [row] = await query(`INSERT INTO classes (code, name, department) VALUES ($1, $2, $3) RETURNING ${columns}`, [
    code,
    name,
    department,
  ]);
  res.status(201).json(row);
});

classesRouter.patch("/:id", async (req, res) => {
  const { id } = idParam.parse(req.params);
  const input = classInput.partial().parse(req.body);
  const [row] = await query(
    `UPDATE classes SET code = COALESCE($2, code), name = COALESCE($3, name), department = COALESCE($4, department)
      WHERE id = $1 RETURNING ${columns}`,
    [id, input.code ?? null, input.name ?? null, input.department ?? null],
  );
  if (!row) throw new AppError(404, "Class not found");
  res.json(row);
});

classesRouter.delete("/:id", async (req, res) => {
  const { id } = idParam.parse(req.params);
  const rows = await query("DELETE FROM classes WHERE id = $1 RETURNING id", [id]);
  if (!rows.length) throw new AppError(404, "Class not found");
  res.status(204).end();
});
