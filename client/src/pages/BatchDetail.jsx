import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  UserPlus,
  CalendarCheck,
  Megaphone,
  Users as UsersIcon,
  IndianRupee,
  Clock,
  CalendarRange,
} from "lucide-react";
import { batchApi } from "../api/batches";
import { enrollmentApi } from "../api/enrollments";
import { attendanceApi } from "../api/attendance";
import { noticeApi } from "../api/notices";
import { authApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Loader from "../components/Loader";
import ConfirmModal from "../components/ConfirmModal";
import SearchableSelect from "../components/SearchableSelect";
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

const TABS = [
  { key: "students", label: "Students", icon: UsersIcon },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
  { key: "notices", label: "Notices", icon: Megaphone },
];

export default function BatchDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [batch, setBatch] = useState(null);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [enrollments, setEnrollments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const [activeTab, setActiveTab] = useState("students");

  const [allStudents, setAllStudents] = useState([]);
  const [studentIdToEnroll, setStudentIdToEnroll] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attMap, setAttMap] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: "", body: "" });
  const [postingNotice, setPostingNotice] = useState(false);

  // Admin can manage every batch; a teacher can only manage the batch(es)
  // assigned to them (docs Section 2.1: "Admin / Teacher can enroll or
  // remove students from batches").
  const canManage = user.role === "admin" || user.role === "teacher";
  const canEnroll =
    user.role === "admin" ||
    (user.role === "teacher" &&
      batch &&
      String(batch.teacher?._id || batch.teacher) === String(user._id));

  function loadAll() {
    setLoading(true);
    setError("");
    const calls = [batchApi.get(id), noticeApi.list(id)];
    if (canManage) {
      calls.push(enrollmentApi.ofBatch(id));
      calls.push(attendanceApi.ofBatch(id));
      calls.push(authApi.listStudents());
    }
    Promise.all(calls)
      .then(([batchRes, noticeRes, enrollRes, attRes, studentRes]) => {
        setBatch(batchRes.data.data.batch);
        setEnrolledCount(batchRes.data.data.enrolledCount);
        setNotices(noticeRes.data.data.notices);
        if (enrollRes) {
          setEnrollments(enrollRes.data.data.enrollments);
          const initMap = {};
          enrollRes.data.data.enrollments.forEach((e) => {
            initMap[e.student._id] = "present";
          });
          setAttMap(initMap);
        }
        if (attRes) setAttendanceRecords(attRes.data.data.records);
        if (studentRes) setAllStudents(studentRes.data.data.students);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load batch"),
      )
      .finally(() => setLoading(false));
  }

  useEffect(loadAll, [id]);

  async function handleEnroll(e) {
    e.preventDefault();
    if (!studentIdToEnroll) return;
    setEnrolling(true);
    try {
      await enrollmentApi.enroll(studentIdToEnroll, id);
      toast.success("Student enrolled successfully");
      setStudentIdToEnroll("");
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to enroll student");
    } finally {
      setEnrolling(false);
    }
  }

  const enrolledStudentIds = new Set(enrollments.map((e) => e.student._id));
  const enrollableOptions = allStudents
    .filter((s) => !enrolledStudentIds.has(s._id))
    .map((s) => ({ value: s._id, label: s.name, sublabel: s.email }));

  async function handleRemoveConfirmed() {
    const enrollmentId = removeTarget;
    setRemoveTarget(null);
    try {
      await enrollmentApi.remove(enrollmentId);
      toast.success("Enrollment removed");
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove enrollment");
    }
  }

  async function handleMarkAttendance(e) {
    e.preventDefault();
    setSavingAttendance(true);
    try {
      const records = Object.entries(attMap).map(([student, status]) => ({
        student,
        status,
      }));
      await attendanceApi.mark({ batchId: id, date: attDate, records });
      toast.success("Attendance saved");
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSavingAttendance(false);
    }
  }

  async function handleCreateNotice(e) {
    e.preventDefault();
    setPostingNotice(true);
    try {
      await noticeApi.create({ batchId: id, ...noticeForm });
      setNoticeForm({ title: "", body: "" });
      toast.success("Notice posted");
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post notice");
    } finally {
      setPostingNotice(false);
    }
  }

  if (loading) return <Loader />;
  if (!batch)
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <ErrorAlert message="Batch not found" />
      </div>
    );

  return (
    <div className="max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      <ErrorAlert message={error} />

      {/* Batch summary header */}
      <div className="relative overflow-hidden rounded-2xl bg-ink-900 text-white px-6 py-7 sm:px-8">
        <div
          className="absolute inset-0 pattern-dots opacity-30"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="badge bg-amber-400 text-ink-900 capitalize">
              {batch.status}
            </span>
            <span className="text-ink-100/60 text-sm">{batch.subject}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl mb-2">
            {batch.name}
          </h1>
          {batch.description && (
            <p className="text-ink-100/70 text-sm max-w-xl mb-4">
              {batch.description}
            </p>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-100/80">
            <span className="flex items-center gap-1.5">
              <IndianRupee size={14} /> Fee: ₹{batch.fee}
            </span>
            <span className="flex items-center gap-1.5">
              <UsersIcon size={14} /> {enrolledCount}/{batch.capacity} enrolled
            </span>
            {batch.teacher && (
              <span className="flex items-center gap-1.5">
                Teacher: {batch.teacher.name}
              </span>
            )}
            {batch.schedule?.days?.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {batch.schedule.days.join("/")}
                {batch.schedule.startTime &&
                  ` · ${batch.schedule.startTime}–${batch.schedule.endTime}`}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <CalendarRange size={14} />
              {new Date(batch.startDate).toLocaleDateString()} –{" "}
              {new Date(batch.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {canManage ? (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 bg-white rounded-2xl border border-ink-100/60 shadow-card p-1.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              const count =
                tab.key === "students"
                  ? enrollments.length
                  : tab.key === "notices"
                    ? notices.length
                    : null;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium transition ${
                    active
                      ? "bg-ink-900 text-white shadow-soft"
                      : "text-ink-500 hover:bg-ink-50"
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{tab.label}</span>
                  {count !== null && (
                    <span
                      className={`hidden sm:inline-block text-xs rounded-full px-1.5 shrink-0 ${
                        active
                          ? "bg-white/15 text-white"
                          : "bg-ink-50 text-ink-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeTab === "students" && (
            <div className="space-y-6">
              {canEnroll && (
                <div className="card">
                  <h2 className="font-display text-lg text-ink-800 mb-3 flex items-center gap-2">
                    <UserPlus size={18} className="text-amber-500" /> Enroll
                    Student
                  </h2>
                  <form
                    onSubmit={handleEnroll}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <div className="flex-1">
                      <SearchableSelect
                        options={enrollableOptions}
                        value={studentIdToEnroll}
                        onChange={setStudentIdToEnroll}
                        placeholder="Search students by name or email..."
                        emptyText={
                          allStudents.length === 0
                            ? "No student accounts found yet."
                            : "No matching students."
                        }
                      />
                    </div>
                    <button
                      className="btn-primary whitespace-nowrap"
                      disabled={enrolling || !studentIdToEnroll}
                    >
                      {enrolling ? "Enrolling..." : "Enroll"}
                    </button>
                  </form>
                  <p className="text-xs text-ink-400 mt-2">
                    {enrollableOptions.length} student
                    {enrollableOptions.length !== 1 ? "s" : ""} available to
                    enroll.
                  </p>
                </div>
              )}

              <div className="card">
                <h2 className="font-display text-lg text-ink-800 mb-3">
                  Enrolled Students ({enrollments.length})
                </h2>
                {enrollments.length === 0 ? (
                  <EmptyState text="No students enrolled yet." />
                ) : (
                  <div className="divide-y divide-ink-100/60">
                    {enrollments.map((e) => (
                      <div key={e._id} className="list-row">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="avatar">
                            {initials(e.student.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-ink-800 truncate">
                              {e.student.name}
                            </div>
                            <div className="text-ink-400 text-xs truncate">
                              {e.student.email} · enrolled{" "}
                              {new Date(e.enrolledAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`badge capitalize ${
                              e.paymentStatus === "paid"
                                ? "bg-green-100 text-green-700"
                                : e.paymentStatus === "waived"
                                  ? "bg-gray-100 text-ink-500"
                                  : "bg-red-50 text-red-600"
                            }`}
                          >
                            {e.paymentStatus}
                          </span>
                          {canEnroll && (
                            <button
                              className="btn-danger text-xs"
                              onClick={() => setRemoveTarget(e._id)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-6">
              {enrollments.length > 0 && (
                <div className="card">
                  <h2 className="font-display text-lg text-ink-800 mb-3 flex items-center gap-2">
                    <CalendarCheck size={18} className="text-amber-500" /> Mark
                    Attendance
                  </h2>
                  <form onSubmit={handleMarkAttendance} className="space-y-3">
                    <input
                      type="date"
                      className="input !w-auto"
                      value={attDate}
                      onChange={(e) => setAttDate(e.target.value)}
                    />
                    <div className="divide-y divide-ink-100/60">
                      {enrollments.map((e) => (
                        <div key={e.student._id} className="list-row">
                          <span className="flex items-center gap-3">
                            <div className="avatar !h-7 !w-7 !text-[10px]">
                              {initials(e.student.name)}
                            </div>
                            {e.student.name}
                          </span>
                          <select
                            className="input !w-auto text-xs py-1.5"
                            value={attMap[e.student._id] || "present"}
                            onChange={(ev) =>
                              setAttMap((m) => ({
                                ...m,
                                [e.student._id]: ev.target.value,
                              }))
                            }
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                          </select>
                        </div>
                      ))}
                    </div>
                    <button className="btn-primary" disabled={savingAttendance}>
                      {savingAttendance ? "Saving..." : "Save Attendance"}
                    </button>
                  </form>
                </div>
              )}

              <div className="card">
                <h2 className="font-display text-lg text-ink-800 mb-3">
                  Attendance History
                </h2>
                {attendanceRecords.length === 0 ? (
                  <EmptyState text="No attendance recorded yet." />
                ) : (
                  <div className="space-y-2 text-sm">
                    {attendanceRecords.map((r) => (
                      <div
                        key={r._id}
                        className="border border-ink-100 rounded-xl p-3"
                      >
                        <div className="font-medium text-ink-800 mb-2">
                          {new Date(r.date).toLocaleDateString()}
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {r.records.map((rec, idx) => (
                            <span
                              key={idx}
                              className={`badge ${
                                rec.status === "present"
                                  ? "bg-green-50 text-green-700"
                                  : rec.status === "late"
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-red-50 text-red-600"
                              }`}
                            >
                              {rec.student?.name || "Student"}: {rec.status}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "notices" && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="font-display text-lg text-ink-800 mb-3 flex items-center gap-2">
                  <Megaphone size={18} className="text-amber-500" /> Post Notice
                  for this Batch
                </h2>
                <form onSubmit={handleCreateNotice} className="space-y-3">
                  <input
                    className="input"
                    placeholder="Title"
                    required
                    value={noticeForm.title}
                    onChange={(e) =>
                      setNoticeForm((f) => ({ ...f, title: e.target.value }))
                    }
                  />
                  <textarea
                    className="input"
                    placeholder="Notice body"
                    required
                    value={noticeForm.body}
                    onChange={(e) =>
                      setNoticeForm((f) => ({ ...f, body: e.target.value }))
                    }
                  />
                  <button className="btn-primary" disabled={postingNotice}>
                    {postingNotice ? "Posting..." : "Post Notice"}
                  </button>
                </form>
              </div>

              <div className="card">
                <h2 className="font-display text-lg text-ink-800 mb-3">
                  Notices
                </h2>
                {notices.length === 0 ? (
                  <EmptyState text="No notices for this batch yet." />
                ) : (
                  <div className="space-y-3">
                    {notices.map((n) => (
                      <div
                        key={n._id}
                        className="border border-ink-100 rounded-xl p-4"
                      >
                        <div className="font-medium text-ink-800">
                          {n.title}
                        </div>
                        <div className="text-sm text-ink-500 mt-1">
                          {n.body}
                        </div>
                        <div className="text-xs text-ink-400 mt-2">
                          by {n.createdBy?.name} ·{" "}
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        // Students just see the notices for this batch, no management tabs.
        <div className="card">
          <h2 className="font-display text-lg text-ink-800 mb-3 flex items-center gap-2">
            <Megaphone size={18} className="text-amber-500" /> Notices
          </h2>
          {notices.length === 0 ? (
            <EmptyState text="No notices for this batch yet." />
          ) : (
            <div className="space-y-3">
              {notices.map((n) => (
                <div
                  key={n._id}
                  className="border border-ink-100 rounded-xl p-4"
                >
                  <div className="font-medium text-ink-800">{n.title}</div>
                  <div className="text-sm text-ink-500 mt-1">{n.body}</div>
                  <div className="text-xs text-ink-400 mt-2">
                    by {n.createdBy?.name} ·{" "}
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={!!removeTarget}
        title="Remove this enrollment?"
        message="The student will lose access to this batch's classes, attendance and notices. This can be re-enrolled later if needed."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleRemoveConfirmed}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
