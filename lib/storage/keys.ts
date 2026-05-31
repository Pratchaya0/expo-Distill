import * as SecureStore from 'expo-secure-store';

export const getApiKey = (key: string) => SecureStore.getItemAsync(key);
export const setApiKey = (key: string, value: string) => SecureStore.setItemAsync(key, value);
export const removeApiKey = (key: string) => SecureStore.deleteItemAsync(key);
