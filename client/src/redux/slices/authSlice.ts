import type { SessionUser } from "@/types/auth";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Auth state
interface AuthState {
  user: SessionUser | null;
  initialized: boolean;
}

// Typed initial state
const initialState: AuthState = {
  user: null,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Sets authenticated user after login / session fetch
    setUser: (state, action: PayloadAction<SessionUser>) => {
      state.user = action.payload;
      state.initialized = true;
    },

    // Clears auth state on logout / session expiry
    clearUser: (state) => {
      state.user = null;
      state.initialized = true
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;

// useDispatch → to update auth state (setUser, clearUser)
// useSelector → to read auth state (e.g. isAuthenticated, user)
