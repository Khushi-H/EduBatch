import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const STYLES = {
  success: {
    icon: CheckCircle2,
    box: "bg-white border-green-100",
    iconWrap: "bg-green-50 text-green-600",
  },
  error: {
    icon: XCircle,
    box: "bg-white border-red-100",
    iconWrap: "bg-red-50 text-red-600",
  },
  info: {
    icon: Info,
    box: "bg-white border-ink-100",
    iconWrap: "bg-ink-50 text-ink-600",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (type, message, duration = 3500) => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, type, message }]);
      if (duration) {
        setTimeout(() => remove(id), duration);
      }
      return id;
    },
    [remove],
  );

  const toast = {
    success: (msg, duration) => push("success", msg, duration),
    error: (msg, duration) => push("error", msg, duration),
    info: (msg, duration) => push("info", msg, duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast stack - fixed bottom-right, stacks upward */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => {
          const s = STYLES[t.type] || STYLES.info;
          const Icon = s.icon;
          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 rounded-xl border shadow-soft px-4 py-3 animate-scale-in ${s.box}`}
              role="status"
            >
              <div
                className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center ${s.iconWrap}`}
              >
                <Icon size={15} />
              </div>
              <p className="text-sm text-ink-700 leading-snug pt-0.5 flex-1">
                {t.message}
              </p>
              <button
                onClick={() => remove(t.id)}
                className="text-ink-300 hover:text-ink-600 shrink-0"
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
