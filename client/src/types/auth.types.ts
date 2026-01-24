import type { SessionUser } from "./types";

export type SessionResponse = {
  success: boolean;
  data: SessionUser;
};

export type MessageResponse = {
  success: boolean;
  message: string;
};
