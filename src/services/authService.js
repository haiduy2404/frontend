import axios from "axios";

// Keep the API on the SAME host as the SPA so SameSite=Lax auth cookies are
// sent on XHR. With the dev server on http://localhost:5173, use localhost here
// (localhost and 127.0.0.1 are different "sites" for cookies).
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  // Echo Django's CSRF cookie back as a header on unsafe requests.
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  headers: {
    "Content-Type": "application/json",
  },
});

// We no longer store the access token in JS-readable storage. Auth is carried
// by httpOnly cookies. We keep a lightweight cached user for UX (display only);
// it is never the source of truth for authorization.
const clearAuthData = () => {
  localStorage.removeItem("user");
};

const cacheUser = (user) => {
  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch (err) {
    // ignore storage errors
  }
};

export const refreshAccessToken = async () => {
  // Refresh is driven entirely by the httpOnly refresh cookie.
  await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
};

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Try a one-time silent refresh on 401, then replay the request.
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

    // Authorization failure: surface globally so the app can redirect.
    if (status === 403 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:forbidden"));
    }

    return Promise.reject(error);
  }
);

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
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
  // Backend invalidates the session on password change.
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

// Backwards-compatible alias used by older callers.
export const getCurrentUser = getCachedUser;

export const getMe = async () => {
  const response = await axiosInstance.get("/auth/me");
  const user = response.data.data;
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
