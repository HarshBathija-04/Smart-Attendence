import bcrypt from "bcryptjs";
import { config } from "./config";
import { pool, query, today } from "./db";

const CLASSES = [
  { code: "MCA-1A", name: "MCA Semester 1, Section A", department: "Computer Applications" },
  { code: "BCA-2B", name: "BCA Year 2, Section B", department: "Computer Applications" },
  { code: "BSC-CS3", name: "B.Sc Computer Science, Year 3", department: "Computer Science" },
];

const NAMES = [
  "Aarav Sharma",
  "Diya Patel",
  "Vihaan Reddy",
  "Ananya Iyer",
  "Arjun Nair",
  "Isha Gupta",
  "Kabir Singh",
  "Meera Joshi",
  "Rohan Das",
  "Saanvi Kulkarni",
  "Aditya Menon",
  "Priya Raman",
  "Karthik Rao",
  "Neha Verma",
  "Siddharth Bose",
  "Tanvi Desai",
  "Yash Malhotra",
  "Riya Chatterjee",
  "Nikhil Pillai",
  "Pooja Hegde",
  "Varun Saxena",
  "Kavya Krishnan",
  "Aryan Mehta",
  "Sneha Bhat",
  "Rahul Mishra",
  "Lakshmi Varma",
  "Dev Agarwal",
  "Nandini Sinha",
  "Harsh Kapoor",
  "Aisha Khan",
];

/** Deterministic 0..1 value so re-running the seed produces the same history. */
export function rand(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

/** The last `count` weekdays ending at `end` (inclusive), newest first. */
export function schoolDays(end: string, count: number): string[] {
  const days: string[] = [];
  const d = new Date(`${end}T00:00:00Z`);
  while (days.length < count) {
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) days.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return days;
}

export async function seed(): Promise<void> {
  const hash = await bcrypt.hash(config.DEMO_PASSWORD, 10);
  await query(
    `INSERT INTO users (username, password_hash, full_name) VALUES ('teacher', $1, 'Prof. Ananya Rao')
     ON CONFLICT (username) DO NOTHING`,
    [hash],
  );
  if (!config.SEED_DEMO_DATA) return;

  for (const c of CLASSES) {
    await query("INSERT INTO classes (code, name, department) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING", [
      c.code,
      c.name,
      c.department,
    ]);
  }
  const classes = await query<{ id: string; code: string; department: string }>(
    "SELECT id, code, department FROM classes WHERE code = ANY($1)",
    [CLASSES.map((c) => c.code)],
  );

  for (const [i, name] of NAMES.entries()) {
    const cls = classes.find((c) => c.code === CLASSES[i % CLASSES.length].code);
    if (!cls) continue;
    const roll = `${cls.code.split("-")[0]}${24001 + i}`;
    await query(
      `INSERT INTO students (name, roll_number, department, class_id) VALUES ($1, $2, $3, $4)
       ON CONFLICT (roll_number) DO NOTHING`,
      [name, roll, cls.department, cls.id],
    );
  }

  // Fill missing school days of demo history for the seeded (face-less) demo students only.
  // Existing records are never touched, so re-running is safe and keeps the demo current.
  const students = await query<{ id: string; roll_number: string }>(
    "SELECT id, roll_number FROM students WHERE class_id = ANY($1) AND face_embedding IS NULL",
    [classes.map((c) => c.id)],
  );
  const now = today();
  const rows: { studentId: string; date: string; status: string; score: number | null; minute: number }[] = [];
  for (const s of students) {
    const reliability = 0.62 + rand(s.roll_number) * 0.36;
    for (const day of schoolDays(now, 30)) {
      // Today is only partially taken, so the live demo still has students to mark.
      if (day === now && rand(`today:${s.roll_number}`) > 0.6) continue;
      const r = rand(`${s.roll_number}:${day}`);
      const status = r < reliability - 0.08 ? "present" : r < reliability ? "late" : "absent";
      rows.push({
        studentId: s.id,
        date: day,
        status,
        score: status === "absent" ? null : Math.round(72 + rand(`s:${s.roll_number}:${day}`) * 24),
        minute: (status === "late" ? 20 : 0) + Math.floor(rand(`m:${s.roll_number}:${day}`) * 18),
      });
    }
  }
  // One set-based insert via unnest keeps this to a single round trip.
  await query(
    `INSERT INTO attendance (student_id, date, status, method, match_score, marked_at)
     SELECT t.student_id, t.date, t.status, CASE WHEN t.status = 'absent' THEN 'manual' ELSE 'face' END, t.score,
            (t.date + time '09:00' + make_interval(mins => t.minute)) AT TIME ZONE $6
       FROM unnest($1::uuid[], $2::date[], $3::text[], $4::real[], $5::int[])
            AS t(student_id, date, status, score, minute)
     ON CONFLICT (student_id, date) DO NOTHING`,
    [
      rows.map((r) => r.studentId),
      rows.map((r) => r.date),
      rows.map((r) => r.status),
      rows.map((r) => r.score),
      rows.map((r) => r.minute),
      config.APP_TIMEZONE,
    ],
  );
}

if (require.main === module) {
  seed()
    .then(() => console.log("Seed complete"))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
