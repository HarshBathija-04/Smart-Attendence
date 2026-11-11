import clsx from "clsx";
import { CheckCircle2, ImageUp, Info, ScanFace, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CameraView } from "../components/FaceCapture";
import { Button, PageHeader, Select } from "../components/ui";
import { api, ApiError, useApi } from "../lib/api";
import { formatTime } from "../lib/format";
import type { ClassItem, RecognizeResult } from "../lib/types";
import { fileToDataUrl, useCamera } from "../lib/useCamera";

type LogEntry =
  | { id: number; kind: "ok"; result: RecognizeResult }
  | { id: number; kind: "error"; message: string; at: string };

export default function CheckIn() {
  const classes = useApi<ClassItem[]>("/api/classes");
  const [classId, setClassId] = useState("");
  const { videoRef, state, capture, retry } = useCamera(true);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [flash, setFlash] = useState<"ok" | "error" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);

  const recognize = useCallback(
    async (image: string | null) => {
      if (!image || busy) return;
      setBusy(true);
      const id = nextId.current++;
      try {
        const result = await api<RecognizeResult>("/api/attendance/recognize", {
          method: "POST",
          body: { image, ...(classId ? { classId } : {}) },
        });
        setLog((l) => [{ id, kind: "ok" as const, result }, ...l].slice(0, 20));
        setFlash("ok");
        if (result.alreadyMarked) toast.info(`${result.student.name} was already checked in today`);
        else toast.success(`${result.student.name} checked in`);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Recognition failed, please try again";
        setLog((l) => [{ id, kind: "error" as const, message, at: new Date().toISOString() }, ...l].slice(0, 20));
        setFlash("error");
      } finally {
        setBusy(false);
      }
    },
    [busy, classId],
  );

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1600);
    return () => clearTimeout(t);
  }, [flash]);

  // Space bar triggers a scan, handy at a kiosk.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.code === "Space" && !["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(tag) && state === "ready") {
        e.preventDefault();
        void recognize(capture());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [capture, recognize, state]);

  const latest = log[0];

  return (
    <>
      <PageHeader
        title="Face check-in"
        description="Students look at the camera, you press Check in (or the space bar). Each student is marked once per day."
      />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="card p-4 sm:p-5" aria-label="Camera">
          <CameraView
            videoRef={videoRef}
            state={state}
            onRetry={retry}
            scanning={busy}
            overlay={
              flash && (
                <div
                  className={clsx(
                    "pointer-events-none absolute inset-0 border-4 transition-opacity",
                    flash === "ok" ? "border-present" : "border-absent",
                  )}
                  aria-hidden
                />
              )
            }
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:w-64">
              <label htmlFor="class-filter" className="label">
                Match against
              </label>
              <Select id="class-filter" value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">All classes</option>
                {classes.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-1 gap-2 sm:justify-end">
              <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
                <ImageUp className="size-4" aria-hidden /> Upload photo
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                onClick={() => void recognize(capture())}
                loading={busy}
                disabled={state !== "ready"}
              >
                {!busy && <ScanFace className="size-4" aria-hidden />} {busy ? "Recognising…" : "Check in"}
              </Button>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                await recognize(await fileToDataUrl(file));
              } catch (err) {
                toast.error((err as Error).message);
              }
            }}
          />
        </section>

        <section className="card flex flex-col" aria-labelledby="log-title">
          <div className="border-b border-line px-5 py-4">
            <h2 id="log-title" className="font-semibold">
              This session
            </h2>
          </div>
          <div aria-live="polite" className="sr-only">
            {latest?.kind === "ok"
              ? `${latest.result.student.name} ${latest.result.alreadyMarked ? "was already checked in" : "checked in"}`
              : latest?.message}
          </div>
          {log.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
              <Info className="mb-3 size-6 text-muted" aria-hidden />
              <p className="text-sm text-muted">
                Check-ins will appear here. Only students with an enrolled face can be recognised;{" "}
                <Link to="/app/students" className="font-medium text-brand underline underline-offset-2">
                  enroll faces on the Students page
                </Link>
                .
              </p>
            </div>
          ) : (
            <ul className="max-h-[28rem] divide-y divide-line overflow-y-auto">
              {log.map((entry) =>
                entry.kind === "ok" ? (
                  <li key={entry.id} className="flex items-start gap-3 px-5 py-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-present" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.result.student.name}</p>
                      <p className="text-xs text-muted">
                        <span className="font-mono">{entry.result.student.rollNumber}</span> ·{" "}
                        {entry.result.alreadyMarked ? "Already in today" : `${entry.result.score.toFixed(0)}% match`}
                      </p>
                    </div>
                    <span className="tabular text-xs text-muted">{formatTime(entry.result.student.markedAt)}</span>
                  </li>
                ) : (
                  <li key={entry.id} className="flex items-start gap-3 px-5 py-3">
                    <XCircle className="mt-0.5 size-5 shrink-0 text-absent" aria-hidden />
                    <p className="min-w-0 flex-1 text-sm">{entry.message}</p>
                    <span className="tabular text-xs text-muted">{formatTime(entry.at)}</span>
                  </li>
                ),
              )}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
