import axios from "axios";

// Default to relative /api so Vite dev-proxy (or nginx in prod) keeps FE+API
// on the same origin — required for httpOnly cookies and CSRF double-submit.
const API_URL = import.meta.env.VITE_API_URL || "/api";

// CSRF token from login/me/refresh response body. Needed when FE and API are on
// different ports (cross-origin) because document.cookie cannot read cookies
// set by another origin. Same-origin deployments can also use the csrftoken cookie.
let csrfToken = null;

const setCsrfToken = (token) => {
  csrfToken = token || null;
};

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  if (csrfToken && !config.headers["X-CSRFToken"]) {
    config.headers["X-CSRFToken"] = csrfToken;
  }
  return config;
});

const clearAuthData = () => {
  localStorage.removeItem("user");
  csrfToken = null;
};

const cacheUser = (user) => {
  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch (err) {
    // ignore storage errors
  }
};

const extractUser = (payload) => {
  if (!payload || typeof payload !== "object") return payload;
  const { csrf_token, ...user } = payload;
  if (csrf_token) {
    setCsrfToken(csrf_token);
  }
  return user;
};

export const refreshAccessToken = async () => {
  const response = await axiosInstance.post("/auth/refresh", {});
  extractUser(response.data);
};

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await refreshAccessToken();
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        clearAuthData();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
        return Promise.reject(refreshError);
      }
    }

    if (status === 403 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:forbidden"));
    }

    return Promise.reject(error);
  }
);

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  if (response.data?.csrf_token) {
    setCsrfToken(response.data.csrf_token);
  }
  const user = response.data?.user;
  if (user) {
    cacheUser(user);
  }
  return user;
};

export const logout = async () => {
  try {
    await axiosInstance.post("/auth/logout", {});
  } catch (err) {
    // best-effort; clear local state regardless
  }
  clearAuthData();
};

export const changePassword = async (passwordData) => {
  const response = await axiosInstance.post(
    "/auth/change-password",
    passwordData
  );
  clearAuthData();
  return response.data;
};

export const getCachedUser = () => {
  const raw = localStorage.getItem("user");
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

export const getCurrentUser = getCachedUser;

export const getMe = async () => {
  const response = await axiosInstance.get("/auth/me");
  const user = extractUser(response.data.data);
  cacheUser(user);
  return user;
};

export const getUserNames = async () => {
  const response = await axiosInstance.get("/auth/users");
  return response.data;
};

export const getUserById = async () => {
  const response = await axiosInstance.get(`/auth/me`);
  return response.data;
};

export const updateUserById = async (userId, userData) => {
  const response = await axiosInstance.put(`/auth/me`, userData);
  return response.data;
};

export default axiosInstance;
