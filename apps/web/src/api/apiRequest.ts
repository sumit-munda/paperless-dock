import { API_BASE_URL } from "./config";

let csrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/csrf-token`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to obtain CSRF token.");
  }

  const data: { csrfToken: string } = await response.json();

  csrfToken = data.csrfToken;

  return csrfToken;
}

export function clearCsrfToken(): void {
  csrfToken = null;
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();

  const headers = new Headers(options.headers);

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("X-CSRF-Token", await getCsrfToken());
  }

  let response: Response;

  try {
    response = await fetch(url, {
      credentials: "include",
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      "Unable to connect to the server. Please check your connection and try again.",
      { cause: error },
    );
  }

  if (!response.ok) {
    throw new Error(`API request failed: HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("The server returned an invalid JSON response.", {
        cause: error,
      });
    }

    throw error;
  }
}
