import { firebaseAuth, googleProvider } from "@/firebase/firebase.auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

export const signupWithEmailAndPassword = (email: string, password: string) => {
  return createUserWithEmailAndPassword(firebaseAuth, email, password);
};

export const signinWithEmailAndPassword = (email: string, password: string) => {
  return signInWithEmailAndPassword(firebaseAuth, email, password);
};

export const signinWithGoogle = () => {
  return signInWithPopup(firebaseAuth, googleProvider);
};

export const logout = () => {
  return signOut(firebaseAuth);
};
