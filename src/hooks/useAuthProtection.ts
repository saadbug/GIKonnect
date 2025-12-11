"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/app/lib/firebase";

export function useAuthProtection() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const publicRoutes = ["/login", "/signup"];
    const isPublicRoute = publicRoutes.includes(pathname);
    const isAdmin = user?.email === "admin@giki.edu.pk"; 

    // 1. UNAUTHENTICATED USER TRYING TO ACCESS PRIVATE PAGE
    if (!user && !isPublicRoute) {
      router.push("/login");
      return;
    }

    // 2. THE FIREWALL: AUTHENTICATED BUT UNVERIFIED
    // This catches the "Second Click" race condition.
    if (user && !user.emailVerified && !isAdmin) {
        console.log("⛔ SECURITY: Unverified user detected. Force signing out.");
        
        // A. Kill the session immediately
        signOut(auth).then(() => {
            // B. Send them back to login with a clear state
            router.push("/login");
        });
        return;
    }

    // 3. ONBOARDING CHECK (Verified Users Only)
    // If they have no profile data yet, send to onboarding
    if (user && user.emailVerified && !userProfile && pathname !== "/onboarding") {
      router.push("/onboarding");
      return;
    }

    // 4. PREVENT RE-LOGIN (Verified Users Only)
    // If they are logged in + verified + have profile, kick them out of login/signup pages
    if (user && user.emailVerified && userProfile && isPublicRoute) {
        router.push("/");
    }

  }, [user, userProfile, loading, router, pathname]);
}