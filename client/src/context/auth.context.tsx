import { firebaseAuth } from "@/firebase/firebase.auth";
import {
  signupWithEmailAndPassword,
  signinWithEmailAndPassword,
  signinWithGoogle,
  logout,
} from "@/services/auth.service";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signupWithEmailAndPassword: (email: string, password: string) => Promise<any>;
  signinWithEmailAndPassword: (email: string, password: string) => Promise<any>;
  signinWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        signupWithEmailAndPassword,
        signinWithEmailAndPassword,
        signinWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

