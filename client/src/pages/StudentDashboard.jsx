import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layers, Clock, ArrowRight, CalendarCheck } from "lucide-react";
import { dashboardApi } from "../api/dashboard";
import { attendanceApi } from "../api/attendance";
import Loader from "../components/Loader";
import StatCard from "../components/StatCard";
import { ErrorAlert, EmptyState } from "../components/Alerts";
import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .student()
      .then(({ data }) => setStats(data.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load dashboard"),
      )
      .finally(() => setLoading(false));

    // Student's own attendance percentage (docs Section 3: "Student can
    // view own attendance percentage") — GET /attendance/my
    attendanceApi
      .my()
      .then(({ data }) => setAttendance(data.data.attendance))
      .catch(() => {});
  }, []);

  const overallAttendance = attendance.length
    ? Math.round(
        (attendance.reduce((sum, a) => sum + a.present, 0) /
          Math.max(
            attendance.reduce((sum, a) => sum + a.total, 0),
            1,
          )) *
          100,
      )
    : null;

  if (loading) return <Loader />;

  return (
    <div className="max-w-6xl px-4 sm:px-6 py-8">
      <div className="relative overflow-hidden rounded-2xl bg-ink-900 text-white px-6 py-8 sm:px-8 sm:py-10 mb-8">
        <div
          className="absolute inset-0 pattern-dots opacity-30"
          aria-hidden="true"
        />
        <div
          className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <p className="text-amber-300 text-sm font-medium mb-1">
            Welcome back
          </p>
          <h1 className="font-display text-2xl sm:text-3xl mb-2">
            {user.name.split(" ")[0]}, here's where you stand.
          </h1>
          <p className="text-ink-100/70 text-sm max-w-lg mb-5">
            Your batches, fees and upcoming classes.
          </p>
          {stats?.pendingFees > 0 && (
            <Link to="/payments" className="btn-amber text-sm inline-flex">
              Pay pending fees
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>

      <ErrorAlert message={error} />

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard
              label="Enrolled Batches"
              value={stats.enrolledBatches}
              icon={Layers}
              tone="ink"
            />
            <StatCard
              label="Pending Fees"
              value={stats.pendingFees}
              icon={Clock}
              tone="red"
            />
            <StatCard
              label="Attendance"
              value={overallAttendance === null ? "—" : `${overallAttendance}%`}
              icon={CalendarCheck}
              tone={
                overallAttendance === null
                  ? "ink"
                  : overallAttendance >= 75
                    ? "green"
                    : overallAttendance >= 50
                      ? "amber"
                      : "red"
              }
            />
          </div>

          {attendance.length > 0 && (
            <div className="card mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg text-ink-800">
                  Attendance by Batch
                </h2>
                <Link
                  to="/profile"
                  className="text-xs text-amber-600 font-medium hover:text-amber-500"
                >
                  View details
                </Link>
              </div>
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
            </div>
          )}

          <h2 className="font-display text-lg text-ink-800 mb-3">
            Upcoming Classes
          </h2>
          {stats.upcomingClasses.length === 0 ? (
            <EmptyState text="No upcoming classes." />
          ) : (
            <div className="grid gap-3">
              {stats.upcomingClasses.map((b) => (
                <Link
                  key={b._id}
                  to={`/batches/${b._id}`}
                  className="card-hover flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium text-ink-800">{b.name}</div>
                    <div className="text-sm text-ink-400">{b.subject}</div>
                  </div>
                  <span className="badge bg-amber-50 text-amber-600 capitalize">
                    {b.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
