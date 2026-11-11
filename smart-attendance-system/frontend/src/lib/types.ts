export type Status = "present" | "late" | "absent";

export interface User {
  id: string;
  username: string;
  fullName: string;
}

export interface ClassItem {
  id: string;
  code: string;
  name: string;
  department: string;
  studentCount: number;
  enrolledCount: number;
  attendedToday: number;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  classId: string | null;
  className: string | null;
  classCode: string | null;
  faceEnrolled: boolean;
  faceEnrolledAt: string | null;
}

export interface RosterRecord {
  studentId: string;
  name: string;
  rollNumber: string;
  classId: string | null;
  className: string | null;
  faceEnrolled: boolean;
  status: Status | null;
  method: "face" | "manual" | null;
  matchScore: number | null;
  markedAt: string | null;
}

export interface Dashboard {
  date: string;
  today: {
    totalStudents: number;
    enrolledFaces: number;
    present: number;
    late: number;
    absent: number;
    rate: number;
  };
  trend: { date: string; attended: number; marked: number; total: number }[];
  classes: { id: string; code: string; name: string; total: number; attended: number }[];
  recent: {
    id: string;
    name: string;
    rollNumber: string;
    classCode: string | null;
    status: Status;
    method: "face" | "manual";
    matchScore: number | null;
    markedAt: string;
  }[];
}

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

export interface Report {
  from: string;
  to: string;
  classId: string | null;
  averageRate: number;
  rows: ReportRow[];
}

export interface RecognizeResult {
  student: { id: string; name: string; rollNumber: string; className: string | null; markedAt: string };
  score: number;
  alreadyMarked: boolean;
}
