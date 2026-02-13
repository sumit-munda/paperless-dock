// profile/types.ts
// Centralized types for Profile page state & sections

// All editable sections available inside the Profile page.
// Used instead of routing to keep UX fast and contained

export type ProfileSection =
  | "tabs"
  | "profile"
  | "account"
  | "security"
  | "subscription"
  | "preferences"
  | "settings";