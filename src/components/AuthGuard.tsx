"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../app/lib/firebase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isPublicRoute = pathname === "/login" || pathname === "/signup";
      
      if (!user && !isPublicRoute) {
        // User is not logged in and trying to access a protected route
        router.push("/login");
      }
      
      // Always set checking to false after auth state is determined
      setIsChecking(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  // Show nothing while checking auth status
  if (isChecking) {
    return null;
  }

  return <>{children}</>;
}

