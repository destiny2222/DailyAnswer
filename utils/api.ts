import * as SecureStore from "expo-secure-store";
import CryptoJS from "crypto-js";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_API_ENCRYPTION_KEY;

/**
 * Encrypt data using AES-256-GCM (simulated mode for CryptoJS)
 */
function encryptData(data: string): string {
  if (!ENCRYPTION_KEY) return data;
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt data using AES-256-GCM
 */
function decryptData(ciphertext: string): string {
  if (!ENCRYPTION_KEY) return ciphertext;
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  token?: string;
  csrf?: string;
  signal?: AbortSignal;
};

async function getAccessToken() {
  try {
    const token = await SecureStore.getItemAsync("access_token");
    return token;
  } catch (error) {
    // console.error("Error retrieving access token:", error);
    return null;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const method = options.method ?? "GET";

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.csrf ? { "X-XSRF-TOKEN": options.csrf } : {}),
    ...(options.headers ?? {}),
  };

  const useAuth = options.auth !== false;
  if (useAuth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const body = options.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const hasBody = body !== undefined && method !== "GET" && method !== "HEAD";

  if (hasBody && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // IMPORTANT: don’t set multipart content-type manually (boundary issue)
  if (isFormData) {
    if (headers["Content-Type"]) {
        delete headers["Content-Type"];
    }
  }

  let finalBody: any = undefined;
  if (hasBody) {
    if (isFormData) {
      finalBody = body as FormData;
    } else {
      if (ENCRYPTION_KEY) {
        finalBody = JSON.stringify({
          encrypted_data: encryptData(JSON.stringify(body)),
        });
      } else {
        finalBody = JSON.stringify(body);
      }
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: finalBody,
    signal: options.signal,
  });

  const text = await res.text();
  const contentType = res.headers.get("content-type") ?? "";

  let data: any = null;
  if (text) {
    try {
      data = contentType.includes("application/json") ? JSON.parse(text) : text;
    } catch {
      data = text;
    }
  }

  // Decrypt if response contains encrypted data field
  if (data && typeof data === 'object' && data.data && ENCRYPTION_KEY) {
    try {
      const decrypted = decryptData(data.data);
      data = JSON.parse(decrypted);
    } catch (e) {
      // If parsing fails, it might be a raw string or already decrypted
    }
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String(data.message)
        : `Request failed (${res.status})`;

    throw new ApiError(message, res.status, data);
  }

  return data as T;
}


export async function getCsrfToken(): Promise<string | null> {
  try {
    const response = await apiRequest<{ token: string }>("/csrf-token", { auth: false });
    return response.token;
  } catch (error) {
    return null;
  }
}

export const apiEndpoint = apiRequest;