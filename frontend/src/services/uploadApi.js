import { apiClient } from "./apiClient.js";

export async function uploadFile({ file, folderId, onProgress }) {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post("/upload/", form, {
    params: folderId ? { folder_id: folderId } : {},
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (!onProgress) return;
      const total = evt.total || file.size || 0;
      const loaded = evt.loaded || 0;
      const pct = total ? Math.round((loaded / total) * 100) : 0;
      onProgress({ loaded, total, pct });
    },
  });
  return res.data;
}
