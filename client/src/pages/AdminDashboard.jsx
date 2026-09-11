import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Layers,
  Wallet,
  Clock,
  Plus,
  Megaphone,
  ArrowRight,
  UserCog,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { dashboardApi } from "../api/dashboard";
import Loader from "../components/Loader";
import StatCard from "../components/StatCard";
import { ErrorAlert, EmptyState } from "../components/Alerts";
import { useAuth } from "../context/AuthContext";

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-ink-100 rounded-lg shadow-soft px-3 py-2 text-xs">
      <div className="font-medium text-ink-800 mb-0.5">{label}</div>
      <div className="text-ink-500">
        ₹{payload[0].value.toLocaleString("en-IN")}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .admin()
      .then(({ data }) => setStats(data.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load dashboard"),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome banner */}
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
            {user.name.split(" ")[0]}, here's your institute today.
          </h1>
          <p className="text-ink-100/70 text-sm max-w-lg">
            A quick look at students, batches, revenue and what needs your
            attention.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link to="/batches" className="btn-amber text-sm">
              <Plus size={16} />
              New Batch
            </Link>
            <Link
              to="/notices"
              className="btn text-sm bg-white/10 text-white hover:bg-white/20"
            >
              <Megaphone size={16} />
              Post Notice
            </Link>
          </div>
        </div>
      </div>

      <ErrorAlert message={error} />

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Students"
            value={stats.totalStudents}
            icon={Users}
            tone="ink"
          />
          <StatCard
            label="Active Batches"
            value={stats.activeBatches}
            icon={Layers}
            tone="amber"
          />
          <StatCard
            label="Revenue (₹)"
            value={stats.revenue.toLocaleString("en-IN")}
            icon={Wallet}
            tone="green"
          />
          <StatCard
            label="Pending Fees"
            value={stats.pendingFees}
            icon={Clock}
            tone="red"
          />
        </div>
      )}

      {stats && (
        <div className="card mb-8">
          <h2 className="font-display text-lg text-ink-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-500" /> Revenue — last 6
            months
          </h2>
          {stats.monthlyRevenue?.every((m) => m.revenue === 0) ? (
            <EmptyState text="No revenue recorded yet." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyRevenue}>
                  <CartesianGrid vertical={false} stroke="#e6e8f2" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#5b6394" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#5b6394" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    content={<RevenueTooltip />}
                    cursor={{ fill: "#f5f6fb" }}
                  />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/batches"
          className="card-hover flex items-center justify-between group"
        >
          <div>
            <div className="font-display text-lg text-ink-800 mb-1">
              Manage Batches
            </div>
            <p className="text-sm text-ink-400">
              Create, edit and track capacity across all batches.
            </p>
          </div>
          <ArrowRight
            size={18}
            className="text-ink-300 group-hover:text-amber-500 transition shrink-0 ml-3"
          />
        </Link>
        <Link
          to="/admin/staff"
          className="card-hover flex items-center justify-between group"
        >
          <div>
            <div className="font-display text-lg text-ink-800 mb-1 flex items-center gap-2">
              <UserCog size={16} className="text-amber-500" /> Manage Staff
            </div>
            <p className="text-sm text-ink-400">
              Create teacher and admin accounts for your institute.
            </p>
          </div>
          <ArrowRight
            size={18}
            className="text-ink-300 group-hover:text-amber-500 transition shrink-0 ml-3"
          />
        </Link>
        <Link
          to="/notices"
          className="card-hover flex items-center justify-between group sm:col-span-2"
        >
          <div>
            <div className="font-display text-lg text-ink-800 mb-1">
              Notices
            </div>
            <p className="text-sm text-ink-400">
              Post announcements to a batch or the whole institute.
            </p>
          </div>
          <ArrowRight
            size={18}
            className="text-ink-300 group-hover:text-amber-500 transition shrink-0 ml-3"
          />
        </Link>
      </div>
    </div>
  );
}
