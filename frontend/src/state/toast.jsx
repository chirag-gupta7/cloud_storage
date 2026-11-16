/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const api = useMemo(() => {
    function push({ title, message, kind = "info", ttlMs = 3500 }) {
      const id = crypto.randomUUID();
      const toast = { id, title, message, kind };
      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, ttlMs);
    }

    return {
      info: (title, message) => push({ title, message, kind: "info" }),
      success: (title, message) => push({ title, message, kind: "success" }),
      error: (title, message) => push({ title, message, kind: "error", ttlMs: 5000 }),
      _toasts: toasts,
    };
  }, [toasts]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            "rounded-lg border bg-white p-3 text-sm shadow-sm",
            t.kind === "success" ? "border-emerald-200" : "",
            t.kind === "error" ? "border-rose-200" : "border-slate-200",
          ].join(" ")}
        >
          <div className="font-medium text-slate-900">{t.title}</div>
          {t.message ? <div className="mt-0.5 text-slate-600">{t.message}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
