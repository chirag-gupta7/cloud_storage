import { apiClient } from "./apiClient.js";

export async function getMyStars() {
  const res = await apiClient.get("/stars/");
  return res.data;
}

export async function toggleStar({ file_id = null, folder_id = null }) {
  const res = await apiClient.post("/stars/toggle", { file_id, folder_id });
  return res.data;
}

export async function getStarredItems() {
  const res = await apiClient.get("/stars/items");
  return res.data;
}

