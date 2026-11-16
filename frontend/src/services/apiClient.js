import axios from "axios";
import { authStore } from "../state/authStore.js";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 30_000,
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      authStore.setToken("");
    }
    return Promise.reject(error);
  }
);

apiClient.interceptors.request.use((config) => {
  const token = authStore.getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(error) {
  if (!error) return "Unknown error";
  const message =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    "Request failed";
  return String(message);
}
