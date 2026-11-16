import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDownloadUrl, getPreviewUrl } from "../../services/filesApi.js";
import { getStarredItems } from "../../services/starsApi.js";
import { getErrorMessage } from "../../services/apiClient.js";
import { useToast } from "../../state/toast.jsx";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { FileTable } from "../components/FileTable.jsx";
import { SearchBar } from "../components/SearchBar.jsx";

export function StarredPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [mimeType, setMimeType] = useState(null);
  const itemsQ = useQuery({ queryKey: ["starred-items"], queryFn: getStarredItems });

  const folders = useMemo(() => (itemsQ.data || []).filter((x) => x.type === "folder"), [itemsQ.data]);
  const files = useMemo(() => (itemsQ.data || []).filter((x) => x.type === "file"), [itemsQ.data]);

  const qTrim = q.trim().toLowerCase();

  const filteredFolders = useMemo(() => {
    if (!qTrim) return folders;
    return folders.filter((f) => String(f.name || "").toLowerCase().includes(qTrim));
  }, [folders, qTrim]);

  const filteredFiles = useMemo(() => {
    let out = files;
    if (qTrim) out = out.filter((f) => String(f.name || "").toLowerCase().includes(qTrim));
    if (mimeType) out = out.filter((f) => f.mime_type === mimeType);
    return out;
  }, [files, qTrim, mimeType]);

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

  const loading = itemsQ.isLoading;
  const error = itemsQ.error;

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: "Starred" }]} />
      <SearchBar value={q} onChange={setQ} mimeType={mimeType} onMimeTypeChange={setMimeType} placeholder="Search starred…" />
      {loading ? <Spinner /> : null}
      {error ? <div className="text-sm text-rose-700">Failed to load: {getErrorMessage(error)}</div> : null}

      {!loading && !error && !filteredFolders.length && !filteredFiles.length ? (
        <EmptyState title="No starred items" description="Starred items will appear here." />
      ) : null}

      <FileTable
        folders={filteredFolders}
        files={filteredFiles}
        onOpenFolder={(f) => navigate(`/app/folders/${f.id}`)}
        onPreviewFile={onPreview}
        onDownloadFile={onDownload}
        mode="shared"
      />
    </div>
  );
}
