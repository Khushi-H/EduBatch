import { useState } from "react";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";
import { authApi } from "../api/auth";
import { ErrorAlert, SuccessAlert } from "../components/Alerts";
import AuthLayout from "../components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await authApi.forgotPassword({ email });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="We'll send a reset link to your email (or log it to the server console in dev mode)"
    >
      <ErrorAlert message={error} />
      <SuccessAlert message={message} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          <Send size={16} />
          {loading ? "Sending..." : "Send reset link"}
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
