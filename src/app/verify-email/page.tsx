"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/app/lib/firebase";
import { Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!user) {
        setError("No user found. Please login.");
        setLoading(false);
        return;
    }

    try {
      // 1. Verify Code
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ uid: user.uid, code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 2. Refresh Token to sync "emailVerified: true" to the client
      await user.reload();
      await user.getIdToken(true);

      // 3. Go to Onboarding
      router.push("/onboarding");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="w-full max-w-md p-8 bg-slate-900 rounded-xl border border-white/10">
        <h2 className="text-2xl font-bold mb-4 text-center">Enter Verification Code</h2>
        <p className="text-slate-400 text-center mb-6">Sent to {user?.email}</p>
        
        <form onSubmit={handleVerify} className="space-y-4">
          <input 
            value={code} 
            onChange={(e) => setCode(e.target.value)}
            className="w-full bg-slate-800 p-4 text-center text-2xl tracking-widest rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="123456" 
            maxLength={6}
          />
          {error && <p className="text-red-400 text-center">{error}</p>}
          <button disabled={loading} className="w-full bg-blue-600 py-3 rounded-lg font-bold">
            {loading ? <Loader2 className="animate-spin mx-auto"/> : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}