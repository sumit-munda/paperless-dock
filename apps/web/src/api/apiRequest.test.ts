import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, clearCsrfToken } from "./apiRequest";

describe("apiRequest", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    clearCsrfToken();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON for a successful response", async () => {
    const book = { id: "book-001", title: "Atomic Habits" };

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(book), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await apiRequest<typeof book>("/api/books/book-001");

    expect(result).toEqual(book);
  });

  it("uses GET when no request options are supplied", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ books: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await apiRequest<{ books: unknown[] }>("/api/books");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/books",
      expect.objectContaining({
        credentials: "include",
      }),
    );

    const requestOptions = fetchMock.mock.calls[0][1];

    expect(requestOptions.method).toBeUndefined();
    expect(requestOptions.headers).toBeInstanceOf(Headers);
  });

  it("passes custom request options to fetch", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ csrfToken: "test-csrf-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 209,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const options: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Atomic Habits" }),
    };

    const result = await apiRequest<{ success: boolean }>(
      "/api/books",
      options,
    );

    expect(result).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const actualRequestOptions = fetchMock.mock.calls[1][1];

    expect(actualRequestOptions.credentials).toBe("include");
    expect(actualRequestOptions.method).toBe("POST");
    expect(actualRequestOptions.body).toBe(options.body);
    expect(actualRequestOptions.headers).toBeInstanceOf(Headers);
    expect(actualRequestOptions.headers.get("Content-Type")).toBe(
      "application/json",
    );
    expect(actualRequestOptions.headers.get("X-CSRF-Token")).toBe(
      "test-csrf-token",
    );
  });

  it.each([404, 500])(
    "throws an HTTP error when the server returns status %i",
    async (status) => {
      fetchMock.mockResolvedValue(new Response(null, { status }));

      await expect(apiRequest("/api/books")).rejects.toThrow(
        `API request failed: HTTP ${status}`,
      );
    },
  );

  it("throws a connection error when the network request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("failed to fetch"));

    await expect(apiRequest("/api/books")).rejects.toThrow(
      "Unable to connect to the server. Please check your connection and try again.",
    );
  });

  it("returns undefined for a 204 No Content response", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await apiRequest<undefined>("/api/books/book-001");

    expect(result).toBeUndefined();
  });

  it("throws a descriptive error when the response contains invalid JSON", async () => {
    fetchMock.mockResolvedValue(
      new Response("invalid json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiRequest("/api/books")).rejects.toThrow(
      "The server returned an invalid JSON response.",
    );
  });
});
