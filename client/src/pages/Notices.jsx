import { useEffect, useState } from "react";
import { Megaphone, Pin } from "lucide-react";
import { noticeApi } from "../api/notices";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Loader from "../components/Loader";
import { ErrorAlert, EmptyState } from "../components/Alerts";

export default function Notices() {
  const { user } = useAuth();
  const toast = useToast();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", body: "" });
  const [posting, setPosting] = useState(false);

  function load() {
    setLoading(true);
    noticeApi
      .list()
      .then(({ data }) => setNotices(data.data.notices))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load notices"),
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setPosting(true);
    try {
      await noticeApi.create({ ...form, batchId: null });
      setForm({ title: "", body: "" });
      toast.success("Global notice posted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post notice");
    } finally {
      setPosting(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink-800">Notices</h1>
        <p className="text-sm text-ink-400 mt-0.5">
          Announcements from your institute and batches.
        </p>
      </div>
      <ErrorAlert message={error} />

      {user.role === "admin" && (
        <div className="card">
          <h2 className="font-display text-lg text-ink-800 mb-3 flex items-center gap-2">
            <Megaphone size={18} className="text-amber-500" /> Post Global
            Notice
          </h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              className="input"
              placeholder="Title"
              required
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
            <textarea
              className="input"
              placeholder="Notice body"
              required
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            />
            <button className="btn-primary" disabled={posting}>
              {posting ? "Posting..." : "Post Notice"}
            </button>
          </form>
          <p className="text-xs text-ink-400 mt-2">
            To post a batch-specific notice, open that batch's detail page
            instead.
          </p>
        </div>
      )}

      {notices.length === 0 ? (
        <div className="card">
          <EmptyState text="No notices yet." />
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div key={n._id} className="card">
              <div className="flex justify-between items-start gap-3">
                <div className="font-medium text-ink-800">{n.title}</div>
                {n.pinned && (
                  <span className="badge bg-amber-50 text-amber-600 flex items-center gap-1 shrink-0">
                    <Pin size={11} /> Pinned
                  </span>
                )}
              </div>
              <div className="text-sm text-ink-500 mt-1.5">{n.body}</div>
              <div className="text-xs text-ink-400 mt-3 flex items-center gap-2">
                <span className="badge bg-ink-50 text-ink-500">
                  {n.batch ? n.batch.name : "Global"}
                </span>
                by {n.createdBy?.name} ·{" "}
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
