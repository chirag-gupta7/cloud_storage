import { useEffect } from "react";

export function Dialog({ open, title, children, onClose, footer }) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <button className="text-sm text-slate-500 hover:text-slate-700" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        <div className="px-4 py-4">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

