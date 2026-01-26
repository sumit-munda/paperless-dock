import { firebaseAuth, googleProvider } from "@/firebase/firebase.auth";
import { baseApi } from "@/redux/api/baseApi";
import { clearUser } from "@/redux/slices/authSlice";
import { disableFetch } from "@/redux/slices/sessionSlice";
import { store } from "@/redux/store";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "sonner";

export const signinWithGoogle = () => {
  return signInWithPopup(firebaseAuth, googleProvider);
};

export const logout = async () => {
  try {
     // 1. Clear Redux state
    store.dispatch(clearUser());
    store.dispatch(disableFetch());
    store.dispatch(baseApi.util.resetApiState());

    // 2. Firebase logout (Google auth)
    await signOut(firebaseAuth).catch(() => {});

    // 3. Backend logout (credentials auth)
    await fetch("http://localhost:5000/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    toast.success("Logged out successfully");

    // 4. Redirect
    window.location.href = "/";
  } catch (err) {
    console.error("Logout failed", err);
    toast.error("Logout failed");
  }
};
