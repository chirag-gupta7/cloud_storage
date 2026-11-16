import { clsx } from "clsx";

export function TextInput({ className, ...props }) {
  return (
    <input
      className={clsx(
        "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30",
        className
      )}
      {...props}
    />
  );
}

