"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getStudentName } from "@/app/lib/studentData"; 
import { Loader2, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  // Identity State
  const [studentName, setStudentName] = useState("Student");
  const [batch, setBatch] = useState("");
  
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user?.email) {
      const match = user.email.match(/^u(\d{7})@giki\.edu\.pk$/i);
      if (match) {
        const regNo = match[1];
        
        // 1. Get Name
        const detectedName = getStudentName(regNo);
        if (detectedName) setStudentName(detectedName);

        // 2. Get Batch
        const year = parseInt(regNo.substring(0, 4));
        if (!isNaN(year)) {
            setBatch(`Batch ${year - 1990}`);
        }
      }
    }
  }, [user]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!user) {
        setError("Session lost. Please login again.");
        setLoading(false);
        return;
    }

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            uid: user.uid, 
            code: code 
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Verification failed");

      setSuccess(true); 

      await user.reload();
      await user.getIdToken(true);

      setTimeout(() => router.push("/onboarding"), 2000);

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    } 
  };

  if (authLoading) {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* --- LIVE BACKGROUND --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]"
          animate={{ x: [0, 50, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]"
          animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        {success && (
            <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 2], opacity: [0, 0.5, 0] }}
                transition={{ duration: 1 }}
                className="absolute inset-0 bg-green-500/20 z-0"
            />
        )}
      </div>

      {/* --- MAIN CARD --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="text-center mb-8">
                {/* Icon */}
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-colors duration-500 ${success ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-blue-600/20 text-blue-400 border border-blue-500/30"}`}
                >
                    {success ? (
                        <CheckCircle2 size={32} className="drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                    ) : (
                        <ShieldCheck size={32} className="drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                    )}
                </motion.div>
                
                {/* --- 1. WELCOME NAME --- */}
                <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                    {success ? "Identity Verified" : `Welcome, ${studentName}`}
                </h1>

                {/* --- 2. BATCH TAG --- */}
                {!success && batch && (
                    <div className="flex justify-center mb-6">
                        <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                            {batch}
                        </span>
                    </div>
                )}

                {/* --- 3. EMAIL INSTRUCTION --- */}
                <p className="text-slate-400 text-sm leading-relaxed">
                    {success 
                        ? "Redirecting you to onboarding..." 
                        : <>Enter code sent at <br/><span className="text-blue-400 font-mono font-semibold bg-blue-500/5 px-2 py-0.5 rounded">{user?.email}</span></>
                    }
                </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
                <div className="relative group">
                    <div className={`absolute -inset-0.5 rounded-xl blur opacity-30 transition duration-500 group-hover:opacity-75 ${error ? "bg-red-600" : "bg-gradient-to-r from-blue-600 to-purple-600"}`}></div>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length <= 6) setCode(val);
                            if (val.length === 6) setError("");
                        }}
                        disabled={success || loading}
                        className={`
                            relative w-full bg-slate-950 text-white text-center text-4xl font-mono tracking-[0.5em] py-5 rounded-xl border-2 outline-none transition-all duration-300
                            ${error 
                                ? "border-red-500/50 focus:border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" 
                                : success
                                    ? "border-green-500/50 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                                    : "border-slate-800 focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                            }
                        `}
                        placeholder="000000"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                        {!code && <span className="text-4xl tracking-[0.5em]">______</span>}
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-red-400 text-sm text-center font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || success || code.length !== 6}
                    className={`
                        w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg
                        ${success 
                            ? "bg-green-600 text-white shadow-green-900/20 cursor-default" 
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        }
                    `}
                >
                    {loading ? (
                        <Loader2 className="animate-spin h-6 w-6" />
                    ) : success ? (
                        <>Success <CheckCircle2 className="h-6 w-6" /></>
                    ) : (
                        <>Verify Code <ArrowRight className="h-5 w-5" /></>
                    )}
                </motion.button>
            </form>

            <div className="mt-6 text-center">
                <button className="text-xs text-slate-500 transition-colors flex items-center justify-center gap-1 mx-auto group">
                    Check your junk folder. It will most likely be there.
                </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
}