import { API_BASE_URL } from "./config";

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const data: { status: string } = await response.json();

    return data.status === "ok";
  } catch {
    return false;
  }
}
