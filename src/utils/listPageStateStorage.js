export const getStoredListPageState = (storageKey, fallback = {}) => {
  if (typeof window === "undefined") return fallback;

  try {
    const rawValue = window.sessionStorage.getItem(storageKey);

    if (!rawValue) return fallback;

    const parsedValue = JSON.parse(rawValue);

    return {
      ...fallback,
      ...parsedValue,
    };
  } catch (error) {
    console.warn("LOAD LIST PAGE STATE ERROR:", error);
    return fallback;
  }
};

export const saveStoredListPageState = (storageKey, state) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn("SAVE LIST PAGE STATE ERROR:", error);
  }
};

export const clearStoredListPageState = (storageKey) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch (error) {
    console.warn("CLEAR LIST PAGE STATE ERROR:", error);
  }
};
