import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { aiClient } from "../src/ai";
import { createApp } from "../src/app";
import { config } from "../src/config";
import { migrate, pool, today } from "../src/db";
import { faceClient } from "../src/face";
import { seed } from "../src/seed";

const app = createApp();
let token = "";
const auth = () => ({ Authorization: `Bearer ${token}` });
const IMAGE = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD";
const faceA = Array.from({ length: 128 }, (_, i) => Math.sin(i + 1));
const faceB = Array.from({ length: 128 }, (_, i) => Math.cos(i * 7 + 3));

beforeAll(async () => {
  expect(config.DB_SCHEMA).toBe("smart_attendance_test");
  await pool.query(`DROP SCHEMA IF EXISTS ${config.DB_SCHEMA} CASCADE`);
  await migrate();
  await seed();
  await seed(); // idempotent
  const res = await request(app).post("/api/auth/login").send({ username: "teacher", password: config.DEMO_PASSWORD });
  token = res.body.token;
});

afterAll(async () => {
  await pool.end();
});

describe("health and auth", () => {
  it("GET /health checks the database", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", db: "ok" });
  });

  it("rejects bad credentials and unauthenticated requests", async () => {
    const bad = await request(app).post("/api/auth/login").send({ username: "teacher", password: "nope" });
    expect(bad.status).toBe(401);
    expect(bad.body.error).toMatch(/invalid/i);
    expect((await request(app).get("/api/students")).status).toBe(401);
    expect(token).toBeTruthy();
  });

  it("validates the login body", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("returns JSON 404s", async () => {
    const res = await request(app).get("/api/nope").set(auth());
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

describe("seeded demo data", () => {
  it("dashboard reflects the seed without duplicates", async () => {
    const res = await request(app).get("/api/dashboard").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.today.totalStudents).toBe(30);
    expect(res.body.trend).toHaveLength(14);
    expect(res.body.classes).toHaveLength(3);
    const { rows } = await pool.query(
      "SELECT count(*)::int AS n, count(DISTINCT (student_id, date))::int AS d FROM attendance",
    );
    expect(rows[0].n).toBe(rows[0].d);
  });
});

describe("classes, students and attendance", () => {
  let classId = "";
  let studentId = "";
  let otherId = "";

  it("creates a class and rejects duplicates", async () => {
    const res = await request(app)
      .post("/api/classes")
      .set(auth())
      .send({ code: "mca-2c", name: "MCA Sem 2 C", department: "CA" });
    expect(res.status).toBe(201);
    expect(res.body.code).toBe("MCA-2C");
    classId = res.body.id;
    const dup = await request(app)
      .post("/api/classes")
      .set(auth())
      .send({ code: "MCA-2C", name: "x", department: "y" });
    expect(dup.status).toBe(409);
  });

  it("validates and creates students", async () => {
    const bad = await request(app).post("/api/students").set(auth()).send({ name: "" });
    expect(bad.status).toBe(400);
    const res = await request(app)
      .post("/api/students")
      .set(auth())
      .send({ name: "Test Student", rollNumber: "t001", department: "CA", classId });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ rollNumber: "T001", faceEnrolled: false, className: "MCA Sem 2 C" });
    expect(res.body).not.toHaveProperty("face_embedding");
    studentId = res.body.id;
    const other = await request(app)
      .post("/api/students")
      .set(auth())
      .send({ name: "Other Student", rollNumber: "T002", department: "CA", classId });
    otherId = other.body.id;
  });

  it("enrolls a face and blocks enrolling the same face twice", async () => {
    vi.spyOn(faceClient, "embed").mockResolvedValue({ embedding: faceA, faces: 1 });
    const res = await request(app).post(`/api/students/${studentId}/face`).set(auth()).send({ image: IMAGE });
    expect(res.status).toBe(200);
    expect(res.body.faceEnrolled).toBe(true);

    const dup = await request(app).post(`/api/students/${otherId}/face`).set(auth()).send({ image: IMAGE });
    expect(dup.status).toBe(409);
    expect(dup.body.error).toContain("Test Student");
  });

  it("rejects group photos on enrollment", async () => {
    vi.spyOn(faceClient, "embed").mockResolvedValue({ embedding: faceB, faces: 2 });
    const res = await request(app).post(`/api/students/${otherId}/face`).set(auth()).send({ image: IMAGE });
    expect(res.status).toBe(422);
  });

  it("recognizes an enrolled face once per day", async () => {
    vi.spyOn(faceClient, "embed").mockResolvedValue({ embedding: faceA.map((v) => v * 0.98), faces: 1 });
    const first = await request(app).post("/api/attendance/recognize").set(auth()).send({ image: IMAGE });
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ alreadyMarked: false, student: { id: studentId, status: "present" } });
    expect(first.body.score).toBeGreaterThan(90);
    const second = await request(app).post("/api/attendance/recognize").set(auth()).send({ image: IMAGE });
    expect(second.body.alreadyMarked).toBe(true);
  });

  it("returns 422 for an unknown face", async () => {
    vi.spyOn(faceClient, "embed").mockResolvedValue({ embedding: faceB, faces: 1 });
    const res = await request(app).post("/api/attendance/recognize").set(auth()).send({ image: IMAGE });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/not recognized/i);
  });

  it("rejects non-image payloads", async () => {
    const res = await request(app).post("/api/attendance/recognize").set(auth()).send({ image: "hello" });
    expect(res.status).toBe(400);
  });

  it("marks attendance manually and shows it on the roster", async () => {
    const date = today();
    const put = await request(app)
      .put("/api/attendance")
      .set(auth())
      .send({ date, records: [{ studentId: otherId, status: "late" }] });
    expect(put.status).toBe(200);
    const roster = await request(app).get("/api/attendance").query({ date, classId }).set(auth());
    expect(roster.status).toBe(200);
    const byId = Object.fromEntries(roster.body.records.map((r: { studentId: string }) => [r.studentId, r]));
    expect(byId[studentId]).toMatchObject({ status: "present", method: "face" });
    expect(byId[otherId]).toMatchObject({ status: "late", method: "manual" });

    const future = await request(app)
      .put("/api/attendance")
      .set(auth())
      .send({ date: "2999-01-01", records: [{ studentId: otherId, status: "present" }] });
    expect(future.status).toBe(400);
  });

  it("builds a per-student report", async () => {
    const res = await request(app).get("/api/reports/attendance").query({ classId }).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(2);
    for (const row of res.body.rows) expect(row).toMatchObject({ sessions: 1, absent: 0, rate: 100 });
    const all = await request(app).get("/api/reports/attendance").set(auth());
    expect(all.body.rows.length).toBe(32);
    expect(all.body.averageRate).toBeGreaterThan(0);
  });

  it("returns AI insights through the Groq client", async () => {
    const spy = vi.spyOn(aiClient, "summarize").mockResolvedValue("**Summary**");
    const res = await request(app).post("/api/reports/insights").set(auth()).send({ classId });
    expect(res.status).toBe(200);
    expect(res.body.summary).toBe("**Summary**");
    expect(spy.mock.calls[0][0].rows).toHaveLength(2);
  });

  it("deletes a student", async () => {
    expect((await request(app).delete(`/api/students/${otherId}`).set(auth())).status).toBe(204);
    expect((await request(app).delete(`/api/students/${otherId}`).set(auth())).status).toBe(404);
  });
});
