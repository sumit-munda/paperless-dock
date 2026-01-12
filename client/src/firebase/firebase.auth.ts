import { getAuth, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { firebaseApp } from "./firebase.config";

// auth tools
export const firebaseAuth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
export const onauthChange = onAuthStateChanged;
