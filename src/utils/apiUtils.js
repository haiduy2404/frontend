export const unwrapData = (response) => {
  return response?.data ?? response;
};

export const unwrapNestedData = (response) => {
  return response?.data?.data ?? response?.data ?? response;
};

export const getApiErrorMessage = (
  error,
  fallback = "Có lỗi xảy ra"
) => {
  const data = error?.response?.data;

  return (
    data?.message ||
    data?.detail ||
    data?.code ||
    data?.name ||
    fallback
  );
};