import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@finera/shared';

const ACCESS_TOKEN_KEY = 'finera_access_token';
const USER_KEY = 'finera_user';

interface AuthState {
  accessToken: string | null;
  user: Omit<User, 'profile' | 'subscription'> & {
    emailVerified: boolean;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (token: string, user: AuthState['user']) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  updateUser: (updates: Partial<NonNullable<AuthState['user']>>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (token, user) => {
    // Store token securely — iOS Keychain / Android Keystore
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ accessToken: token, user, isAuthenticated: true });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ accessToken: null, user: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    try {
      const [token, userJson] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson) as AuthState['user'];
        set({ accessToken: token, user, isAuthenticated: true });
      }
    } catch {
      // Secure store failure — stay logged out
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (updates) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...updates };
    set({ user: updated });
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated)).catch(() => {});
  },
}));
