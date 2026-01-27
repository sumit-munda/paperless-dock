import { createSlice } from "@reduxjs/toolkit";

// slices/sessionSlice.ts
// Controls whether sesson-related API calls (like /auth/session) should run

interface SessionState {
  shouldFetch: boolean;
}

const initialState: SessionState = {
  shouldFetch: true,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    // Enable sesson fetching
    enableFetch: (state) => {
      state.shouldFetch = true;
    },
    
    // Disable session fetching
    disableFetch: (state) => {
      state.shouldFetch = false;
    },
  },
});

export const { disableFetch, enableFetch } = sessionSlice.actions;
export default sessionSlice.reducer;
