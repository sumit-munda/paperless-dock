import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from "./firebase.config";

// Firebase Auth instance (used by auth services)
export const firebaseAuth = getAuth(firebaseApp);
// Google provider for OAuth login
export const googleProvider = new GoogleAuthProvider();
