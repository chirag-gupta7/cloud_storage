import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { createFolder, getFolderContents, listFolders, listAccessibleFolders, moveFolder, renameFolder } from "../../services/foldersApi.js";
import {
  moveToTrash,
  getDownloadUrl,
  getPreviewUrl,
  renameFile,
  moveFile,
  searchFiles,
  permanentlyDelete,
} from "../../services/filesApi.js";
import { uploadFile } from "../../services/uploadApi.js";
import { createPublicLink } from "../../services/publicApi.js";
import { shareItem } from "../../services/sharesApi.js";
import { getErrorMessage } from "../../services/apiClient.js";
import { useToast } from "../../state/toast.jsx";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";
import { Button } from "../components/Button.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { UploadDropzone } from "../components/UploadDropzone.jsx";
import { FileTable } from "../components/FileTable.jsx";
import { SearchBar } from "../components/SearchBar.jsx";
import { CreateFolderDialog } from "../dialogs/CreateFolderDialog.jsx";
import { ShareDialog } from "../dialogs/ShareDialog.jsx";
import { PublicLinkDialog } from "../dialogs/PublicLinkDialog.jsx";
import { RenameFileDialog } from "../dialogs/RenameFileDialog.jsx";
import { MoveFileDialog } from "../dialogs/MoveFileDialog.jsx";
import { MoveFolderDialog } from "../dialogs/MoveFolderDialog.jsx";
import { ConfirmDialog } from "../dialogs/ConfirmDialog.jsx";
import { RenameFolderDialog } from "../dialogs/RenameFolderDialog.jsx";

function buildBreadcrumbTrail(folderId, allFolders) {
  const byId = new Map(allFolders.map((f) => [String(f.id), f]));
  const trail = [];
  let current = byId.get(String(folderId));
  const seen = new Set();
  while (current && !seen.has(String(current.id))) {
    seen.add(String(current.id));
    trail.push(current);
    current = current.parent_id ? byId.get(String(current.parent_id)) : null;
  }
  trail.reverse();
  return trail;
}

export function FolderPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();

  const idNum = Number(folderId);

  const [createOpen, setCreateOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [publicFor, setPublicFor] = useState(null);
  const [createdPublicUrl, setCreatedPublicUrl] = useState("");
  const [renameFor, setRenameFor] = useState(null);
  const [moveFor, setMoveFor] = useState(null);
  const [permanentFor, setPermanentFor] = useState(null);
  const [moveFolderFor, setMoveFolderFor] = useState(null);
  const [renameFolderFor, setRenameFolderFor] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [mimeType, setMimeType] = useState(null);

  const allFoldersQ = useQuery({ queryKey: ["folders"], queryFn: listFolders });
  const accessibleFoldersQ = useQuery({ queryKey: ["folders-accessible"], queryFn: listAccessibleFolders });
  const contentsQ = useQuery({
    queryKey: ["folder-contents", idNum],
    queryFn: () => getFolderContents(idNum),
    enabled: Number.isFinite(idNum) && idNum > 0,
  });

  const searchQTrimmed = searchQ.trim();
  const searchQEnabled = searchQTrimmed.length >= 2;
  const searchResQ = useQuery({
    queryKey: ["file-search", searchQTrimmed, mimeType],
    queryFn: () => searchFiles({ q: searchQTrimmed, mime_type: mimeType }),
    enabled: searchQEnabled,
  });

  const trail = useMemo(() => buildBreadcrumbTrail(idNum, allFoldersQ.data || []), [idNum, allFoldersQ.data]);

  const breadcrumbs = useMemo(() => {
    const items = [{ label: "My Drive", to: "/app/drive", key: "drive" }];
    for (const f of trail) items.push({ label: f.name, to: `/app/folders/${f.id}`, key: `f-${f.id}` });
    return items;
  }, [trail]);

  const createFolderM = useMutation({
    mutationFn: (payload) => createFolder(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders"] });
      qc.invalidateQueries({ queryKey: ["folder-contents", idNum] });
      toast.success("Folder created", "");
      setCreateOpen(false);
    },
    onError: (err) => toast.error("Create folder failed", getErrorMessage(err)),
  });

  const trashM = useMutation({
    mutationFn: (fileId) => moveToTrash(fileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files"] });
      qc.invalidateQueries({ queryKey: ["folder-contents", idNum] });
      toast.success("Moved to trash", "");
    },
    onError: (err) => toast.error("Trash failed", getErrorMessage(err)),
  });

  const renameM = useMutation({
    mutationFn: ({ fileId, newName }) => renameFile(fileId, newName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files"] });
      qc.invalidateQueries({ queryKey: ["folder-contents", idNum] });
      toast.success("Renamed", "");
      setRenameFor(null);
    },
    onError: (err) => toast.error("Rename failed", getErrorMessage(err)),
  });

  const moveM = useMutation({
    mutationFn: ({ fileId, folderId }) => moveFile(fileId, folderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files"] });
      qc.invalidateQueries({ queryKey: ["folder-contents", idNum] });
      toast.success("Moved", "");
      setMoveFor(null);
    },
    onError: (err) => toast.error("Move failed", getErrorMessage(err)),
  });

  const permanentDeleteM = useMutation({
    mutationFn: (fileId) => permanentlyDelete(fileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files"] });
      qc.invalidateQueries({ queryKey: ["folder-contents", idNum] });
      toast.success("Deleted", "File permanently removed.");
      setPermanentFor(null);
    },
    onError: (err) => toast.error("Delete failed", getErrorMessage(err)),
  });

  const shareM = useMutation({
    mutationFn: (payload) => shareItem(payload),
    onSuccess: () => {
      toast.success("Shared", "");
      setShareTarget(null);
    },
    onError: (err) => toast.error("Share failed", getErrorMessage(err)),
  });

  const publicM = useMutation({
    mutationFn: ({ fileId, password, expires_in_hours }) => createPublicLink({ file_id: fileId, password, expires_in_hours }),
    onSuccess: (data) => {
      const full = `${window.location.origin}${data.public_url}`;
      setCreatedPublicUrl(full);
      navigator.clipboard?.writeText(full);
      toast.success("Public link created", "Copied to clipboard.");
    },
    onError: (err) => toast.error("Public link failed", getErrorMessage(err)),
  });

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

  async function onFiles(selected) {
    for (const f of selected) {
      const uploadId = crypto.randomUUID();
      setUploads((prev) => [...prev, { id: uploadId, name: f.name, pct: 0 }]);
      try {
        await uploadFile({
          file: f,
          folderId: idNum,
          onProgress: ({ pct }) => setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, pct } : u))),
        });
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
        qc.invalidateQueries({ queryKey: ["files"] });
        qc.invalidateQueries({ queryKey: ["folder-contents", idNum] });
        toast.success("Uploaded", f.name);
      } catch (err) {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
        toast.error("Upload failed", `${f.name}: ${getErrorMessage(err)}`);
      }
    }
  }

  const loading = allFoldersQ.isLoading || contentsQ.isLoading;
  const error = allFoldersQ.error || contentsQ.error;

  const childFolders = contentsQ.data?.folders || [];
  const folderFiles = contentsQ.data?.files || [];
  const visibleFolders = searchQEnabled ? [] : childFolders;
  const visibleFiles = searchQEnabled ? (searchResQ.data || []) : folderFiles;

  const selectableFolders = useMemo(() => {
    const all = accessibleFoldersQ.data || allFoldersQ.data || [];
    return all.filter((f) => String(f.id) !== String(idNum));
  }, [allFoldersQ.data, accessibleFoldersQ.data, idNum]);

  const moveFolderM = useMutation({
    mutationFn: ({ folderId, parentId }) => moveFolder(folderId, parentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders"] });
      qc.invalidateQueries({ queryKey: ["folders-accessible"] });
      qc.invalidateQueries({ queryKey: ["folder-contents", idNum] });
      toast.success("Folder moved", "");
      setMoveFolderFor(null);
    },
    onError: (err) => toast.error("Move failed", getErrorMessage(err)),
  });

  const renameFolderM = useMutation({
    mutationFn: ({ folderId, newName }) => renameFolder(folderId, newName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders"] });
      qc.invalidateQueries({ queryKey: ["folders-accessible"] });
      qc.invalidateQueries({ queryKey: ["folder-contents", idNum] });
      toast.success("Folder renamed", "");
      setRenameFolderFor(null);
    },
    onError: (err) => toast.error("Rename failed", getErrorMessage(err)),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs items={breadcrumbs} />
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setCreateOpen(true)} type="button">
            New folder
          </Button>
          <Button variant="ghost" onClick={() => navigate("/app/drive")} type="button">
            Back
          </Button>
        </div>
      </div>

      <UploadDropzone disabled={false} onFiles={onFiles} />

      <SearchBar value={searchQ} onChange={setSearchQ} mimeType={mimeType} onMimeTypeChange={setMimeType} />

      {uploads.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-sm font-medium text-slate-900">Uploads</div>
          <div className="mt-2 space-y-2">
            {uploads.map((u) => (
              <div key={u.id} className="text-sm text-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.pct}%</div>
                </div>
                <div className="mt-1 h-2 w-full rounded bg-slate-100">
                  <div className="h-2 rounded bg-slate-900" style={{ width: `${u.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {loading ? <Spinner /> : null}
      {error ? <div className="text-sm text-rose-700">Failed to load: {getErrorMessage(error)}</div> : null}
      {searchResQ.isFetching ? <div className="text-xs text-slate-500">Searching…</div> : null}

      {!loading && !error && !visibleFolders.length && !visibleFiles.length ? (
        <EmptyState title="Folder is empty" description="Upload files or create a subfolder." />
      ) : null}

      <FileTable
        folders={visibleFolders}
        files={visibleFiles}
        onOpenFolder={(f) => navigate(`/app/folders/${f.id}`)}
        onPreviewFile={onPreview}
        onDownloadFile={onDownload}
        onMoveToTrash={(f) => trashM.mutate(f.id)}
        onPermanentDelete={(f) => setPermanentFor(f)}
        onRenameFile={(f) => setRenameFor(f)}
        onMoveFile={(f) => setMoveFor(f)}
        onMoveFolder={(f) => setMoveFolderFor(f)}
        onRenameFolder={(f) => setRenameFolderFor(f)}
        onShareFile={(f) => setShareTarget({ type: "file", id: f.id })}
        onShareFolder={(f) => setShareTarget({ type: "folder", id: f.id })}
        onPublicLink={(f) => setPublicFor(f)}
        mode="drive"
      />

      <CreateFolderDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(p) => createFolderM.mutate(p)}
        parentId={idNum}
      />

      <ShareDialog
        open={Boolean(shareTarget)}
        onClose={() => setShareTarget(null)}
        target={shareTarget}
        onShare={({ shared_with_email, permission }) => {
          if (!shareTarget) return;
          shareM.mutate({
            shared_with_email,
            permission,
            file_id: shareTarget.type === "file" ? shareTarget.id : null,
            folder_id: shareTarget.type === "folder" ? shareTarget.id : null,
          });
        }}
      />

      <PublicLinkDialog
        open={Boolean(publicFor)}
        createdUrl={createdPublicUrl}
        onClose={() => {
          setPublicFor(null);
          setCreatedPublicUrl("");
        }}
        onCreate={({ password, expires_in_hours }) => {
          if (!publicFor) return;
          publicM.mutate({ fileId: publicFor.id, password, expires_in_hours });
        }}
      />

      <RenameFileDialog
        open={Boolean(renameFor)}
        onClose={() => setRenameFor(null)}
        file={renameFor}
        onRename={(newName) => renameM.mutate({ fileId: renameFor.id, newName })}
      />

      <MoveFileDialog
        open={Boolean(moveFor)}
        onClose={() => setMoveFor(null)}
        file={moveFor}
        folders={selectableFolders}
        onMove={(folderId) => moveM.mutate({ fileId: moveFor.id, folderId })}
      />

      <MoveFolderDialog
        open={Boolean(moveFolderFor)}
        onClose={() => setMoveFolderFor(null)}
        folder={moveFolderFor}
        folders={selectableFolders}
        onMove={(parentId) => moveFolderM.mutate({ folderId: moveFolderFor.id, parentId })}
      />

      <RenameFolderDialog
        open={Boolean(renameFolderFor)}
        onClose={() => setRenameFolderFor(null)}
        folder={renameFolderFor}
        onRename={(newName) => renameFolderM.mutate({ folderId: renameFolderFor.id, newName })}
      />

      <ConfirmDialog
        open={Boolean(permanentFor)}
        title="Delete permanently?"
        description="This will permanently delete the file. This action can’t be undone."
        confirmLabel="Delete"
        danger
        onClose={() => setPermanentFor(null)}
        onConfirm={() => permanentDeleteM.mutate(permanentFor.id)}
      />
    </div>
  );
}
