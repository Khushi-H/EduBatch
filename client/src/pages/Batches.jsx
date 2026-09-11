import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Plus, Layers, Users as UsersIcon, IndianRupee } from "lucide-react";
import { batchApi } from "../api/batches";
import { authApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Loader from "../components/Loader";
import ConfirmModal from "../components/ConfirmModal";
import { ErrorAlert, EmptyState } from "../components/Alerts";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const emptyForm = {
  name: "",
  subject: "",
  description: "",
  startDate: "",
  endDate: "",
  capacity: 30,
  fee: 0,
  teacher: "",
  scheduleDays: [],
  scheduleStartTime: "",
  scheduleEndTime: "",
};

export default function Batches() {
  const { user } = useAuth();
  const toast = useToast();
  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);

  function load() {
    setLoading(true);
    const calls = [batchApi.list()];
    if (user.role === "admin") calls.push(authApi.listTeachers());
    Promise.all(calls)
      .then(([batchRes, teacherRes]) => {
        setBatches(batchRes.data.data.batches);
        if (teacherRes) setTeachers(teacherRes.data.data.teachers);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load batches"),
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleDay(day) {
    setForm((f) => ({
      ...f,
      scheduleDays: f.scheduleDays.includes(day)
        ? f.scheduleDays.filter((d) => d !== day)
        : [...f.scheduleDays, day],
    }));
  }

  function startEdit(batch) {
    setEditingId(batch._id);
    setForm({
      name: batch.name,
      subject: batch.subject,
      description: batch.description || "",
      startDate: batch.startDate?.slice(0, 10) || "",
      endDate: batch.endDate?.slice(0, 10) || "",
      capacity: batch.capacity,
      fee: batch.fee,
      teacher: batch.teacher?._id || batch.teacher || "",
      scheduleDays: batch.schedule?.days || [],
      scheduleStartTime: batch.schedule?.startTime || "",
      scheduleEndTime: batch.schedule?.endTime || "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const { scheduleDays, scheduleStartTime, scheduleEndTime, ...rest } = form;
    const payload = {
      ...rest,
      teacher: form.teacher || null,
      schedule: {
        days: scheduleDays,
        startTime: scheduleStartTime,
        endTime: scheduleEndTime,
      },
    };
    try {
      if (editingId) {
        await batchApi.update(editingId, payload);
        toast.success("Batch updated successfully");
      } else {
        await batchApi.create(payload);
        toast.success("Batch created successfully");
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save batch");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await batchApi.changeStatus(id, status);
      toast.success(`Batch marked as ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  }

  async function handleArchiveConfirmed() {
    const id = archiveTarget;
    setArchiveTarget(null);
    try {
      await batchApi.archive(id);
      toast.success("Batch archived");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to archive batch");
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl text-ink-800">
            {user.role === "teacher" ? "My Batches" : "Batches"}
          </h1>
          <p className="text-sm text-ink-400 mt-0.5">
            {batches.length} batch{batches.length !== 1 ? "es" : ""}
          </p>
        </div>
        {user.role === "admin" && (
          <button
            className="btn-primary w-full sm:w-auto"
            onClick={() => {
              setForm(emptyForm);
              setEditingId(null);
              setShowForm((s) => !s);
            }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Cancel" : "New Batch"}
          </button>
        )}
      </div>

      <ErrorAlert message={error} />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="card mb-6 grid sm:grid-cols-2 gap-4"
        >
          <div>
            <label className="label">Name</label>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Subject</label>
            <input
              required
              className="input"
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea
              className="input"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              required
              className="input"
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              required
              className="input"
              value={form.endDate}
              onChange={(e) => update("endDate", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Capacity</label>
            <input
              type="number"
              min={1}
              required
              className="input"
              value={form.capacity}
              onChange={(e) => update("capacity", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Fee (₹)</label>
            <input
              type="number"
              min={0}
              required
              className="input"
              value={form.fee}
              onChange={(e) => update("fee", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Schedule — Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    form.scheduleDays.includes(day)
                      ? "bg-amber-400 border-amber-400 text-ink-900"
                      : "bg-white border-ink-100 text-ink-500 hover:border-ink-400/40"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Class Start Time</label>
            <input
              type="time"
              className="input"
              value={form.scheduleStartTime}
              onChange={(e) => update("scheduleStartTime", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Class End Time</label>
            <input
              type="time"
              className="input"
              value={form.scheduleEndTime}
              onChange={(e) => update("scheduleEndTime", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Assign Teacher</label>
            <select
              className="input"
              value={form.teacher}
              onChange={(e) => update("teacher", e.target.value)}
            >
              <option value="">-- No teacher assigned yet --</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
            {teachers.length === 0 && (
              <p className="text-xs text-ink-400 mt-1.5">
                No teacher accounts found yet — create one via the seed script
                or /auth/register-staff.
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Batch"
                  : "Create Batch"}
            </button>
          </div>
        </form>
      )}

      {batches.length === 0 ? (
        <div className="card">
          <EmptyState text="No batches found." />
        </div>
      ) : (
        <div className="grid gap-3">
          {batches.map((b) => (
            <div
              key={b._id}
              className="card-hover flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-ink-50 text-ink-700 flex items-center justify-center">
                  <Layers size={18} />
                </div>
                <div>
                  <Link
                    to={`/batches/${b._id}`}
                    className="font-medium text-ink-800 hover:text-amber-600"
                  >
                    {b.name}
                  </Link>
                  <div className="text-sm text-ink-400 flex flex-wrap items-center gap-x-3 mt-0.5">
                    <span>{b.subject}</span>
                    <span className="flex items-center gap-1">
                      <IndianRupee size={12} /> {b.fee}
                    </span>
                    <span className="flex items-center gap-1">
                      <UsersIcon size={12} /> {b.capacity} seats
                    </span>
                    {b.schedule?.days?.length > 0 && (
                      <span>
                        {b.schedule.days.join("/")}
                        {b.schedule.startTime &&
                          ` · ${b.schedule.startTime}–${b.schedule.endTime}`}
                      </span>
                    )}
                    {b.teacher && <span>· {b.teacher.name}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge bg-amber-50 text-amber-600 capitalize">
                  {b.status}
                </span>
                {user.role === "admin" && (
                  <>
                    <select
                      className="input !w-auto text-xs py-1.5"
                      value={b.status}
                      onChange={(e) =>
                        handleStatusChange(b._id, e.target.value)
                      }
                    >
                      <option value="upcoming">upcoming</option>
                      <option value="active">active</option>
                      <option value="archived">archived</option>
                    </select>
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => startEdit(b)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger text-xs"
                      onClick={() => setArchiveTarget(b._id)}
                    >
                      Archive
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!archiveTarget}
        title="Archive this batch?"
        message="Archived batches are hidden from active listings but their data is kept. This can be changed back later from the status dropdown."
        confirmLabel="Archive"
        variant="danger"
        onConfirm={handleArchiveConfirmed}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
