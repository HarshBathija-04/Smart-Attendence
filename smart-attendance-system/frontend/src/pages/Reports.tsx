import clsx from "clsx";
import { ArrowDownUp, BarChart3, Download, Sparkles } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Button,
  ClassOptions,
  EmptyState,
  ErrorState,
  Meter,
  PageHeader,
  Select,
  SkeletonRows,
} from "../components/ui";
import { api, errorMessage, qs, useApi } from "../lib/api";
import { downloadCsv } from "../lib/csv";
import { shiftISO, todayISO } from "../lib/format";
import { parseMarkdown, type Inline } from "../lib/markdown";
import type { ClassItem, Report, ReportRow } from "../lib/types";

type SortKey = "rollNumber" | "name" | "rate";

function InlineText({ parts }: { parts: Inline }) {
  return parts.map((p, i) =>
    p.bold ? (
      <strong key={i} className="font-semibold">
        {p.text}
      </strong>
    ) : (
      <Fragment key={i}>{p.text}</Fragment>
    ),
  );
}

function Insights({ markdown }: { markdown: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {parseMarkdown(markdown).map((b, i) =>
        b.type === "ul" ? (
          <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-accent">
            {b.items.map((item, j) => (
              <li key={j}>
                <InlineText parts={item} />
              </li>
            ))}
          </ul>
        ) : b.type === "h" ? (
          <h3 key={i} className="font-semibold">
            <InlineText parts={b.content} />
          </h3>
        ) : (
          <p key={i}>
            <InlineText parts={b.content} />
          </p>
        ),
      )}
    </div>
  );
}

export default function Reports() {
  const [to, setTo] = useState(todayISO());
  const [from, setFrom] = useState(shiftISO(todayISO(), -29));
  const [classId, setClassId] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "rate", dir: 1 });
  const [insight, setInsight] = useState<{ text: string; key: string } | null>(null);
  const [thinking, setThinking] = useState(false);
  const classes = useApi<ClassItem[]>("/api/classes");
  const validRange = from <= to;
  const queryKey = qs({ from, to, classId });
  const report = useApi<Report>(validRange ? `/api/reports/attendance${queryKey}` : null);

  const rows = useMemo(() => {
    const list = [...(report.data?.rows ?? [])];
    return list.sort((a, b) => {
      const v = sort.key === "rate" ? a.rate - b.rate : a[sort.key].localeCompare(b[sort.key]);
      return v * sort.dir || a.rollNumber.localeCompare(b.rollNumber);
    });
  }, [report.data, sort]);

  const withSessions = rows.filter((r) => r.sessions > 0);
  const below = withSessions.filter((r) => r.rate < 75).length;
  const className = classes.data?.find((c) => c.id === classId)?.code ?? "all-classes";

  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }));

  const exportCsv = () => {
    const header = ["Roll number", "Name", "Class", "Sessions", "Present", "Late", "Absent", "Attendance %"];
    const body = rows.map((r: ReportRow) => [
      r.rollNumber,
      r.name,
      r.className,
      r.sessions,
      r.present,
      r.late,
      r.absent,
      r.rate,
    ]);
    downloadCsv(`attendance_${className}_${from}_to_${to}.csv`, [header, ...body]);
    toast.success(`Exported ${rows.length} rows`);
  };

  const askAi = async () => {
    setThinking(true);
    try {
      const res = await api<{ summary: string }>("/api/reports/insights", {
        method: "POST",
        body: { from, to, ...(classId ? { classId } : {}) },
        expectSlow: true,
      });
      setInsight({ text: res.summary, key: queryKey });
    } catch (err) {
      toast.error(errorMessage(err, "Could not generate insights"));
    } finally {
      setThinking(false);
    }
  };

  const SortButton = ({ k, children }: { k: SortKey; children: string }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className="inline-flex items-center gap-1 rounded hover:text-ink"
    >
      {children}
      <ArrowDownUp className={clsx("size-3", sort.key === k ? "text-ink" : "opacity-40")} aria-hidden />
    </button>
  );
  const ariaSort = (k: SortKey) => (sort.key === k ? (sort.dir === 1 ? "ascending" : "descending") : undefined);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Attendance rates per student for any period. Late counts as attended."
        actions={
          <>
            <Button variant="secondary" onClick={askAi} loading={thinking} disabled={!withSessions.length}>
              {!thinking && <Sparkles className="size-4" aria-hidden />} AI summary
            </Button>
            <Button onClick={exportCsv} disabled={!rows.length}>
              <Download className="size-4" aria-hidden /> Export CSV
            </Button>
          </>
        }
      />

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <div>
          <label htmlFor="r-class" className="label">
            Class
          </label>
          <Select id="r-class" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <ClassOptions classes={classes.data} />
          </Select>
        </div>
        <div>
          <label htmlFor="r-from" className="label">
            From
          </label>
          <input
            id="r-from"
            type="date"
            className="input"
            value={from}
            max={to}
            onChange={(e) => e.target.value && setFrom(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="r-to" className="label">
            To
          </label>
          <input
            id="r-to"
            type="date"
            className="input"
            value={to}
            min={from}
            max={todayISO()}
            onChange={(e) => e.target.value && setTo(e.target.value)}
          />
        </div>
        {!validRange && (
          <p className="text-sm text-absent sm:col-span-3">The start date must be on or before the end date.</p>
        )}
      </div>

      {insight && insight.key === queryKey && (
        <section className="card mb-4 border-accent/40 bg-accent-soft/40 p-5" aria-labelledby="ai-title">
          <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Sparkles className="size-4 text-accent-ink" aria-hidden />
            <h2 id="ai-title" className="font-semibold">
              AI summary
            </h2>
            <span className="text-xs text-muted sm:ml-auto">Generated by Groq from roll numbers and counts only</span>
          </div>
          <Insights markdown={insight.text} />
        </section>
      )}

      {report.data && (
        <dl className="mb-4 grid grid-cols-3 gap-3">
          {(
            [
              ["Average", `${report.data.averageRate}%`, "text-brand"],
              ["Students", rows.length, ""],
              ["Below 75%", below, below > 0 ? "text-absent" : ""],
            ] as const
          ).map(([label, value, tone]) => (
            <div key={label} className="card p-3 sm:p-4">
              <dt className="eyebrow">{label}</dt>
              <dd className={clsx("tabular mt-1 font-display text-xl font-semibold sm:text-2xl", tone)}>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <section className="card overflow-hidden" aria-label="Report table">
        {report.error && !report.data ? (
          <ErrorState message={report.error.message} onRetry={report.reload} />
        ) : report.loading && !report.data ? (
          <SkeletonRows count={8} className="h-10" />
        ) : !rows.length ? (
          <EmptyState icon={<BarChart3 className="size-5" />} title="Nothing to report">
            No students match this class and date range. Try another class or a wider range.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-line bg-sunken/50 text-xs text-muted">
                <tr>
                  <th scope="col" aria-sort={ariaSort("name")} className="px-4 py-2.5 font-medium">
                    <SortButton k="name">Student</SortButton>
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">
                    Present
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">
                    Late
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">
                    Absent
                  </th>
                  <th scope="col" aria-sort={ariaSort("rate")} className="w-48 px-4 py-2.5 font-medium">
                    <SortButton k="rate">Attendance</SortButton>
                  </th>
                </tr>
              </thead>
              <tbody className="tabular divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.studentId} className="transition-colors hover:bg-sunken/40">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted">
                        <span className="font-mono">{r.rollNumber}</span>
                        {!classId && r.className && ` · ${r.className}`}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-right">{r.present}</td>
                    <td className="px-3 py-2.5 text-right">{r.late}</td>
                    <td className="px-3 py-2.5 text-right">{r.absent}</td>
                    <td className="px-4 py-2.5">
                      {r.sessions ? (
                        <div className="flex items-center gap-3">
                          <Meter value={r.rate} tone="auto" />
                          <span className={clsx("w-10 shrink-0 text-right font-medium", r.rate < 75 && "text-absent")}>
                            {r.rate}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">No sessions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
