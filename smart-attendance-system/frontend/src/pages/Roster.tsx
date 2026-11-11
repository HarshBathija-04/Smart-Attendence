import clsx from "clsx";
import { CheckCheck, ClipboardList, Save, ScanFace } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Button,
  ButtonLink,
  ClassOptions,
  EmptyState,
  ErrorState,
  PageHeader,
  Select,
  SkeletonRows,
} from "../components/ui";
import { api, errorMessage, qs, useApi } from "../lib/api";
import { formatTime, todayISO } from "../lib/format";
import type { ClassItem, RosterRecord, Status } from "../lib/types";

const options: { value: Status; label: string; short: string; active: string }[] = [
  { value: "present", label: "Present", short: "P", active: "bg-present text-white border-present" },
  { value: "late", label: "Late", short: "L", active: "bg-late text-white border-late" },
  { value: "absent", label: "Absent", short: "A", active: "bg-absent text-white border-absent" },
];

export default function Roster() {
  const [params, setParams] = useSearchParams();
  const classId = params.get("classId") ?? "";
  const date = params.get("date") ?? todayISO();
  const classes = useApi<ClassItem[]>("/api/classes");
  const roster = useApi<{ date: string; records: RosterRecord[] }>(`/api/attendance${qs({ date, classId })}`);
  const [edits, setEdits] = useState<Record<string, Status | null>>({});
  const [saving, setSaving] = useState(false);
  const rosterKey = `${date}|${classId}`;
  const [editsKey, setEditsKey] = useState(rosterKey);
  if (editsKey !== rosterKey) {
    // Drop unsaved edits when switching class or date.
    setEditsKey(rosterKey);
    setEdits({});
  }

  const records = useMemo(() => roster.data?.records ?? [], [roster.data]);
  const statusOf = (r: RosterRecord) => (r.studentId in edits ? edits[r.studentId] : r.status);
  const dirty = Object.keys(edits).filter((id) => edits[id] !== records.find((r) => r.studentId === id)?.status);
  const counts = records.reduce(
    (acc, r) => {
      const s = statusOf(r);
      acc[s ?? "unmarked"]++;
      return acc;
    },
    { present: 0, late: 0, absent: 0, unmarked: 0 } as Record<Status | "unmarked", number>,
  );

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api("/api/attendance", {
        method: "PUT",
        body: { date, records: dirty.map((studentId) => ({ studentId, status: edits[studentId] })) },
      });
      toast.success(`Saved ${dirty.length} ${dirty.length === 1 ? "change" : "changes"}`);
      setEdits({});
      roster.reload();
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the roster"));
    } finally {
      setSaving(false);
    }
  };

  const markRemaining = () => {
    const next = { ...edits };
    for (const r of records) if (!statusOf(r)) next[r.studentId] = "present";
    setEdits(next);
  };

  return (
    <>
      <PageHeader
        title="Roster"
        description="Review today’s register, fix mistakes and record late arrivals or absences."
        actions={
          <ButtonLink to="/app/check-in" variant="secondary">
            <ScanFace className="size-4" aria-hidden /> Face check-in
          </ButtonLink>
        }
      />

      <div className="card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="sm:w-72">
          <label htmlFor="roster-class" className="label">
            Class
          </label>
          <Select id="roster-class" value={classId} onChange={(e) => setParam("classId", e.target.value)}>
            <ClassOptions classes={classes.data} />
          </Select>
        </div>
        <div className="sm:w-48">
          <label htmlFor="roster-date" className="label">
            Date
          </label>
          <input
            id="roster-date"
            type="date"
            className="input"
            value={date}
            max={todayISO()}
            onChange={(e) => e.target.value && setParam("date", e.target.value)}
          />
        </div>
        <dl className="flex flex-1 flex-wrap gap-x-5 gap-y-1 text-sm sm:justify-end">
          {(["present", "late", "absent", "unmarked"] as const).map((k) => (
            <div key={k} className="flex items-baseline gap-1.5">
              <dt className="capitalize text-muted">{k}</dt>
              <dd className="tabular font-semibold">{counts[k]}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section className="card" aria-label="Students">
        {roster.error && !roster.data ? (
          <ErrorState message={roster.error.message} onRetry={roster.reload} />
        ) : roster.loading && !roster.data ? (
          <SkeletonRows />
        ) : records.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="size-5" />}
            title="No students in this class"
            action={<ButtonLink to="/app/students">Add students</ButtonLink>}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
              <p className="text-sm text-muted">
                {records.length} students{counts.unmarked > 0 && `, ${counts.unmarked} not marked`}
              </p>
              <Button variant="ghost" size="sm" onClick={markRemaining} disabled={counts.unmarked === 0}>
                <CheckCheck className="size-4" aria-hidden /> Mark remaining present
              </Button>
            </div>
            <ul className="divide-y divide-line">
              {records.map((r) => {
                const current = statusOf(r);
                const changed = dirty.includes(r.studentId);
                return (
                  <li
                    key={r.studentId}
                    className={clsx("flex flex-wrap items-center gap-3 px-4 py-3", changed && "bg-accent-soft/40")}
                  >
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="truncate text-xs text-muted">
                        <span className="font-mono">{r.rollNumber}</span>
                        {!classId && r.className && ` · ${r.className}`}
                        {r.markedAt && !changed && (
                          <>
                            {" "}
                            · {r.method === "face" ? "Face" : "Manual"} at {formatTime(r.markedAt)}
                          </>
                        )}
                      </p>
                    </div>
                    <div role="radiogroup" aria-label={`Status for ${r.name}`} className="flex gap-1">
                      {options.map((o) => {
                        const on = current === o.value;
                        return (
                          <button
                            key={o.value}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            aria-label={o.label}
                            title={on ? `${o.label} (click to clear)` : o.label}
                            onClick={() => setEdits((e) => ({ ...e, [r.studentId]: on ? null : o.value }))}
                            className={clsx(
                              "h-9 min-w-9 rounded border px-2.5 text-sm font-semibold transition-colors sm:min-w-[4.5rem]",
                              on ? o.active : "border-line bg-surface text-muted hover:border-ink/25 hover:text-ink",
                            )}
                          >
                            <span className="sm:hidden">{o.short}</span>
                            <span className="hidden sm:inline">{o.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {dirty.length > 0 && (
        <div className="sticky bottom-4 z-10 mt-4 flex items-center justify-between gap-3 rounded-lg border border-line bg-ink px-4 py-3 text-white shadow-raised">
          <p className="text-sm">
            <span className="tabular font-semibold">{dirty.length}</span> unsaved{" "}
            {dirty.length === 1 ? "change" : "changes"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => setEdits({})}
            >
              Discard
            </Button>
            <Button size="sm" className="bg-accent text-ink hover:bg-accent/90" onClick={save} loading={saving}>
              {!saving && <Save className="size-4" aria-hidden />} Save
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
