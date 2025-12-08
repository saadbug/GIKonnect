"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import {
  User,
  GraduationCap,
  Building2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import { motion } from "framer-motion";

const FACULTY_OPTIONS = [
  "Artificial Intelligence",
  "Computer Engineering",
  "Computer Science",
  "Cyber Security",
  "Chemical Engineering",
  "Civil Engineering",
  "Data Science",
  "Electrical Engineering",
  "Basic Sciences",
  "Management Sciences",
  "Material Engineering",
  "Mechanical Engineering",
  "Software Engineering",
];

const DESIGNATION_OPTIONS = ["Professor", "Lecturer", "Admin", "TA"];

const STUDENT_EMAIL_REGEX = /^u(20\d{2})\d{3}@giki\.edu\.pk$/i;

const detectRoleAndBatch = (email: string | null | undefined) => {
  const match = email?.toLowerCase().match(STUDENT_EMAIL_REGEX);
  if (match) {
    const year = match[1];
    const batchNumber = parseInt(year, 10) - 1990;
    const batchLabel = `Batch ${batchNumber}`;
    return {
      role: "student" as const,
      batch: batchLabel,
      isStaff: false,
    };
  }
  return { role: "admin" as const, batch: "", isStaff: true };
};

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [batch, setBatch] = useState("");
  const [faculty, setFaculty] = useState("");
  const [designation, setDesignation] = useState("");
  const [role, setRole] = useState<"student" | "admin">("student");
  const [isStaffAccount, setIsStaffAccount] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const email = user.email || "";
      const detection = detectRoleAndBatch(email);
      setRole(detection.role);
      setBatch(detection.batch);
      setIsStaffAccount(detection.isStaff);
      if (detection.role === "student") {
        setDesignation("");
      }
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("You must be logged in to complete onboarding.");
        router.push("/login");
        return;
      }

      // Re-run detection at submit time to ignore any tampering
      const detection = detectRoleAndBatch(user.email);
      const isAdmin = detection.role === "admin";

      if (isAdmin && !designation) {
        setError("Please select your designation.");
        setLoading(false);
        return;
      }

      const userData = {
        fullName,
        batch: detection.role === "student" ? detection.batch : null,
        faculty,
        designation: isAdmin ? designation : null,
        role: detection.role,
      };

      // Write to Firestore - force document ID to match Authentication UID
      await setDoc(doc(db, "users", user.uid), userData);

      // Force browser reload to wake up AuthContext and fetch new profile
      window.location.href = '/profile';
    } catch (error: any) {
      console.error("SAVE ERROR:", error);
      setError("An error occurred while saving. Please try again.");
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans text-white">
      
      {/* --- ACTIVE LAVA LAMP BACKGROUND --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Blob 1 (Blue) */}
        <motion.div 
          className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Blob 2 (Cyan) */}
        <motion.div 
          className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]"
          animate={{ x: [0, -100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        {/* Blob 3 (Indigo) */}
        <motion.div 
          className="absolute -bottom-[20%] left-[20%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]"
          animate={{ x: [0, 50, 0], y: [0, -100, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Header Animation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-4 border border-blue-500/20">
            <Sparkles className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg mb-2">
            Welcome Aboard
          </h1>
          <p className="text-slate-400">
            Let's get your account set up.
          </p>
        </motion.div>

        {/* Glass Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {isStaffAccount && (
              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
                <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                <span>Verified Staff/Faculty Account</span>
              </div>
            )}
            {!isStaffAccount && (
              <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-200 text-sm">
                <GraduationCap className="h-5 w-5 flex-shrink-0" />
                <span>Student email detected — role set to student automatically</span>
              </div>
            )}
            <p className="text-xs text-slate-400 ml-1">
              Detected role: {role === "student" ? "Student" : "Admin / Faculty"}
            </p>
            
            {/* Full Name Field */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 ml-1">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {/* Batch Field (auto-detected for students) */}
            {!isStaffAccount && (
              <div className="space-y-2">
                <label htmlFor="batch" className="block text-sm font-medium text-slate-300 ml-1">
                  Batch
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    id="batch"
                    type="text"
                    value={batch ? `${batch} (Detected from Email)` : ""}
                    readOnly
                    disabled
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-blue-500/40 rounded-xl text-white placeholder-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* Faculty Field */}
            <div className="space-y-2">
              <label htmlFor="faculty" className="block text-sm font-medium text-slate-300 ml-1">
                Faculty
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <select
                  id="faculty"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  required
                  disabled={loading}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer disabled:opacity-60"
                >
                  <option value="" className="bg-slate-900">Select your faculty</option>
                  {FACULTY_OPTIONS.map((option) => (
                    <option key={option} value={option} className="bg-slate-900">
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Designation Field (staff/faculty only) */}
            {isStaffAccount && (
              <div className="space-y-2">
                <label htmlFor="designation" className="block text-sm font-medium text-slate-300 ml-1">
                  Designation
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <BadgeCheck className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <select
                    id="designation"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    required={isStaffAccount}
                    disabled={loading}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer disabled:opacity-60"
                  >
                    <option value="" className="bg-slate-900">Select your designation</option>
                    {DESIGNATION_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-slate-900">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Complete Setup</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}