import { useEffect, useState } from "react";
import { X, Plus, ShieldCheck, GraduationCap } from "lucide-react";
import { authApi } from "../api/auth";
import { useToast } from "../context/ToastContext";
import Loader from "../components/Loader";
import { ErrorAlert, EmptyState } from "../components/Alerts";

function initials(name = "") {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

const emptyForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  role: "teacher",
};

// Admin-only screen to create Teacher / Admin accounts (POST /auth/register-staff)
// and see the existing staff list (GET /auth/staff).
// Docs Section 4 ("Admin: manage users") — this was previously backend-only.
export default function ManageStaff() {
  const toast = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    authApi
      .listStaff()
      .then(({ data }) => setStaff(data.data.staff))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load staff"),
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.registerStaff(form);
      toast.success(
        `${form.role === "admin" ? "Admin" : "Teacher"} account created`,
      );
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create account");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="max-w-4xl px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl text-ink-800">Manage Staff</h1>
          <p className="text-sm text-ink-400 mt-0.5">
            {staff.length} staff account{staff.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          className="btn-primary w-full sm:w-auto"
          onClick={() => {
            setForm(emptyForm);
            setShowForm((s) => !s);
          }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "New Staff Account"}
        </button>
      </div>

      <ErrorAlert message={error} />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="card mb-6 grid sm:grid-cols-2 gap-4"
        >
          <div>
            <label className="label">Full name</label>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="teacher@example.com"
            />
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="98765 43210"
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
            >
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Temporary password</label>
            <input
              type="password"
              required
              minLength={6}
              className="input"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="At least 6 characters"
            />
            <p className="text-xs text-ink-400 mt-1.5">
              Share this with the staff member — they can change it later from
              their Profile page.
            </p>
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary" disabled={saving}>
              {saving ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      )}

      {staff.length === 0 ? (
        <div className="card">
          <EmptyState text="No teacher or admin accounts created yet." />
        </div>
      ) : (
        <div className="card divide-y divide-ink-100/60">
          {staff.map((s) => (
            <div key={s._id} className="list-row">
              <div className="flex items-center gap-3 min-w-0">
                <div className="avatar">{initials(s.name)}</div>
                <div className="min-w-0">
                  <div className="font-medium text-ink-800 truncate">
                    {s.name}
                  </div>
                  <div className="text-ink-400 text-xs truncate">
                    {s.email}
                    {s.phone && ` · ${s.phone}`}
                  </div>
                </div>
              </div>
              <span
                className={`badge capitalize flex items-center gap-1 shrink-0 ${
                  s.role === "admin"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-ink-50 text-ink-700"
                }`}
              >
                {s.role === "admin" ? (
                  <ShieldCheck size={12} />
                ) : (
                  <GraduationCap size={12} />
                )}
                {s.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
