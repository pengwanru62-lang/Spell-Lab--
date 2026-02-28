const DEFAULT_API_HOST =
  typeof window !== "undefined" ? window.location.hostname : "localhost";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || `http://${DEFAULT_API_HOST}:8080`;

export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

function readTokenFromCookie(cookieName: string) {
  if (typeof document === "undefined") {
    return undefined;
  }
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${cookieName}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const authToken = token || readTokenFromCookie("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (payload.code !== 0) {
    throw new Error(payload.message);
  }
  return payload.data;
}

export async function apiPost<T, B>(
  path: string,
  body: B,
  token?: string
): Promise<T> {
  const authToken = token || readTokenFromCookie("token");
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let requestBody: BodyInit | null | undefined;
  if (body instanceof FormData) {
    requestBody = body;
    // Do NOT set Content-Type for FormData, browser sets it with boundary
  } else {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: requestBody,
    cache: "no-store",
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (payload.code !== 0) {
    throw new Error(payload.message);
  }
  return payload.data;
}
