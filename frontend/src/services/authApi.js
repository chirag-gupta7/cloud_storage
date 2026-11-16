import { apiClient } from "./apiClient.js";

export async function register({ email, password }) {
  const res = await apiClient.post("/auth/register", { email, password });
  return res.data;
}

export async function login({ email, password }) {
  const res = await apiClient.post("/auth/login", { email, password });
  return res.data;
}

