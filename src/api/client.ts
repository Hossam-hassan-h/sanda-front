import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sanda_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const toCamel = (s) => s.replace(/^_/, "").replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const camelizeKeys = (obj) => {
  if (Array.isArray(obj)) return obj.map(camelizeKeys);
  if (obj && typeof obj === "object" && obj.constructor === Object) {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      result[toCamel(k)] = camelizeKeys(v);
    }
    return result;
  }
  return obj;
};

api.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === "object") {
      if ("status" in res.data && "data" in res.data) {
        const { status, data, ...rest } = res.data;
        if (Array.isArray(data)) {
          res.data = { ...rest, data };
        } else if (Object.keys(rest).length > 0) {
          res.data = { ...rest, ...data };
        } else {
          res.data = data;
        }
      }
      res.data = camelizeKeys(res.data);
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("sanda_token");
      localStorage.removeItem("sanda_user");
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const USE_MOCKS = false;
