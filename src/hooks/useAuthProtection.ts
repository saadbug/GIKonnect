// src/hooks/useAuthProtection.ts

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export function useAuthProtection() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Don't redirect while loading
    if (loading) {
      return;
    }

    // Public routes that don't need authentication OR verification
    // NOTE: /onboarding is public because users land here immediately after verified login
    const publicRoutes = ["/login", "/signup", "/onboarding"];
    const isPublicRoute = publicRoutes.includes(pathname);

    // If on a public route, don't redirect (let them use the page)
    if (isPublicRoute) {
      return;
    }

    // A. Check Authentication
    if (!user) {
      router.push("/login");
      return;
    }

    // B. Check Verification (Crucial Step)
    const isAdmin = user.email === "admin@giki.edu.pk"; // Your Admin Exception
    
    if (!user.emailVerified && !isAdmin) {
      // If unverified, sign them out and redirect to login (where they will see the prompt)
      // This is a safety measure if they somehow bypass the manual signout during signup.
      // Firebase automatically signs them back in on refresh if you don't handle it.
      router.push("/login?verify=true"); 
      return;
    }

    // C. Check Profile (Onboarding)
    if (user && user.emailVerified && !userProfile && pathname !== "/onboarding") {
      router.push("/onboarding");
      return;
    }
  }, [user, userProfile, loading, router, pathname]);

  return { user, userProfile, loading };
}