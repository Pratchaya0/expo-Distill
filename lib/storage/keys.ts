import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store is native-only; fall back to localStorage on web dev preview
const isWeb = Platform.OS === 'web';

export const getApiKey = (key: string): Promise<string | null> =>
  isWeb
    ? Promise.resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null)
    : SecureStore.getItemAsync(key);

export const setApiKey = (key: string, value: string): Promise<void> =>
  isWeb
    ? Promise.resolve(typeof localStorage !== 'undefined' ? void localStorage.setItem(key, value) : undefined)
    : SecureStore.setItemAsync(key, value);

export const removeApiKey = (key: string): Promise<void> =>
  isWeb
    ? Promise.resolve(typeof localStorage !== 'undefined' ? void localStorage.removeItem(key) : undefined)
    : SecureStore.deleteItemAsync(key);
