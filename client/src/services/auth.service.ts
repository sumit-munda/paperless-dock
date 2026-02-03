import { firebaseAuth, googleProvider } from "@/firebase/firebase.auth";
import { baseApi } from "@/redux/api/baseApi";
import { clearUser } from "@/redux/slices/authSlice";
import { disableFetch } from "@/redux/slices/sessionSlice";
import { store } from "@/redux/store";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "sonner";

// services/auth.service.ts
// Auth related services Google sign-in + logout

// Google OAuth sign-in via Firebase
export const signinWithGoogle = () => {
  return signInWithPopup(firebaseAuth, googleProvider);
};

// Logout flow (supports both Google + credentials users)
export const logout = async () => {
  try {
     // 1. Clear client-side auth/session state
    store.dispatch(clearUser());
    store.dispatch(disableFetch());
    store.dispatch(baseApi.util.resetApiState());

    // 2. Firebase logout (only Google-auth users)
   try {
     await signOut(firebaseAuth).catch(() => {});
   } catch (error) {
      // ignore firebase logout errors
   }

    // 3. Backend logout (clears HTTP-only cookies/credentials auth)
    await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    toast.success("Logged out successfully");

    // 4. Redirect to fully reset app state
    window.location.href = "/";
  } catch (err) {
    console.error("Logout failed", err);
    toast.error("Logout failed");
  }
};
