"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function SetupPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [oobCode, setOobCode] = useState<string | null>(null);
  
  // State
  const [email, setEmail] = useState("Verifying link...");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 1. On Mount: Verify the Link Code
  useEffect(() => {
    const code = searchParams.get("oobCode");
    if (!code) {
      setError("Invalid link. Please request a new password reset.");
      setLoading(false);
      return;
    }
    setOobCode(code);

    // Ask Firebase who this code belongs to
    verifyPasswordResetCode(auth, code)
      .then((userEmail) => {
        setEmail(userEmail); // Success! We know the email now.
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("This link has expired or has already been used.");
        setLoading(false);
      });
  }, [searchParams]);

  // 2. Handle Password Save
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;
    setSubmitting(true);

    try {
      // The magic happens here:
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000); // Redirect to login
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-3">Verifying Secure Link...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
        
        {success ? (
          <div className="text-center">
            <div className="inline-flex p-4 bg-green-500/20 rounded-full mb-4 text-green-400">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Set!</h2>
            <p className="text-slate-400">You can now login with your new password.</p>
            <p className="text-xs text-slate-500 mt-4">Redirecting...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-6 text-center">Set Your Password</h1>
            
            {error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center text-sm">
                <AlertCircle className="inline-block mb-1" size={20} />
                <p>{error}</p>
                <button onClick={() => router.push("/login")} className="mt-3 text-white underline hover:text-red-200">
                    Go Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSavePassword} className="space-y-6">
                
                {/* Read-Only Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Account Email</label>
                  <input 
                    type="email" 
                    value={email} 
                    disabled 
                    className="w-full bg-slate-800/50 border border-slate-700 text-slate-400 rounded-xl px-4 py-3 cursor-not-allowed"
                  />
                </div>

                {/* New Password Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      minLength={6}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-500 hover:text-white">
                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin"/> : "Set Password & Login"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}