import { createSlice } from "@reduxjs/toolkit";

const sessionSlice = createSlice({
  name: "session",
  initialState: { shouldFetch: true },
  reducers: {
    disableFetch: (state) => {
      state.shouldFetch = false;
    },
    enableFetch: (state) => {
      state.shouldFetch = true;
    },
  },
});

export const { disableFetch, enableFetch } = sessionSlice.actions;
export default sessionSlice.reducer;
