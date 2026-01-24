import type { SessionUser } from "@/types/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
}

// Typed initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  // useDispatch → to update auth state (setUser, clearUser)
  // useSelector → to read auth state (e.g. isAuthenticated, user)
  reducers: {
    // Sets authenticated user after login / session fetch
    setUser: (state, action: PayloadAction<SessionUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    // Clears auth state on logout / session expiry
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
