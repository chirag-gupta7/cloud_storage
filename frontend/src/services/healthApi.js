import { apiClient } from "./apiClient.js";

export async function ping() {
  const res = await apiClient.get("/");
  return res.data;
}

