-- Ported from the original supabase_schema.sql (Admin / Student / Attendance)
-- and extended with classes. Runs inside the schema named by DB_SCHEMA.

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name     text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE classes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text NOT NULL UNIQUE,
  name       text NOT NULL,
  department text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE students (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number      text NOT NULL UNIQUE,
  name             text NOT NULL,
  department       text NOT NULL,
  class_id         uuid REFERENCES classes(id) ON DELETE SET NULL,
  face_embedding   jsonb,
  face_enrolled_at timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX students_class_id_idx ON students (class_id);

CREATE TABLE attendance (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date        date NOT NULL,
  status      text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent')),
  method      text NOT NULL DEFAULT 'face' CHECK (method IN ('face', 'manual')),
  match_score real,
  marked_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);
CREATE INDEX attendance_date_idx ON attendance (date);
