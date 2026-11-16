import { apiClient } from "./apiClient.js";

export async function createPublicLink({ file_id, password = null, expires_in_hours = null }) {
  const res = await apiClient.post("/public/", { file_id, password, expires_in_hours });
  return res.data;
}

export async function accessPublicFile({ token, password }) {
  const res = await apiClient.get(`/public/${token}`, { params: password ? { password } : {} });
  return res.data;
}

export async function previewPublicFile({ token, password }) {
  const res = await apiClient.get(`/public/${token}/preview`, { params: password ? { password } : {} });
  return res.data;
}
