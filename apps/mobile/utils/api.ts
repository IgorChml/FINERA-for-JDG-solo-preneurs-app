import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

const ACCESS_TOKEN_KEY = 'finera_access_token';

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
    });
  } catch (networkError) {
    throw new ApiError(0, 'Brak połączenia z internetem. Sprawdź sieć.');
  }

  if (response.status === 401) {
    // Try to refresh the token
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${refreshed}`;
      response = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(
      response.status,
      (errorData as { error?: string }).error ?? `HTTP ${response.status}`,
      errorData
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { accessToken: string };
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

export { ApiError };
