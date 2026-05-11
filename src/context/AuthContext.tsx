"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js"; // Import Supabase User type
import { supabase } from "@/app/lib/supabase"; // Import your Supabase client

// User Profile Interface (Updated with 'faculty' role)
export interface UserProfile {
  fullName: string;
  email: string;
  role: "admin" | "cr" | "student" | "faculty"; 
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
    let mounted = true;

    // Helper function to fetch the profile from Postgres
    const fetchProfile = async (sessionUser: User | null) => {
      if (!sessionUser) {
        if (mounted) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
        return;
      }

      if (mounted) setUser(sessionUser);

      try {
        // Query the new Postgres 'profiles' table
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionUser.id)
          .single();

        if (data && mounted) {
          const profile: UserProfile = {
            fullName: data.full_name || "", // Map snake_case to camelCase
            email: data.email || sessionUser.email || "",
            role: (data.role === "admin" || data.role === "cr" || data.role === "faculty" || data.role === "student")
              ? data.role
              : "student",
            faculty: data.faculty || "",
            batch: data.batch || null,
            designation: data.designation || "",
          };
          setUserProfile(profile);
        } else {
          if (mounted) setUserProfile(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        if (mounted) setUserProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // 1. Initial Session Check (Runs immediately on mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session?.user || null);
    });

    // 2. Set up the Supabase Realtime Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // This fires on login, logout, and when the token refreshes natively
        fetchProfile(session?.user || null);
      }
    );

    // Cleanup listener on unmount
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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