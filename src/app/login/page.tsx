"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { 
  Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, HelpCircle, 
  CheckCircle2, XCircle, Unlock, ArrowRight 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function LoginPage() {
  const router = useRouter();
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation State
  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null); 
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  
  // UI State
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  // 👇 NEW: Store the user's name for the animation
  const [userName, setUserName] = useState(""); 

  // Clear stale sessions
  useEffect(() => {
    signOut(auth);
  }, []);

  // --- REAL TIME EMAIL VALIDATION ---
  useEffect(() => {
    if (!email) {
      setIsEmailValid(null);
      return;
    }
    const timer = setTimeout(() => {
      if (email.toLowerCase().endsWith("@giki.edu.pk")) {
        setIsEmailValid(true);
      } else {
        setIsEmailValid(false);
      }
    }, 500); 
    return () => clearTimeout(timer);
  }, [email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (isEmailValid === false) {
      setError("Only @giki.edu.pk emails are allowed.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await user.reload();
      const isVerified = auth.currentUser?.emailVerified;
      const isAdmin = user.email === "admin@giki.edu.pk";

      if (!isVerified && !isAdmin) {
        await signOut(auth);
        setError("Access Denied. Please verify your email first.");
        setLoading(false);
        return;
      }

      // Check User Doc to get their Name
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      // 👇 NEW: Extract name if profile exists
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Get just the first name for a cleaner look
        const firstName = userData.fullName ? userData.fullName.split(" ")[0] : "Student";
        setUserName(firstName);
      } else {
        setUserName(""); // No profile yet (will go to onboarding)
      }
      
      setLoading(false); 
      setLoginSuccess(true); 
      
      setTimeout(() => {
        if (userDoc.exists()) {
          router.push("/");
        } else {
          router.push("/onboarding");
        }
      }, 2000); // Increased slightly to 2s so they can read the name

    } catch (error: any) {
      console.error("Login error:", error);
      await signOut(auth);
      setLoading(false);
      
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setError("Invalid email or password. Did you sign up first?");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many attempts. Try again later.");
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    if (!email.toLowerCase().endsWith("@giki.edu.pk")) {
        setError("Please use your official GIKI email.");
        return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");

    const actionCodeSettings = {
        url: 'https://gikonnect.vercel.app/setup-password', 
        handleCodeInApp: true,
    };

    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setSuccessMsg(`Reset link sent to ${email}. Check your Outlook!`);
    } catch (err: any) {
      setError("Failed to send reset email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-slate-950 flex items-center justify-center px-4 overflow-hidden font-sans text-white relative">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" animate={{ x: [0, -100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        
        {/* HEADER SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex flex-col items-center text-center mb-6"
        >
          <div className="mb-4">
             <AnimatedLogo size="lg" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-lg mb-1">GIKonnect</h1>
          <p className="text-slate-400">Your Campus, Synchronized.</p>
        </motion.div>

        {/* --- MAIN CARD --- */}
        <AnimatePresence mode="wait">
          {!loginSuccess ? (
            <motion.div 
              key="login-form"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: error ? [0, -10, 10, -10, 10, 0] : 0, 
                borderColor: error ? "rgba(239, 68, 68, 0.4)" : "rgba(255, 255, 255, 0.1)"
              }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              transition={{ duration: 0.3 }}
              className={`bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border p-8 w-full ${error ? 'border-red-500/40 shadow-red-500/10' : 'border-white/10'}`}
            >
              <form onSubmit={handleLogin} className="space-y-5">
                
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300 ml-1">GIKI Email</label>
                  <div className="relative group">
                    <Mail className={`absolute left-4 top-3.5 h-5 w-5 transition-colors ${isEmailValid ? "text-green-400" : "text-slate-500"}`} />
                    <input
                      type="email"
                      value={email}
                      onBlur={() => setIsEmailTouched(true)}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="u20XXXXX@giki.edu.pk"
                      className={`block w-full pl-11 pr-10 py-3.5 bg-slate-950/50 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all
                        ${isEmailValid === false && isEmailTouched 
                          ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" 
                          : isEmailValid 
                            ? "border-green-500/50 focus:border-green-500 focus:ring-green-500/20" 
                            : "border-slate-700/50 focus:border-blue-500/50 focus:ring-blue-500/50"
                        }
                      `}
                    />
                    <div className="absolute right-4 top-3.5 pointer-events-none">
                       {isEmailValid === true && <CheckCircle2 className="h-5 w-5 text-green-400 animate-in zoom-in" />}
                       {isEmailValid === false && isEmailTouched && <XCircle className="h-5 w-5 text-red-400 animate-in zoom-in" />}
                    </div>
                  </div>
                  {isEmailValid === false && isEmailTouched && (
                    <p className="text-xs text-red-400 ml-1">Must be an official @giki.edu.pk email</p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300 ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-11 pr-12 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-white text-slate-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <button 
                        type="button" 
                        onClick={handleForgotPassword}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        Forgot Password?
                    </button>
                  </div>
                </div>

                {/* Feedback Messages */}
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {successMsg && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                    <HelpCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}

                {/* Login Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:from-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
                </motion.button>
              </form>

              {/* --- NEW SIGN UP SECTION --- */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-sm text-slate-400 text-center mb-3">
                  First time using GIKonnect?
                </p>
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>Activate Account</span>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                  </motion.button>
                </Link>
              </div>

            </motion.div>
          ) : (
            // Success Animation
            <motion.div 
                key="success-view"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 backdrop-blur-xl rounded-full p-12 border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.3)] flex flex-col items-center justify-center text-center"
            >
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="bg-green-500 text-white p-6 rounded-full mb-4 shadow-lg shadow-green-500/40"
                >
                   <Unlock size={48} strokeWidth={2.5} />
                </motion.div>
                <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-white mb-1"
                >
                    Access Granted
                </motion.h2>
                
                {/* 👇 PERSONALIZED WELCOME MESSAGE */}
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-green-200 text-base"
                >
                    {userName ? `Welcome back, ${userName}.` : "Welcome back."}
                </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}