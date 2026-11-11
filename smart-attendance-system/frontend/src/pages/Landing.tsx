import {
  ArrowRight,
  Check,
  ClipboardList,
  FileSpreadsheet,
  ScanFace,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { Logo } from "../components/layout";
import { ButtonLink } from "../components/ui";
import { initials } from "../lib/format";

const REPO_URL = "https://github.com/HarshBathija-04/Smart-Attendence";

const feed = [
  { name: "Ananya Iyer", roll: "MCA24004", time: "9:02", score: 96, status: "present" },
  { name: "Kabir Singh", roll: "MCA24007", time: "9:03", score: 91, status: "present" },
  { name: "Meera Joshi", roll: "MCA24010", time: "9:21", score: 88, status: "late" },
] as const;

function RegisterPreview() {
  const days = ["M", "T", "W", "T", "F", "M", "T", "W", "T", "F"];
  const grid = [
    [1, 1, 1, 2, 1, 1, 1, 1, 0, 1],
    [1, 1, 0, 1, 1, 1, 2, 1, 1, 1],
    [1, 2, 1, 1, 1, 0, 1, 1, 1, 1],
  ];
  const cell = ["bg-absent/80", "bg-present", "bg-accent"];
  return (
    <div className="card relative mx-auto w-full max-w-md p-5 shadow-raised" aria-hidden>
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">MCA Semester 1 · Section A</p>
          <p className="mt-1 font-display text-lg font-semibold">Today’s register</p>
        </div>
        <span className="rounded-full bg-present-soft px-2.5 py-1 text-xs font-semibold text-present">
          <span className="tabular">24 / 28</span> in
        </span>
      </div>
      <ul className="mt-4 divide-y divide-line">
        {feed.map((f) => (
          <li key={f.roll} className="flex items-center gap-3 py-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
              {initials(f.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{f.name}</p>
              <p className="font-mono text-2xs text-muted">{f.roll}</p>
            </div>
            <div className="text-right">
              <p className="tabular text-sm">{f.time}</p>
              <p className={f.status === "late" ? "text-2xs font-medium text-late" : "text-2xs text-muted"}>
                {f.status === "late" ? "Late" : `${f.score}% match`}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded bg-sunken/70 p-3">
        <div className="mb-2 flex justify-between text-2xs text-muted">
          <span>Last two weeks</span>
          <span className="tabular">92% avg</span>
        </div>
        <div className="grid grid-cols-10 gap-1">
          {days.map((d, i) => (
            <span key={i} className="text-center font-mono text-[10px] text-muted">
              {d}
            </span>
          ))}
          {grid.flat().map((v, i) => (
            <span key={i} className={`h-3 rounded-[3px] ${cell[v]}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

const steps = [
  {
    icon: UserPlus,
    title: "Enroll once",
    body: "Add a student and capture one clear photo. Only a 128-number face embedding is stored, never the photo.",
  },
  {
    icon: ScanFace,
    title: "Check in at the door",
    body: "Students look at the webcam. Recognition takes about a second and marks them present for the day.",
  },
  {
    icon: ClipboardList,
    title: "Fix the roster",
    body: "Mark late arrivals or absences by hand in one tap. Manual and face entries live side by side.",
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: "Proxy-resistant",
    body: "One face per student, duplicate-face enrollment is blocked and every check-in records its match score.",
  },
  {
    icon: FileSpreadsheet,
    title: "Reports that export",
    body: "Per-student attendance rates for any date range, filtered by class, downloadable as CSV.",
  },
  {
    icon: Sparkles,
    title: "AI summaries",
    body: "One click turns a report into a short brief: who is below 75%, lateness patterns and a next step.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm sm:gap-2">
          <a href="#how" className="hidden rounded px-3 py-2 text-muted hover:text-ink sm:inline-block">
            How it works
          </a>
          <a href="#features" className="hidden rounded px-3 py-2 text-muted hover:text-ink sm:inline-block">
            Features
          </a>
          <ButtonLink to="/login" size="sm" className="h-9 px-4">
            Sign in
          </ButtonLink>
        </nav>
      </header>

      <main>
        <section className="ruled border-y border-line/70">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
            <div>
              <p className="eyebrow mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1">
                <span className="size-1.5 rounded-full bg-accent" aria-hidden /> Face recognition attendance
              </p>
              <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Roll call in seconds, <span className="text-brand">not ten minutes.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted">
                Smart Attendance recognizes students from a webcam, keeps an honest register for every class, and turns
                it into reports you can export or summarise.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink to="/login" className="h-11 px-5 text-base shadow-raised">
                  Open the live demo <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
                <a
                  href={REPO_URL}
                  className="inline-flex h-11 items-center rounded border border-line bg-surface px-5 font-medium transition-colors hover:border-ink/25 hover:bg-sunken/60"
                >
                  View source
                </a>
              </div>
              <p className="mt-4 text-sm text-muted">
                Demo login: <code className="font-mono text-ink">teacher</code> /{" "}
                <code className="font-mono text-ink">demo1234</code>
              </p>
            </div>
            <RegisterPreview />
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-16 sm:px-6 lg:py-20">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 max-w-xl font-display text-3xl font-semibold tracking-tight">
            Three steps from photo to report
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="card p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded bg-brand-soft text-brand">
                    <s.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-display text-3xl font-semibold text-line" aria-hidden>
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="features" className="scroll-mt-8 border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
              <div>
                <p className="eyebrow">Built for teachers</p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
                  Everything a register needs, nothing it doesn’t
                </h2>
              </div>
              <ul className="grid gap-8 sm:grid-cols-3">
                {features.map((f) => (
                  <li key={f.title}>
                    <f.icon className="size-6 text-accent-ink" aria-hidden />
                    <h3 className="mt-3 font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted">{f.body}</p>
                  </li>
                ))}
              </ul>
            </div>
            <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {["React + TypeScript", "Express API", "OpenCV YuNet + SFace", "PostgreSQL", "Groq LLM"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-present" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Smart Attendance, a face recognition attendance system.</p>
          <a href={REPO_URL} className="hover:text-ink">
            Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
