"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 1. Validate Input
    if (!email.toLowerCase().endsWith("@giki.edu.pk")) {
      setError("Please use your official GIKI email (@giki.edu.pk).");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      // 2. Create User in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Trigger OTP Email
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: user.email, 
          uid: user.uid 
        }),
      });

      if (!res.ok) {
        console.error("Failed to send OTP email immediately.");
      }

      // 4. Redirect to OTP Entry Page
      router.push("/verify-email");
      
    } catch (error: any) {
      console.error("Sign up error:", error);
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please login instead.");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("An error occurred. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans text-white">
      
      {/* --- LAVA LAMP BACKGROUND --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"
          animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-[30%] -left-[10%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]"
          animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* --- CENTERED HEADER SECTION --- */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex flex-col items-center text-center mb-8"
        >
           {/* ANIMATED LOGO CONTAINER */}
           <div className="mb-4">
             <AnimatedLogo size="lg" />
          </div>

         
          <p className="text-slate-400">
            Join the campus network.
          </p>
        </motion.div>

        {/* --- MAIN CARD --- */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8"
        >
          {/* --- SIGN UP FORM --- */}
          <form onSubmit={handleSignUp} className="space-y-5">
            
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 ml-1">GIKI Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="u20XXXXX@giki.edu.pk"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-11 pr-12 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 ml-1">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-11 pr-12 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300">
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
            </motion.button>

            {/* Links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Already have an account? <Link href="/login" className="text-blue-400 hover:underline font-semibold">Log In</Link>
              </p>
              <p className="text-xs text-slate-600 mt-4">
                Only @giki.edu.pk email addresses allowed
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}