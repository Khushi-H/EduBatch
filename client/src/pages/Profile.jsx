import { useEffect, useState } from "react";
import { UserCircle, KeyRound, CalendarCheck } from "lucide-react";
import { profileApi } from "../api/profile";
import { attendanceApi } from "../api/attendance";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { EmptyState } from "../components/Alerts";

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

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone || "",
    avatar: user.avatar || "",
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    if (user.role === "student") {
      attendanceApi
        .my()
        .then(({ data }) => setAttendance(data.data.attendance))
        .catch(() => {});
    }
  }, [user.role]);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await profileApi.update(form);
      updateUser(data.data.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setChangingPw(true);
    try {
      await profileApi.changePassword(pwForm);
      toast.success("Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Password change failed");
    } finally {
      setChangingPw(false);
    }
  }

  return (
    <div className="max-w-2xl px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-ink-800 text-white flex items-center justify-center text-xl font-semibold shrink-0">
          {initials(user.name)}
        </div>
        <div>
          <h1 className="font-display text-2xl text-ink-800">{user.name}</h1>
          <span className="badge bg-amber-50 text-amber-600 capitalize mt-1 inline-block">
            {user.role}
          </span>
        </div>
      </div>

      <div className="card">
        <h2 className="font-display text-lg text-ink-800 mb-3 flex items-center gap-2">
          <UserCircle size={18} className="text-amber-500" /> Account details
        </h2>
        <form onSubmit={handleProfileSubmit} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-ink-50" value={user.email} disabled />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Avatar URL</label>
            <input
              className="input"
              value={form.avatar}
              onChange={(e) =>
                setForm((f) => ({ ...f, avatar: e.target.value }))
              }
            />
          </div>
          <button className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-display text-lg text-ink-800 mb-3 flex items-center gap-2">
          <KeyRound size={18} className="text-amber-500" /> Change password
        </h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label className="label">Current password</label>
            <input
              type="password"
              className="input"
              value={pwForm.currentPassword}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, currentPassword: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              type="password"
              minLength={6}
              className="input"
              value={pwForm.newPassword}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, newPassword: e.target.value }))
              }
              required
            />
          </div>
          <button className="btn-primary" disabled={changingPw}>
            {changingPw ? "Changing..." : "Change password"}
          </button>
        </form>
      </div>

      {user.role === "student" && (
        <div className="card">
          <h2 className="font-display text-lg text-ink-800 mb-3 flex items-center gap-2">
            <CalendarCheck size={18} className="text-amber-500" /> My Attendance
          </h2>
          {attendance.length === 0 ? (
            <EmptyState text="No attendance recorded yet." />
          ) : (
            <div className="divide-y divide-ink-100/60 text-sm">
              {attendance.map((a) => (
                <div key={a.batchId} className="list-row">
                  <span className="font-medium text-ink-700">
                    {a.batchName}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-ink-400">
                      {a.present}/{a.total}
                    </span>
                    <span
                      className={`badge ${
                        a.percentage >= 75
                          ? "bg-green-100 text-green-700"
                          : a.percentage >= 50
                            ? "bg-amber-50 text-amber-600"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      {a.percentage}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
