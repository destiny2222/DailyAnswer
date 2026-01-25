import * as SecureStore from "expo-secure-store";
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("Missing EXPO_PUBLIC_API_BASE_URL in your env");
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
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const method = options.method ?? "GET";

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
    delete headers["Content-Type"];
  }

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

    throw new ApiError(message, res.status, data);
  }

  return data as T;
}



export const apiEndpoint = apiRequest;