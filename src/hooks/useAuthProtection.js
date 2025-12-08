"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export function useAuthProtection() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while loading
    if (loading) {
      return;
    }

    // Public routes that don't need authentication
    const publicRoutes = ["/login", "/signup"];
    const isPublicRoute = publicRoutes.includes(pathname);

    // If on a public route, don't redirect
    if (isPublicRoute) {
      return;
    }

    // If user is not authenticated, redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    // If user is authenticated but has no profile, redirect to onboarding
    // Skip this check for the onboarding page itself
    if (user && !userProfile && pathname !== "/onboarding") {
      router.push("/onboarding");
      return;
    }
  }, [user, userProfile, loading, router, pathname]);

  return { user, userProfile, loading };
}

