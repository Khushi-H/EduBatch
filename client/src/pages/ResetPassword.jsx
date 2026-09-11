import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { authApi } from "../api/auth";
import { ErrorAlert, SuccessAlert } from "../components/Alerts";
import AuthLayout from "../components/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.resetPassword({ token, password });
      setMessage(data.message);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Reset password" subtitle="Enter your new password below">
      <ErrorAlert message={error} />
      <SuccessAlert message={message} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Reset token</label>
          <input
            className="input"
            value={token}
            readOnly
            placeholder="Paste from email/console"
          />
        </div>
        <div>
          <label className="label">New password</label>
          <input
            type="password"
            required
            minLength={6}
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          <KeyRound size={16} />
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center">
        <Link
          to="/login"
          className="text-amber-600 font-medium hover:text-amber-500"
        >
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
