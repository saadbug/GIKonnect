"use client";

import { useAuthProtection } from "@/hooks/useAuthProtection";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboard() {
  useAuthProtection(); // Runs the security check
  const { user, userProfile, loading: authLoading } = useAuth() as any; // Gets the data

  // Rest of your admin dashboard code here
  return (
    <div>
      <h1>Admin Dashboard</h1>
      {authLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p>User: {user?.email}</p>
          <p>Profile: {userProfile ? "Loaded" : "No profile"}</p>
        </div>
      )}
    </div>
  );
}
