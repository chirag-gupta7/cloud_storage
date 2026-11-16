import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listTrashFiles, restoreFromTrash, permanentlyDelete } from "../../services/filesApi.js";
import { getErrorMessage } from "../../services/apiClient.js";
import { useToast } from "../../state/toast.jsx";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { FileTable } from "../components/FileTable.jsx";

export function TrashPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ["trash-files"], queryFn: listTrashFiles });

  const restoreM = useMutation({
    mutationFn: (fileId) => restoreFromTrash(fileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trash-files"] });
      qc.invalidateQueries({ queryKey: ["files"] });
      toast.success("Restored", "");
    },
    onError: (err) => toast.error("Restore failed", getErrorMessage(err)),
  });

  const deleteM = useMutation({
    mutationFn: (fileId) => permanentlyDelete(fileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trash-files"] });
      qc.invalidateQueries({ queryKey: ["files"] });
      toast.success("Deleted", "File permanently removed.");
    },
    onError: (err) => toast.error("Delete failed", getErrorMessage(err)),
  });

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: "Trash" }]} />

      {q.isLoading ? <Spinner /> : null}
      {q.error ? <div className="text-sm text-rose-700">Failed to load: {getErrorMessage(q.error)}</div> : null}

      {!q.isLoading && !q.error && !(q.data || []).length ? (
        <EmptyState title="Trash is empty" description="Deleted files will show up here until restored or permanently deleted." />
      ) : null}

      <FileTable
        files={q.data || []}
        folders={[]}
        onRestore={(f) => restoreM.mutate(f.id)}
        onPermanentDelete={(f) => deleteM.mutate(f.id)}
        mode="trash"
      />
    </div>
  );
}

