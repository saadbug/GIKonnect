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

    // FIX 1: We must allow unauthenticated users to access the verify-email page 
    // because Supabase doesn't grant a valid session until AFTER they verify the OTP!
    const publicRoutes = ["/login", "/signup", "/verify-email"];
    const isPublicRoute = publicRoutes.includes(pathname);
    const isVerifyPage = pathname === "/verify-email"; 
    const isAdmin = user?.email === "admin@giki.edu.pk"; 

    // FIX 2: Firebase uses 'emailVerified', but Supabase uses 'email_confirmed_at'
    const isVerified = !!user?.email_confirmed_at;

    // 1. UNAUTHENTICATED? -> Force Login
    // If they aren't logged in and aren't on a public page, kick them to login.
    if (!user && !isPublicRoute) {
      router.push("/login");
      return;
    }

    // 2. UNVERIFIED? -> Force Verification Page
    // If logged in but somehow NOT verified (and not Admin):
    if (user && !isVerified && !isAdmin) {
        if (!isVerifyPage) {
            router.push("/verify-email");
        }
        return;
    }

    // 3. NO PROFILE? -> Force Onboarding
    // They are verified now. If they don't have a profile doc, send to onboarding.
    if (user && isVerified && !userProfile && pathname !== "/onboarding") {
      router.push("/onboarding");
      return;
    }

    // 4. FULLY SETUP? -> Send Home
    // If they are fully verified and have a profile, don't let them see login/signup/verify pages.
    if (user && isVerified && userProfile && (isPublicRoute || pathname === "/onboarding")) {
        router.push("/");
    }

  }, [user, userProfile, loading, router, pathname]);
}