// types/api.ts
// Standard API response shapes returned by the backend

// Generic API response with data payload
export type DataResponse<T> = {
  success: boolean;
  data: T;
};

// Generic API response with only a message
export type MessageResponse = {
  success: boolean;
  message: string;
};
