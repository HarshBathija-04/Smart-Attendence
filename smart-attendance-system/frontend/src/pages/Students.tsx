import { Plus, ScanFace, Search, Trash2, UserRound, Users } from "lucide-react";
import { useDeferredValue, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { FacePicker } from "../components/FaceCapture";
import {
  Button,
  ClassOptions,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Modal,
  PageHeader,
  Select,
  SkeletonRows,
} from "../components/ui";
import { api, ApiError, errorMessage, qs, useApi } from "../lib/api";
import type { ClassItem, Student } from "../lib/types";

function AddStudentModal({
  open,
  onClose,
  classes,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  classes: ClassItem[];
  onCreated: () => void;
}) {
  const empty = { name: "", rollNumber: "", department: "", classId: "" };
  const [form, setForm] = useState(empty);
  const [image, setImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);

  const close = () => {
    setForm(empty);
    setImage(null);
    setErrors({});
    onClose();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const student = await api<Student>("/api/students", {
        method: "POST",
        body: { ...form, classId: form.classId || null, ...(image ? { image } : {}) },
      });
      toast.success(`${student.name} added${student.faceEnrolled ? " with face enrolled" : ""}`);
      onCreated();
      close();
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      toast.error(errorMessage(err, "Could not add student"));
    } finally {
      setBusy(false);
    }
  };

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    const value = e.target.value;
    setForm((f) => ({
      ...f,
      [k]: value,
      // Default the department from the chosen class.
      ...(k === "classId" && !f.department
        ? { department: classes.find((c) => c.id === value)?.department ?? "" }
        : {}),
    }));
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add student"
      description="Face enrollment is optional and can be added later. Only enroll people who have agreed to it."
      wide
    >
      <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <Field label="Full name" error={errors.name?.[0]}>
            {(p) => (
              <input
                {...p}
                className="input"
                required
                maxLength={120}
                value={form.name}
                onChange={set("name")}
                autoComplete="off"
              />
            )}
          </Field>
          <Field label="Roll number" hint="Unique ID, e.g. MCA24031" error={errors.rollNumber?.[0]}>
            {(p) => (
              <input
                {...p}
                className="input font-mono uppercase"
                required
                maxLength={32}
                value={form.rollNumber}
                onChange={set("rollNumber")}
                autoComplete="off"
              />
            )}
          </Field>
          <Field label="Class">
            {(p) => (
              <Select {...p} value={form.classId} onChange={set("classId")}>
                <ClassOptions classes={classes} empty="No class" />
              </Select>
            )}
          </Field>
          <Field label="Department" error={errors.department?.[0]}>
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
        </div>
        <div>
          <p className="label">Face photo (optional)</p>
          <FacePicker value={image} onChange={setImage} />
        </div>
        <div className="flex justify-end gap-2 md:col-span-2">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {image ? "Add and enroll face" : "Add student"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EnrollModal({
  student,
  onClose,
  onDone,
}: {
  student: Student | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const close = () => {
    setImage(null);
    onClose();
  };
  const submit = async () => {
    if (!student || !image) return;
    setBusy(true);
    try {
      await api(`/api/students/${student.id}/face`, { method: "POST", body: { image } });
      toast.success(`Face enrolled for ${student.name}`);
      onDone();
      close();
    } catch (err) {
      toast.error(errorMessage(err, "Could not enroll the face"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={!!student}
      onClose={close}
      title={student?.faceEnrolled ? `Re-enroll ${student?.name}` : `Enroll ${student?.name ?? ""}`}
      description="Capture one face looking at the camera, in even light. Only enroll people who have agreed to it; the photo is discarded and only a face embedding is stored."
    >
      <FacePicker value={image} onChange={setImage} />
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!image} loading={busy}>
          Save face
        </Button>
      </div>
    </Modal>
  );
}

export default function Students() {
  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const classes = useApi<ClassItem[]>("/api/classes");
  const students = useApi<Student[]>(`/api/students${qs({ classId, search: deferredSearch })}`);
  const [adding, setAdding] = useState(false);
  const [enrolling, setEnrolling] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const remove = async () => {
    if (!deleting) return;
    setBusyDelete(true);
    try {
      await api(`/api/students/${deleting.id}`, { method: "DELETE" });
      toast.success(`${deleting.name} removed`);
      setDeleting(null);
      students.reload();
    } catch (err) {
      toast.error(errorMessage(err, "Could not remove student"));
    } finally {
      setBusyDelete(false);
    }
  };

  const list = students.data ?? [];
  const filtered = !!(classId || deferredSearch);

  return (
    <>
      <PageHeader
        title="Students"
        description="Manage enrollments and face profiles."
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden /> Add student
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search by name or roll number"
            aria-label="Search students"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          aria-label="Filter by class"
          className="sm:w-64"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          <ClassOptions classes={classes.data} />
        </Select>
      </div>

      <section className="card overflow-hidden" aria-label="Student list">
        {students.error && !students.data ? (
          <ErrorState message={students.error.message} onRetry={students.reload} />
        ) : students.loading && !students.data ? (
          <SkeletonRows />
        ) : list.length === 0 ? (
          filtered ? (
            <EmptyState icon={<Search className="size-5" />} title="No matching students">
              Try a different name, roll number or class.
            </EmptyState>
          ) : (
            <EmptyState
              icon={<Users className="size-5" />}
              title="No students yet"
              action={
                <Button onClick={() => setAdding(true)}>
                  <Plus className="size-4" aria-hidden /> Add your first student
                </Button>
              }
            >
              Add students, then enroll their faces so they can check in.
            </EmptyState>
          )
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-sunken/50 text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Student
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">
                  Class
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">
                  Face
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-sunken/40">
                  <td className="max-w-0 px-4 py-3">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted">
                      <span className="font-mono">{s.rollNumber}</span>
                      <span className="md:hidden">{s.classCode && ` · ${s.classCode}`}</span>
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <p className="truncate">{s.className ?? <span className="text-muted">No class</span>}</p>
                    <p className="truncate text-xs text-muted">{s.department}</p>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {s.faceEnrolled ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-present-soft px-2 py-0.5 text-xs font-medium text-present">
                        <ScanFace className="size-3.5" aria-hidden /> Enrolled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-2 py-0.5 text-xs font-medium text-muted">
                        <UserRound className="size-3.5" aria-hidden /> Not enrolled
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Button
                      variant={s.faceEnrolled ? "ghost" : "secondary"}
                      size="sm"
                      onClick={() => setEnrolling(s)}
                      aria-label={`${s.faceEnrolled ? "Re-enroll" : "Enroll"} face for ${s.name}`}
                    >
                      <ScanFace className="size-4" aria-hidden />
                      <span className="hidden sm:inline">{s.faceEnrolled ? "Re-enroll" : "Enroll face"}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 hover:text-absent"
                      onClick={() => setDeleting(s)}
                      aria-label={`Remove ${s.name}`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <AddStudentModal
        open={adding}
        onClose={() => setAdding(false)}
        classes={classes.data ?? []}
        onCreated={students.reload}
      />
      <EnrollModal student={enrolling} onClose={() => setEnrolling(null)} onDone={students.reload} />
      <ConfirmDialog
        open={!!deleting}
        title={`Remove ${deleting?.name ?? "student"}?`}
        body="Their face profile and full attendance history will be deleted. This cannot be undone."
        confirmLabel="Remove student"
        busy={busyDelete}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
