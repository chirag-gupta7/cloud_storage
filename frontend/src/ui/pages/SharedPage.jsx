import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getSharedWithMe } from "../../services/sharesApi.js";
import { getDownloadUrl, getPreviewUrl } from "../../services/filesApi.js";
import { getErrorMessage } from "../../services/apiClient.js";
import { useToast } from "../../state/toast.jsx";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { Spinner } from "../components/Spinner.jsx";


export function SharedPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["shared-with-me"], queryFn: getSharedWithMe });

  async function onDownload(file) {
    try {
      const data = await getDownloadUrl(file.id);
      window.location.href = data.download_url;
    } catch (err) {
      toast.error("Download failed", getErrorMessage(err));
    }
  }

  async function onPreview(file) {
    try {
      const data = await getPreviewUrl(file.id);
      window.open(data.preview_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error("Preview failed", getErrorMessage(err));
    }
  }

  const sharedFiles = (q.data || [])
    .filter((x) => x.type === "file")
    .map((x) => ({
      id: x.id,
      name: x.name,
      mime_type: x.mime_type,
      size: x.size,
      permission: x.permission,
    }));
  const sharedFolders = (q.data || []).filter((x) => x.type === "folder");

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: "Shared with me" }]} />
      {q.isLoading ? <Spinner /> : null}
      {q.error ? <div className="text-sm text-rose-700">Failed to load: {getErrorMessage(q.error)}</div> : null}

      {!q.isLoading && !q.error && !sharedFiles.length && !sharedFolders.length ? (
        <EmptyState title="Nothing shared yet" description="When someone shares a file or folder with you, it will appear here." />
      ) : null}

      {sharedFiles.length ? (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-900">Files</div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2 hidden md:table-cell">Type</th>
                  <th className="px-4 py-2 hidden md:table-cell">Size</th>
                  <th className="px-4 py-2">Permission</th>
                  <th className="px-4 py-2 w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sharedFiles.map((f) => (
                  <tr key={f.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <button className="truncate font-medium text-slate-900 hover:underline" type="button" onClick={() => onPreview(f)}>
                        {f.name}
                      </button>
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell text-slate-600">{f.mime_type || "—"}</td>
                    <td className="px-4 py-2 hidden md:table-cell text-slate-600">{f.size ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-700">{f.permission}</td>
                    <td className="px-4 py-2">
                      <button className="text-sm font-medium text-slate-900 underline" type="button" onClick={() => onDownload(f)}>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {sharedFolders.length ? (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-900">Folders</div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Permission</th>
                </tr>
              </thead>
              <tbody>
                {sharedFolders.map((folder) => (
                  <tr key={folder.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <button
                        className="truncate font-medium text-slate-900 hover:underline"
                        type="button"
                        onClick={() => navigate(`/app/folders/${folder.id}`)}
                      >
                        {folder.name}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-slate-700">{folder.permission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
