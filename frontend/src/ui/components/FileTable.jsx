import { Folder as FolderIcon, File as FileIcon, Star, Download, Trash2, Pencil, XOctagon } from "lucide-react";
import { IconButton } from "./IconButton.jsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useStarsQuery } from "../../state/useStarsQuery.js";
import { toggleStar as toggleStarApi } from "../../services/starsApi.js";

function bytesToSize(bytes) {
  if (bytes == null) return "—";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const v = bytes / Math.pow(1024, i);
  const fixed = v >= 10 || i === 0 ? 0 : 1;
  return `${v.toFixed(fixed)} ${sizes[i]}`;
}

export function FileTable({
  folders = [],
  files = [],
  onOpenFolder,
  onPreviewFile,
  onDownloadFile,
  onMoveToTrash,
  onRestore,
  onPermanentDelete,
  onRenameFile,
  onMoveFile,
  onMoveFolder,
  onRenameFolder,
  onShareFile,
  onShareFolder,
  onPublicLink,
  mode = "drive", // drive | trash | shared
}) {
  const qc = useQueryClient();
  const starsQ = useStarsQuery();
  const fileStarIds = new Set((starsQ.data?.files || []).map(String));
  const folderStarIds = new Set((starsQ.data?.folders || []).map(String));

  const toggleM = useMutation({
    mutationFn: ({ file_id, folder_id }) => toggleStarApi({ file_id, folder_id }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["stars"] });
      const prev = qc.getQueryData(["stars"]);
      qc.setQueryData(["stars"], (old) => {
        const next = old ? { ...old } : { files: [], folders: [] };
        if (vars.file_id) {
          const id = String(vars.file_id);
          const set = new Set((next.files || []).map(String));
          if (set.has(id)) set.delete(id);
          else set.add(id);
          next.files = Array.from(set);
        }
        if (vars.folder_id) {
          const id = String(vars.folder_id);
          const set = new Set((next.folders || []).map(String));
          if (set.has(id)) set.delete(id);
          else set.add(id);
          next.folders = Array.from(set);
        }
        return next;
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["stars"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["stars"] });
      qc.invalidateQueries({ queryKey: ["starred-items"] });
    },
  });
  const hasItems = folders.length || files.length;
  if (!hasItems) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-600">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2 hidden md:table-cell">Type</th>
            <th className="px-4 py-2 hidden md:table-cell">Size</th>
            <th className="px-4 py-2 w-[240px]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {folders.map((f) => (
            <tr key={`folder-${f.id}`} className="border-t border-slate-100">
              <td className="px-4 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FolderIcon className="h-4 w-4 text-slate-500" />
                  <button
                    className="truncate font-medium text-slate-900 hover:underline"
                    onClick={() => onOpenFolder?.(f)}
                    type="button"
                  >
                    {f.name}
                  </button>
                  {mode === "drive" ? (
                    <IconButton title="Rename folder" onClick={() => onRenameFolder?.(f)} type="button">
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-2 hidden md:table-cell text-slate-600">Folder</td>
              <td className="px-4 py-2 hidden md:table-cell text-slate-600">—</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <IconButton
                    title="Star"
                    onClick={() => toggleM.mutate({ folder_id: f.id })}
                    type="button"
                  >
                    <Star className={["h-4 w-4", folderStarIds.has(String(f.id)) ? "fill-slate-900 text-slate-900" : ""].join(" ")} />
                  </IconButton>
                  {mode === "drive" ? (
                    <>
                      <IconButton title="Share folder" onClick={() => onShareFolder?.(f)} type="button">
                        <span className="text-xs font-medium">Share</span>
                      </IconButton>
                      <IconButton title="Move folder" onClick={() => onMoveFolder?.(f)} type="button">
                        <span className="text-xs font-medium">Move</span>
                      </IconButton>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}

          {files.map((file) => (
            <tr key={`file-${file.id}`} className="border-t border-slate-100">
              <td className="px-4 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon className="h-4 w-4 text-slate-500" />
                  <button
                    className="truncate font-medium text-slate-900 hover:underline"
                    type="button"
                    onClick={() => onPreviewFile?.(file)}
                    title="Preview"
                  >
                    {file.name}
                  </button>
                  {mode === "drive" ? (
                    <IconButton title="Rename" onClick={() => onRenameFile?.(file)} type="button">
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-2 hidden md:table-cell text-slate-600">{file.mime_type || "—"}</td>
              <td className="px-4 py-2 hidden md:table-cell text-slate-600">{bytesToSize(file.size)}</td>
              <td className="px-4 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <IconButton title="Download" onClick={() => onDownloadFile?.(file)} type="button">
                    <Download className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    title="Star"
                    onClick={() => toggleM.mutate({ file_id: file.id })}
                    type="button"
                  >
                    <Star className={["h-4 w-4", fileStarIds.has(String(file.id)) ? "fill-slate-900 text-slate-900" : ""].join(" ")} />
                  </IconButton>

                  {mode === "drive" ? (
                    <>
                      <IconButton title="Share file" onClick={() => onShareFile?.(file)} type="button">
                        <span className="text-xs font-medium">Share</span>
                      </IconButton>
                      <IconButton title="Public link" onClick={() => onPublicLink?.(file)} type="button">
                        <span className="text-xs font-medium">Link</span>
                      </IconButton>
                      <IconButton title="Move" onClick={() => onMoveFile?.(file)} type="button">
                        <span className="text-xs font-medium">Move</span>
                      </IconButton>
                      <IconButton title="Move to trash" onClick={() => onMoveToTrash?.(file)} type="button">
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                      <IconButton title="Delete permanently" onClick={() => onPermanentDelete?.(file)} type="button">
                        <XOctagon className="h-4 w-4 text-rose-700" />
                      </IconButton>
                    </>
                  ) : null}

                  {mode === "trash" ? (
                    <>
                      <IconButton title="Restore" onClick={() => onRestore?.(file)} type="button">
                        <span className="text-xs font-medium">Restore</span>
                      </IconButton>
                      <IconButton title="Delete permanently" onClick={() => onPermanentDelete?.(file)} type="button">
                        <span className="text-xs font-medium text-rose-700">Delete</span>
                      </IconButton>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
