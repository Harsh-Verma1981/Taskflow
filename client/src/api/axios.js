import axios from "axios";

// Dynamically use the production URL from .env or fall back to localhost
const baseURL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api` 
  : "http://localhost:5000/api";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("tf_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;