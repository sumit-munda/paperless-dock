import { firebaseAuth, googleProvider } from "@/firebase/firebase.auth";
import {
  signInWithPopup,
  signOut
} from "firebase/auth";

export const signinWithGoogle = () => {
  return signInWithPopup(firebaseAuth, googleProvider);
};

export const logout = () => {
  return signOut(firebaseAuth);
};
