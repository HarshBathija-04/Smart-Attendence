import { ClipboardList, GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Meter,
  Modal,
  PageHeader,
  Skeleton,
} from "../components/ui";
import { api, ApiError, useApi } from "../lib/api";
import type { ClassItem } from "../lib/types";

type Draft = { id?: string; code: string; name: string; department: string };

function ClassForm({ draft, onClose, onSaved }: { draft: Draft | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Draft>(draft ?? { code: "", name: "", department: "" });
  const [busy, setBusy] = useState(false);
  const [formKey, setFormKey] = useState(draft);
  if (formKey !== draft) {
    // Reset the form whenever a different class is opened.
    setFormKey(draft);
    setForm(draft ?? { code: "", name: "", department: "" });
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { code: form.code, name: form.name, department: form.department };
      await api(form.id ? `/api/classes/${form.id}` : "/api/classes", { method: form.id ? "PATCH" : "POST", body });
      toast.success(form.id ? "Class updated" : `Class ${form.code.toUpperCase()} created`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.status === 409
            ? "A class with that code already exists"
            : err.message
          : "Could not save class",
      );
    } finally {
      setBusy(false);
    }
  };

  const set = (k: keyof Draft) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Modal open={!!draft} onClose={onClose} title={form.id ? "Edit class" : "New class"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Code" hint="Short unique code, e.g. MCA-1A">
          {(p) => (
            <input
              {...p}
              className="input font-mono uppercase"
              required
              maxLength={20}
              value={form.code}
              onChange={set("code")}
            />
          )}
        </Field>
        <Field label="Name">
          {(p) => <input {...p} className="input" required maxLength={120} value={form.name} onChange={set("name")} />}
        </Field>
        <Field label="Department">
          {(p) => (
            <input
              {...p}
              className="input"
              required
              maxLength={120}
              value={form.department}
              onChange={set("department")}
            />
          )}
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {form.id ? "Save changes" : "Create class"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Classes() {
  const { data, error, loading, reload } = useApi<ClassItem[]>("/api/classes");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<ClassItem | null>(null);
  const [busy, setBusy] = useState(false);
  const newClass = () => setDraft({ code: "", name: "", department: "" });

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/classes/${deleting.id}`, { method: "DELETE" });
      toast.success(`${deleting.code} deleted`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete class");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Classes"
        description="Group students into sections to take and report attendance per class."
        actions={
          <Button onClick={newClass}>
            <Plus className="size-4" aria-hidden /> New class
          </Button>
        }
      />

      {error && !data ? (
        <div className="card">
          <ErrorState message={error.message} onRetry={reload} />
        </div>
      ) : loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : !data?.length ? (
        <div className="card">
          <EmptyState
            icon={<GraduationCap className="size-5" />}
            title="No classes yet"
            action={
              <Button onClick={newClass}>
                <Plus className="size-4" aria-hidden /> Create a class
              </Button>
            }
          >
            Classes let you run check-in and reports for one section at a time.
          </EmptyState>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => {
            const pct = c.studentCount ? Math.round((c.attendedToday / c.studentCount) * 100) : 0;
            return (
              <li key={c.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-medium text-accent-ink">{c.code}</p>
                    <h2 className="mt-1 font-display text-lg font-semibold leading-snug">{c.name}</h2>
                    <p className="mt-0.5 truncate text-sm text-muted">{c.department}</p>
                  </div>
                  <div className="flex shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      aria-label={`Edit ${c.code}`}
                      onClick={() => setDraft(c)}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 hover:text-absent"
                      aria-label={`Delete ${c.code}`}
                      onClick={() => setDeleting(c)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Students</dt>
                    <dd className="tabular font-semibold">{c.studentCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Faces</dt>
                    <dd className="tabular font-semibold">{c.enrolledCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">In today</dt>
                    <dd className="tabular font-semibold">{c.attendedToday}</dd>
                  </div>
                </dl>
                <div className="mt-3">
                  <Meter value={pct} tone="auto" />
                </div>
                <Link
                  to={`/app/roster?classId=${c.id}`}
                  className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded border border-line text-sm font-medium hover:border-ink/25 hover:bg-sunken/60"
                >
                  <ClipboardList className="size-4" aria-hidden /> Open roster
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <ClassForm draft={draft} onClose={() => setDraft(null)} onSaved={reload} />
      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${deleting?.code ?? "class"}?`}
        body="Students stay enrolled but will no longer belong to a class. Attendance history is kept."
        confirmLabel="Delete class"
        busy={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
