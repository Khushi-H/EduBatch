import { useEffect, useState } from "react";
import { Wallet, Receipt, Download } from "lucide-react";
import { enrollmentApi } from "../api/enrollments";
import { paymentApi } from "../api/payments";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Loader from "../components/Loader";
import { ErrorAlert, EmptyState } from "../components/Alerts";

export default function Payments() {
  const { user } = useAuth();
  const toast = useToast();
  const [enrollments, setEnrollments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  function load() {
    setLoading(true);
    const calls = [paymentApi.history()];
    if (user.role === "student") calls.push(enrollmentApi.my());
    Promise.all(calls)
      .then(([histRes, enrollRes]) => {
        setHistory(histRes.data.data.payments);
        if (enrollRes) setEnrollments(enrollRes.data.data.enrollments);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load payments"),
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handlePay(enrollment) {
    setPayingId(enrollment._id);
    try {
      const { data } = await paymentApi.createOrder(enrollment._id);
      const { orderId, amount, currency, keyId } = data.data;

      if (!window.Razorpay) {
        toast.error(
          "Razorpay checkout script did not load. Check your internet connection.",
        );
        setPayingId(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "EduBatch",
        description: `Fee for ${enrollment.batch.name}`,
        handler: async function (response) {
          try {
            await paymentApi.verify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              enrollmentId: enrollment._id,
            });
            toast.success("Payment successful! Enrollment marked as paid.");
            load();
          } catch (err) {
            toast.error(
              err.response?.data?.message || "Payment verification failed",
            );
          } finally {
            setPayingId(null);
          }
        },
        modal: {
          ondismiss: () => setPayingId(null),
        },
        theme: { color: "#1b2559" },
      });
      rzp.on("payment.failed", () => {
        toast.error("Payment failed or was cancelled. Please try again.");
        setPayingId(null);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start payment");
      setPayingId(null);
    }
  }

  async function handleDownloadReceipt(payment) {
    setDownloadingId(payment._id);
    try {
      const response = await paymentApi.receipt(payment._id);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `EduBatch-Receipt-${payment._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download receipt. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink-800">Payments</h1>
        <p className="text-sm text-ink-400 mt-0.5">
          Fees, receipts and payment history.
        </p>
      </div>
      <ErrorAlert message={error} />

      {user.role === "student" && (
        <div className="card">
          <h2 className="font-display text-lg text-ink-800 mb-3 flex items-center gap-2">
            <Wallet size={18} className="text-amber-500" /> My Enrollments
          </h2>
          {enrollments.length === 0 ? (
            <EmptyState text="You are not enrolled in any batch yet." />
          ) : (
            <div className="divide-y divide-ink-100/60">
              {enrollments.map((e) => (
                <div key={e._id} className="list-row">
                  <div>
                    <div className="font-medium text-ink-800">
                      {e.batch.name}
                    </div>
                    <div className="text-sm text-ink-400">
                      Fee: ₹{e.batch.fee}
                    </div>
                  </div>
                  {e.paymentStatus === "paid" ? (
                    <span className="badge bg-green-100 text-green-700">
                      Paid
                    </span>
                  ) : e.paymentStatus === "waived" ? (
                    <span className="badge bg-gray-100 text-ink-500">
                      Waived
                    </span>
                  ) : (
                    <button
                      className="btn-amber text-sm"
                      onClick={() => handlePay(e)}
                      disabled={payingId === e._id}
                    >
                      {payingId === e._id ? "Processing..." : "Pay Now"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="font-display text-lg text-ink-800 mb-3 flex items-center gap-2">
          <Receipt size={18} className="text-amber-500" /> Payment History
        </h2>
        {history.length === 0 ? (
          <EmptyState text="No payment records yet." />
        ) : (
          <div className="divide-y divide-ink-100/60 text-sm">
            {history.map((p) => (
              <div key={p._id} className="list-row">
                <div>
                  <div className="font-medium text-ink-800">
                    {p.enrollment?.batch?.name || "Batch"}
                  </div>
                  <div className="text-ink-400">
                    {p.student?.name} · ₹
                    {(p.amount / 100).toLocaleString("en-IN")} ·{" "}
                    {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`badge ${
                      p.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : p.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-ink-500"
                    }`}
                  >
                    {p.status}
                  </span>
                  {p.status === "paid" && (
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => handleDownloadReceipt(p)}
                      disabled={downloadingId === p._id}
                    >
                      <Download size={13} />
                      {downloadingId === p._id ? "Downloading..." : "Receipt"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
