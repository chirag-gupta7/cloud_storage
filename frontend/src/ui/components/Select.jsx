import { clsx } from "clsx";

export function Select({ className, ...props }) {
  return (
    <select
      className={clsx(
        "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400/30",
        className
      )}
      {...props}
    />
  );
}

