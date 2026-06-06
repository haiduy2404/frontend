import axiosInstance from "./authService";

export const getMetadata = async () => {
  const response = await axiosInstance.get("/core/metadata");
  return response.data;
};