import { apiClient } from "./apiClient.js";

export async function listFolders() {
  const res = await apiClient.get("/folders/");
  return res.data;
}

export async function listAccessibleFolders() {
  const res = await apiClient.get("/folders/accessible");
  return res.data;
}

export async function createFolder({ name, parent_id = null }) {
  const res = await apiClient.post("/folders/", { name, parent_id });
  return res.data;
}

export async function getFolderContents(folderId) {
  const res = await apiClient.get(`/folders/${folderId}`);
  return res.data;
}

export async function moveFolder(folderId, parent_id) {
  const res = await apiClient.put(`/folders/${folderId}/move`, { parent_id });
  return res.data;
}

export async function renameFolder(folderId, new_name) {
  const res = await apiClient.put(`/folders/${folderId}/rename`, { new_name });
  return res.data;
}
