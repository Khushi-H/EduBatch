import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layers, Users, ArrowRight } from "lucide-react";
import { dashboardApi } from "../api/dashboard";
import Loader from "../components/Loader";
import StatCard from "../components/StatCard";
import { ErrorAlert, EmptyState } from "../components/Alerts";
import { useAuth } from "../context/AuthContext";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .teacher()
      .then(({ data }) => setStats(data.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load dashboard"),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
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
            {user.name.split(" ")[0]}, ready for today's classes?
          </h1>
          <p className="text-ink-100/70 text-sm max-w-lg">
            Your batches, students and attendance, all in one place.
          </p>
        </div>
      </div>

      <ErrorAlert message={error} />

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <StatCard
              label="My Batches"
              value={stats.totalBatches}
              icon={Layers}
              tone="amber"
            />
            <StatCard
              label="Total Students"
              value={stats.totalStudents}
              icon={Users}
              tone="ink"
            />
          </div>

          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-ink-800">
              Upcoming / Active Classes
            </h2>
            <Link
              to="/batches"
              className="text-sm text-amber-600 hover:text-amber-500 flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
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
