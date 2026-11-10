import { apiRequest } from "./apiRequest";
import { API_BASE_URL } from "./config";

export interface LibraryBook {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  language: string;
  pageCount: number | null;
  hasContent: boolean;
  authors: string[];
  categories: string[];
}

export interface ReadingProgress {
  position: string;
  percentage: number;
  lastReadAt: string | null;
}

export interface LibraryItem {
  id: string;
  purchasedAt: string;
  book: LibraryBook;
  readingProgress: ReadingProgress;
}

interface LibraryResponse {
  library: LibraryItem[];
  count: number;
}

export async function getUserLibrary(): Promise<LibraryResponse> {
  return apiRequest<LibraryResponse>(`${API_BASE_URL}/api/library`);
}

export function getBookPdfUrl(bookId: string): string {
  return `${API_BASE_URL}/api/library/${encodeURIComponent(bookId)}/content`;
}
