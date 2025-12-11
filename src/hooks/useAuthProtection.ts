"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export function useAuthProtection() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const publicRoutes = ["/login", "/signup"];
    const isPublicRoute = publicRoutes.includes(pathname);
    const isVerifyPage = pathname === "/verify-email"; 
    const isAdmin = user?.email === "admin@giki.edu.pk"; 

    // 1. UNAUTHENTICATED? -> Force Login
    // If they aren't logged in and aren't on a public page, kick them to login.
    if (!user && !isPublicRoute) {
      router.push("/login");
      return;
    }

    // 2. UNVERIFIED? -> Force Verification Page
    // If logged in but NOT verified (and not Admin):
    if (user && !user.emailVerified && !isAdmin) {
        // If they are NOT already on the verify page, send them there.
        if (!isVerifyPage) {
            router.push("/verify-email");
        }
        // If they ARE on the verify page, let them stay so they can enter the code.
        return;
    }

    // 3. NO PROFILE? -> Force Onboarding
    // They are verified now. If they don't have a profile doc, send to onboarding.
    if (user && user.emailVerified && !userProfile && pathname !== "/onboarding") {
      router.push("/onboarding");
      return;
    }

    // 4. FULLY SETUP? -> Send Home
    // If they are fully verified and have a profile, don't let them see login/signup/verify pages.
    if (user && user.emailVerified && userProfile && (isPublicRoute || isVerifyPage || pathname === "/onboarding")) {
        router.push("/");
    }

  }, [user, userProfile, loading, router, pathname]);
}