import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { logger } from "./logger";

const BASE_URL = (() => {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
  if (!url) return url;

  // In development, Android emulator can't reach 127.0.0.1 (that's itself).
  // Replace it with 10.0.2.2 which is the Android emulator's alias for the host machine.
  if (__DEV__ && Platform.OS === "android") {
    return url.replace("127.0.0.1", "10.0.2.2").replace("https://", "http://");
  }
  return url;
})();

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

/**
 * Pull the most useful message out of a failed API response.
 * Laravel uses `message`, `error`, or `errors` depending on the failure.
 */
function extractErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const payload = data as Record<string, unknown>;

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }

    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }

    const errors = payload.errors;
    if (Array.isArray(errors)) {
      const messages = errors.filter(
        (item): item is string => typeof item === "string" && item.trim() !== "",
      );
      if (messages.length) return messages.join(", ");
    } else if (errors && typeof errors === "object") {
      const messages = Object.values(errors as Record<string, unknown>)
        .flat()
        .filter(
          (item): item is string => typeof item === "string" && item.trim() !== "",
        );
      if (messages.length) return messages.join(", ");
    }
  }

  // Fall back to a plain-text body (ignore HTML error pages)
  if (typeof data === "string" && data.trim() && !data.trim().startsWith("<")) {
    return data.trim();
  }

  return `Request failed (${status})`;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const method = options.method ?? "GET";

  // logger.debug(`[API] ${method} ${path}`, options.body ? 'with body' : 'no body');

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Api-Token": process.env.EXPO_PUBLIC_API_ACCESS_TOKEN || "",
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
      const message = extractErrorMessage(data, res.status);

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