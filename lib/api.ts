import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Product, ProductInput } from '@/types/product';

const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const tokenKey = 'menupilot_api_token';
const userKey = 'menupilot_api_user';

export const apiConfigured = Boolean(apiUrl);

export type ApiUser = {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!apiUrl) throw new Error('ยังไม่ได้ตั้งค่า EXPO_PUBLIC_API_URL ในไฟล์ .env.local');

  const token = await AsyncStorage.getItem(tokenKey);
  const response = await fetch(`${apiUrl}/${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || payload.error || payload.data === undefined) {
    throw new Error(payload.error ?? 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
  }
  return payload.data;
}

export async function signIn(username: string, password: string) {
  const result = await request<{ user: ApiUser; token: string }>('api.php?action=login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  await AsyncStorage.multiSet([[tokenKey, result.token], [userKey, JSON.stringify(result.user)]]);
  return result.user;
}

export async function signUp(username: string, password: string) {
  return request<{ user: ApiUser; token: string }>('api.php?action=signup', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function restoreUser(): Promise<ApiUser | null> {
  const storedUser = await AsyncStorage.getItem(userKey);
  const storedToken = await AsyncStorage.getItem(tokenKey);
  if (!storedUser || !storedToken) return null;
  try {
    const currentUser = await request<ApiUser>('api.php?action=me');
    await AsyncStorage.setItem(userKey, JSON.stringify(currentUser));
    return currentUser;
  } catch (error) {
    if (error instanceof Error && error.message === 'ไม่พบคำสั่ง API นี้') {
      return JSON.parse(storedUser) as ApiUser;
    }
    await clearSession();
    return null;
  }
}

export async function clearSession() {
  await AsyncStorage.multiRemove([tokenKey, userKey]);
}

export async function getProducts() {
  const result = await request<Product[]>('api.php?action=products');
  return result;
}

export async function uploadProductImage(imageData: string, mimeType: string) {
  const result = await request<{ url: string }>('api.php?action=upload-image', {
    method: 'POST',
    body: JSON.stringify({ imageData, mimeType }),
  });
  return result.url;
}

export async function createProduct(input: ProductInput) {
  const result = await request<Product>('api.php?action=create-product', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result;
}

export async function updateProduct(id: string, input: ProductInput) {
  const result = await request<Product>('api.php?action=update-product', {
    method: 'POST',
    body: JSON.stringify({ id, ...input }),
  });
  return result;
}

export async function deleteProduct(id: string) {
  await request<{ id: string }>(`api.php?action=delete-product&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}
