export default function StatCard({ label, value, icon: Icon, tone = "ink" }) {
  const tones = {
    ink: "bg-ink-50 text-ink-700",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="card flex items-start justify-between">
      <div>
        <div className="text-sm text-ink-400">{label}</div>
        <div className="font-display text-3xl text-ink-800 mt-1">{value}</div>
      </div>
      {Icon && (
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center ${tones[tone]}`}
        >
          <Icon size={18} />
        </div>
      )}
    </div>
  );
}
