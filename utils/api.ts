import * as SecureStore from "expo-secure-store";
import { logger } from "./logger";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("Missing EXPO_PUBLIC_API_BASE_URL in your env");
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  /**
   * Static helper to extract a user-friendly message from an error.
   */
  static getMessage(error: any): string {
    if (error instanceof ApiError) {
      if (error.data && typeof error.data === 'object' && 'errors' in error.data) {
        const errors = error.data.errors;
        if (Array.isArray(errors)) return errors.join(', ');
        if (typeof errors === 'object' && errors !== null) {
          return Object.values(errors).flat().join(', ');
        }
      }
      return error.message;
    }
    return error instanceof Error ? error.message : String(error);
  }
}

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  token?: string;
  signal?: AbortSignal;
};

async function getAccessToken() {
  try {
    const token = await SecureStore.getItemAsync("access_token");
    return token;
  } catch (error) {
    // logger.error("Error retrieving access token:", error);
    return null;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const method = options.method ?? "GET";

  // logger.debug(`[API] ${method} ${path}`, options.body ? 'with body' : 'no body');

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  const useAuth = options.auth !== false;
  if (useAuth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const body = options.body;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const hasBody = body !== undefined && method !== "GET" && method !== "HEAD";

  // Only set JSON content-type for non-FormData bodies
  if (hasBody && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // IMPORTANT: don’t set multipart content-type manually (boundary issue)
  if (isFormData) {
    if (headers["Content-Type"]) {
        delete headers["Content-Type"];
    }
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: hasBody ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
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

    if (!res.ok) {
      const message =
        data && typeof data === "object" && "message" in data
          ? String(data.message)
          : `Request failed (${res.status})`;

      // logger.error(`[API ERROR] ${method} ${path} (${res.status}):`, message);
      throw new ApiError(message, res.status, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // logger.error(`[API NETWORK ERROR] ${method} ${path}:`, error);
    throw error;
  }
}

export const apiEndpoint = apiRequest;