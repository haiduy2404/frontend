import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const getAccessToken = () => localStorage.getItem("accessToken");

const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
};

const saveAuthData = (data) => {
  if (data.access) {
    localStorage.setItem("accessToken", data.access);
  }

  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user.data));
  }
};

export const refreshAccessToken = async () => {
  const response = await axios.post(
    `${API_URL}/auth/refresh`,
    {},
    { withCredentials: true }
  );

  const newAccessToken = response.data.access;
  localStorage.setItem("accessToken", newAccessToken);

  return newAccessToken;
};

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();

    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        clearAuthData();
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  const data = response.data;

  saveAuthData(data);

  return data;
};

export const changePassword = async (passwordData) => {
  const response = await axiosInstance.post(
    "/auth/change-password",
    passwordData
  );

  return response.data;
};

export const logout = () => {
  clearAuthData();
};

export const getCurrentUser = () => {
  const raw = localStorage.getItem("user");

  try {
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

export const getAuthToken = () => getAccessToken();

export const getMe = async () => {
  const response = await axiosInstance.get("/auth/me");
  const user = response.data.data;

  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch (err) {
    // ignore storage errors
  }

  return user;
};

export const getUserNames = async () => {
  const response = await axiosInstance.get("/auth/users");
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await axiosInstance.get(`/auth/me`);
  return response.data;
};

export const updateUserById = async (userId, userData) => {
  const response = await axiosInstance.put(`/auth/me`, userData);
  return response.data;
};

export default axiosInstance;