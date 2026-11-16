import { apiClient } from "./apiClient.js";

export async function listFiles() {
  const res = await apiClient.get("/files/");
  return res.data;
}

export async function listTrashFiles() {
  const res = await apiClient.get("/files/trash/list");
  return res.data;
}

export async function searchFiles({ q, mime_type }) {
  const res = await apiClient.get("/files/search", { params: { q, mime_type } });
  return res.data;
}

export async function moveToTrash(fileId) {
  const res = await apiClient.delete(`/files/${fileId}`);
  return res.data;
}

export async function restoreFromTrash(fileId) {
  const res = await apiClient.post(`/files/${fileId}/restore`);
  return res.data;
}

export async function permanentlyDelete(fileId) {
  const res = await apiClient.delete(`/files/${fileId}/permanent`);
  return res.data;
}

export async function getDownloadUrl(fileId) {
  const res = await apiClient.get(`/files/${fileId}/download`);
  return res.data;
}

export async function getPreviewUrl(fileId) {
  const res = await apiClient.get(`/files/${fileId}/preview`);
  return res.data;
}

export async function renameFile(fileId, new_name) {
  const res = await apiClient.put(`/files/${fileId}/rename`, { new_name });
  return res.data;
}

export async function moveFile(fileId, folder_id) {
  const res = await apiClient.put(`/files/${fileId}/move`, { folder_id });
  return res.data;
}
