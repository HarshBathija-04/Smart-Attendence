import clsx from "clsx";
import { ClipboardList, ScanFace, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, Meter, PageHeader, Skeleton, StatusBadge } from "../components/ui";
import { useApi } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDay, formatTime, greeting, isWeekend } from "../lib/format";
import type { Dashboard as DashboardData } from "../lib/types";

function Stat({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="eyebrow">{label}</p>
      <p className={clsx("tabular mt-2 font-display text-3xl font-semibold", tone)}>{value}</p>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
  );
}

/** Ledger-style 14-day chart: one column per day, filled to the share of students who attended. */
function Ledger({ trend }: { trend: DashboardData["trend"] }) {
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5 sm:gap-2" role="img" aria-label={trendLabel(trend)}>
        {trend.map((d) => {
          const pct = d.total ? Math.round((d.attended / d.total) * 100) : 0;
          const noClass = d.marked === 0;
          return (
            <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className={clsx(
                  "w-full rounded-t-[3px] transition-[height] duration-500",
                  noClass ? "h-1 bg-line" : pct >= 75 ? "bg-brand" : "bg-accent",
                )}
                style={noClass ? undefined : { height: `${Math.max(pct, 4)}%` }}
              />
              <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-2xs text-white group-hover:block">
                {noClass ? "No class" : `${pct}%`}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 border-t border-line pt-2 sm:gap-2">
        {trend.map((d, i) => (
          <span
            key={d.date}
            className={clsx("flex-1 text-center font-mono text-[10px] text-muted", i % 2 && "max-sm:invisible")}
          >
            {formatDay(d.date, { day: "numeric" })}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-brand" aria-hidden /> 75% or more
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-accent" aria-hidden /> Below 75%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1 w-2.5 rounded-sm bg-line" aria-hidden /> No class
        </span>
      </div>
    </div>
  );
}

function trendLabel(trend: DashboardData["trend"]) {
  const days = trend.filter((d) => d.marked > 0 && !isWeekend(d.date));
  if (!days.length) return "No attendance recorded in the last 14 days";
  const avg = Math.round(days.reduce((s, d) => s + (d.attended / d.total) * 100, 0) / days.length);
  return `Average attendance ${avg}% across ${days.length} class days in the last two weeks`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi<DashboardData>("/api/dashboard");

  const header = (
    <PageHeader
      title={`${greeting()}, ${user?.fullName ?? ""}`}
      description={
        data ? formatDay(data.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : " "
      }
      actions={
        <>
          <Link
            to="/app/roster"
            className="inline-flex h-10 items-center gap-2 rounded border border-line bg-surface px-4 text-sm font-medium hover:border-ink/25"
          >
            <ClipboardList className="size-4" aria-hidden /> Open roster
          </Link>
          <Link
            to="/app/check-in"
            className="inline-flex h-10 items-center gap-2 rounded bg-brand px-4 text-sm font-medium text-white hover:bg-brand-strong"
          >
            <ScanFace className="size-4" aria-hidden /> Start check-in
          </Link>
        </>
      }
    />
  );

  if (error && !data)
    return (
      <>
        {header}
        <div className="card">
          <ErrorState message={error.message} onRetry={reload} />
        </div>
      </>
    );

  if (loading && !data)
    return (
      <>
        {header}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-busy>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[118px]" />
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <span className="sr-only">Loading overview</span>
      </>
    );

  if (!data) return null;
  const t = data.today;

  if (t.totalStudents === 0)
    return (
      <>
        {header}
        <div className="card">
          <EmptyState
            icon={<UserCheck className="size-5" />}
            title="No students yet"
            action={
              <Link
                to="/app/students"
                className="inline-flex h-10 items-center rounded bg-brand px-4 text-sm font-medium text-white"
              >
                Add students
              </Link>
            }
          >
            Create a class and add students to start taking attendance.
          </EmptyState>
        </div>
      </>
    );

  return (
    <>
      {header}
      <section aria-label="Today" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat
          label="Attendance today"
          value={`${t.rate}%`}
          sub={`${t.present + t.late} of ${t.totalStudents} students`}
          tone="text-brand"
        />
        <Stat label="Present" value={t.present} sub="On time" tone="text-present" />
        <Stat label="Late" value={t.late} sub="Marked late" tone="text-late" />
        <Stat label="Not in yet" value={t.absent} sub={`${t.enrolledFaces} faces enrolled`} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="card p-5" aria-labelledby="trend-title">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 id="trend-title" className="font-semibold">
              Last 14 days
            </h2>
            <span className="text-sm text-muted">Share of students attending</span>
          </div>
          <Ledger trend={data.trend} />
        </section>

        <section className="card p-5" aria-labelledby="classes-title">
          <h2 id="classes-title" className="mb-4 font-semibold">
            Classes today
          </h2>
          {data.classes.length === 0 ? (
            <p className="text-sm text-muted">
              No classes yet.{" "}
              <Link to="/app/classes" className="text-brand underline underline-offset-2">
                Create one
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-4">
              {data.classes.map((c) => {
                const pct = c.total ? Math.round((c.attended / c.total) * 100) : 0;
                return (
                  <li key={c.id}>
                    <Link to={`/app/roster?classId=${c.id}`} className="group block rounded">
                      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate font-medium group-hover:text-brand">
                          <span className="font-mono text-xs text-muted">{c.code}</span> {c.name}
                        </span>
                        <span className="tabular shrink-0 text-muted">
                          {c.attended}/{c.total}
                        </span>
                      </div>
                      <Meter value={pct} tone="auto" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-4" aria-labelledby="recent-title">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="recent-title" className="font-semibold">
            Latest check-ins
          </h2>
          <Link to="/app/roster" className="text-sm font-medium text-brand hover:underline">
            View roster
          </Link>
        </div>
        {data.recent.length === 0 ? (
          <EmptyState icon={<ScanFace className="size-5" />} title="Nobody has checked in today">
            Open face check-in or mark the roster to record today’s attendance.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {data.recent.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="truncate font-mono text-2xs text-muted">
                    {r.rollNumber}
                    {r.classCode && ` · ${r.classCode}`}
                  </p>
                </div>
                <span className="hidden text-xs text-muted sm:block">
                  {r.method === "face" && r.matchScore != null
                    ? `Face · ${r.matchScore.toFixed(0)}%`
                    : r.method === "face"
                      ? "Face"
                      : "Manual"}
                </span>
                <StatusBadge status={r.status} />
                <span className="tabular w-16 text-right text-sm text-muted">{formatTime(r.markedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
