import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSharedByMe, revokeShare } from "../../services/sharesApi.js";
import { getErrorMessage } from "../../services/apiClient.js";
import { useToast } from "../../state/toast.jsx";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { Button } from "../components/Button.jsx";

export function SharedByMePage() {
  const toast = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["shared-by-me"], queryFn: getSharedByMe });

  const revokeM = useMutation({
    mutationFn: (shareId) => revokeShare(shareId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shared-by-me"] });
      toast.success("Access revoked", "");
    },
    onError: (err) => toast.error("Revoke failed", getErrorMessage(err)),
  });

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: "Shared by me" }]} />

      {q.isLoading ? <Spinner /> : null}
      {q.error ? <div className="text-sm text-rose-700">Failed to load: {getErrorMessage(q.error)}</div> : null}

      {!q.isLoading && !q.error && !(q.data || []).length ? (
        <EmptyState title="No outgoing shares" description="Files or folders you share with others will show up here." />
      ) : null}

      {(q.data || []).length ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2 hidden md:table-cell">Type</th>
                <th className="px-4 py-2">Shared with</th>
                <th className="px-4 py-2">Permission</th>
                <th className="px-4 py-2 w-[160px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(q.data || []).map((s) => (
                <tr key={s.share_id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <div className="truncate font-medium text-slate-900">{s.name}</div>
                  </td>
                  <td className="px-4 py-2 hidden md:table-cell text-slate-600">{s.type}</td>
                  <td className="px-4 py-2">
                    <div className="truncate text-slate-700">{s.shared_with_email}</div>
                  </td>
                  <td className="px-4 py-2 text-slate-700">{s.permission}</td>
                  <td className="px-4 py-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => revokeM.mutate(s.share_id)}
                      disabled={revokeM.isPending}
                      type="button"
                    >
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

