import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Page not found</div>
          <div className="mt-2 text-sm text-slate-600">The page you’re looking for doesn’t exist.</div>
          <div className="mt-4 text-sm">
            <Link className="font-medium text-slate-900 hover:underline" to="/app/drive">
              Go to My Drive
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

