import { X } from "lucide-react";

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmClasses =
    variant === "danger"
      ? "btn bg-red-500 text-white hover:bg-red-600 shadow-soft"
      : "btn-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-ink-400 hover:text-ink-700"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <h3 className="font-display text-lg text-ink-800 mb-2 pr-6">{title}</h3>
        <p className="text-sm text-ink-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={confirmClasses} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
