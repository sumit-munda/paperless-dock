import { firebaseAuth, googleProvider } from "@/firebase/firebase.auth";
import { clearUser } from "@/redux/slices/authSlice";
import { store } from "@/redux/store";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "sonner";

export const signinWithGoogle = () => {
  return signInWithPopup(firebaseAuth, googleProvider);
};

export const logout = async () => {
  try {
    // Clear Redux auth state
    store.dispatch(clearUser());

    // Logout from firebase if logged in
    try {
      await signOut(firebaseAuth);
      toast("Logged out successfully");
    } catch (firebaseErr) {
      console.warn("Firebase logout failed", firebaseErr);
      toast.error("Logout failed");
    }

    // Call backend to clear cookies (credentials auth)
    try {
      await fetch("http://localhost:5000/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      toast.success("Logged out successfully");
    } catch (backendErr) {
      console.warn("Backend logout failed", backendErr);
      toast.error("Logout failed");
    }

    // Redirect to login page
    window.location.href = "/";
  } catch (err) {
    console.error("Logout failed", err);
    toast.error("Logout failed");
  }
};
