import { clsx } from "clsx";
import { forwardRef } from "react";

export const IconButton = forwardRef(function IconButton({ className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/30 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
