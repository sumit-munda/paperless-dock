export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      ...options,
    });
  } catch {
    throw new Error(
      "Unable to connect to the server. Please check your connection and try again.",
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
      throw new Error("The server returned an invalid JSON response.");
    }
    throw error;
  }
}
