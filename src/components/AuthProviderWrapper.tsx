"use client";

import { ReactNode } from "react";
import { AuthProvider } from "../context/AuthContext";

interface AuthProviderWrapperProps {
  children: ReactNode;
}

export default function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  return <AuthProvider>{children}</AuthProvider>;
}

