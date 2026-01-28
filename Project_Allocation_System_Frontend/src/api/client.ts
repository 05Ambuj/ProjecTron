import axios from "axios";
import {store} from "../app/store"; 

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

api.interceptors.request.use((config) => {
  // Try to get token from Redux state first
  let token = store.getState().auth.token;
  
  // Fallback to localStorage if not in Redux (e.g., during initial load)
  if (!token) {
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      try {
        const auth = JSON.parse(storedAuth);
        token = auth.token;
      } catch {
        // If parsing fails, try direct localStorage token
        token = localStorage.getItem("token");
      }
    } else {
      token = localStorage.getItem("token");
    }
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const message =
      error.response?.data?.message ??
      error.message ??
      "Unexpected error";

    // Show toast notification for errors
    // Note: Toast will be shown by components using useToast hook
    // This interceptor just ensures consistent error message format
    return Promise.reject(new Error(message));
  }
);

export default api;
