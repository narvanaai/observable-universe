// API client — single axios instance, consistent error handling.
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Response interceptor — unwrap data, handle errors consistently
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error || error.message || "Something went wrong";
    console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} — ${message}`);
    return Promise.reject(new Error(message));
  }
);

export default api;
