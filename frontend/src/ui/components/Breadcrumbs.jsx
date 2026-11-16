import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-slate-600">
      {items.map((item, idx) => (
        <span key={item.key || item.label} className="flex items-center gap-1">
          {idx > 0 ? <ChevronRight className="h-4 w-4 text-slate-400" /> : null}
          {item.to ? (
            <Link className="hover:text-slate-900 hover:underline" to={item.to}>
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

