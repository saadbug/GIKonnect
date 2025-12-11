"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../app/lib/firebase";

// User Profile Interface
export interface UserProfile {
  fullName: string;
  email: string;
  role: "admin" | "cr" | "student";
  faculty: string;
  batch: string | null;
  designation: string;
}

// Auth Context Type
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

// Create typed context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider Props
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Force token refresh to ensure emailVerified is up-to-date
        try {
          await firebaseUser.getIdTokenResult(true);
          await firebaseUser.reload();
        } catch (error) {
          console.error("Error refreshing token:", error);
        }
      }

      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch user profile from Firestore
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            // Ensure email is included (merge from User if not in Firestore)
            // Type-safe mapping with defaults
            const userProfile: UserProfile = {
              fullName: data.fullName || "",
              email: data.email || firebaseUser.email || "",
              role: (data.role === "admin" || data.role === "cr" || data.role === "student")
                ? data.role
                : "student",
              faculty: data.faculty || "",
              batch: data.batch || null,
              designation: data.designation || "",
            };
            setUserProfile(userProfile);
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

