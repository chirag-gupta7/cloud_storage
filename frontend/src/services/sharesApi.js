import { apiClient } from "./apiClient.js";

export async function shareItem({
  file_id = null,
  folder_id = null,
  shared_with_email,
  permission,
}) {
  const res = await apiClient.post("/shares/", {
    file_id,
    folder_id,
    shared_with_email,
    permission,
  });
  return res.data;
}

export async function getSharedWithMe() {
  const res = await apiClient.get("/shares/me");
  return res.data;
}

export async function getSharedByMe() {
  const res = await apiClient.get("/shares/by-me");
  return res.data;
}

export async function revokeShare(shareId) {
  const res = await apiClient.delete(`/shares/${shareId}`);
  return res.data;
}
