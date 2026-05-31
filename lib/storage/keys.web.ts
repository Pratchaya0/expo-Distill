// Web stub — expo-secure-store is native-only. Use localStorage.
export const getApiKey = (key: string): Promise<string | null> =>
  Promise.resolve(localStorage.getItem(key));

export const setApiKey = (key: string, value: string): Promise<void> =>
  Promise.resolve(void localStorage.setItem(key, value));

export const removeApiKey = (key: string): Promise<void> =>
  Promise.resolve(void localStorage.removeItem(key));
