"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { getStudentName } from "../lib/studentData"; // Import the data lookup
import { 
  User, GraduationCap, Building2, ChevronRight, 
  Loader2, Lock, CheckCircle2, Sparkles, ShieldCheck, BadgeCheck, AlertCircle
} from "lucide-react";  
import { motion, AnimatePresence } from "framer-motion";

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

const DESIGNATION_OPTIONS = ["Professor", "Assistant Professor", "Lecturer", "TA", "Admin"];

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [fullName, setFullName] = useState("");
  const [regNumber, setRegNumber] = useState<number | null>(null);
  const [batch, setBatch] = useState<string | null>(null);
  const [faculty, setFaculty] = useState("");
  const [designation, setDesignation] = useState("");
  const [role, setRole] = useState("student");
  const [section, setSection] = useState<string | null>(null);

  // UI Locks
  const [isNameLocked, setIsNameLocked] = useState(false);
  const [isRegLocked, setIsRegLocked] = useState(false);
  const [isBatchLocked, setIsBatchLocked] = useState(false);

  // --- 1. SECTION LOGIC ---
  const determineSection = (fac: string, batchStr: string, reg: number): string | null => {
    if (!batchStr) return null;
    const batchYear = 1990 + parseInt(batchStr.replace("Batch ", ""));

    if (fac === "Electrical Engineering") {
      if (batchYear === 2022) return reg < 2022390 ? "Section A" : "Section B";
      if (batchYear === 2023) return reg < 2023300 ? "Section A" : "Section B";
      if (batchYear === 2024) return reg < 2024345 ? "Section A" : "Section B";
      if (batchYear === 2025) return reg < 2025400 ? "Section A" : "Section B";
    }
    
    if (fac === "Mechanical Engineering") {
      if (batchYear === 2022) return reg < 2022375 ? "Section A" : "Section B";
      if (batchYear === 2023) return reg < 2023400 ? "Section A" : "Section B";
      if (batchYear === 2024) return reg < 2024370 ? "Section A" : "Section B";
      if (batchYear === 2025) return reg < 2025400 ? "Section A" : "Section B";
    }

    if (fac === "Computer Science" && batchYear === 2025) {
      return reg < 2025400 ? "Section A" : "Section B";
    }

    return null;
  };

  // --- 2. INITIALIZATION & AUTO-FETCH ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        // Regex: Matches u2023623@giki.edu.pk
        const studentMatch = user.email.match(/^u(\d{7})@giki\.edu\.pk$/i);

        if (studentMatch) {
          // --- STUDENT LOGIC ---
          setRole("student");
          
          const fullRegStr = studentMatch[1];
          const regInt = parseInt(fullRegStr);
          
          // 1. Set & Lock Reg Number
          setRegNumber(regInt);
          setIsRegLocked(true);

          // 2. Calculate & Lock Batch
          const yearStr = fullRegStr.substring(0, 4);
          const batchNum = parseInt(yearStr) - 1990;
          setBatch(`Batch ${batchNum}`);
          setIsBatchLocked(true);

          // 3. AUTO-FETCH NAME (New Feature)
          const autoName = getStudentName(fullRegStr);
          if (autoName) {
            setFullName(autoName);
            setIsNameLocked(true); // Lock it so they can't change it
          }

        } else {
          // --- ADMIN LOGIC ---
          setRole("admin");
          setBatch(null);
          setFaculty("Faculty/Admin");
        }
        setLoading(false);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // --- 3. RE-RUN SECTION DETECTION ON CHANGE ---
  useEffect(() => {
    if (role === "student" && batch && regNumber && faculty) {
      const detectedSection = determineSection(faculty, batch, regNumber);
      setSection(detectedSection);
    } else {
      setSection(null);
    }
  }, [faculty, batch, regNumber, role]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) return;

      let finalFaculty = faculty;
      if (role === "student" && section) {
        finalFaculty = `${faculty} - ${section}`;
      }

      await setDoc(doc(db, "users", user.uid), {
        fullName,
        regNumber: role === "student" ? regNumber : null,
        batch,
        faculty: finalFaculty,
        section,
        designation: role === "admin" ? designation : "Student",
        email: user.email,
        role,
        createdAt: serverTimestamp(),
      });

      // --- THE FIX IS HERE ---
      // Use window.location.href to FORCE a fresh fetch of the user profile
      setTimeout(() => {
          window.location.href = "/"; 
      }, 1000);
      
    } catch (error: any) {
      console.error(error);
      setError("Failed to save profile.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20"
            >
              <Sparkles className="text-white h-8 w-8" />
            </motion.div>
            {/* Dynamic Welcome Message */}
            <h1 className="text-3xl font-bold text-white mb-2">
                Welcome, {fullName.split(' ')[0] || (role === 'admin' ? 'Admin' : 'Student')}!
            </h1>
            <p className="text-slate-400">Let's finish setting up your profile.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* --- ADMIN BADGE --- */}
            {role === "admin" && (
              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm mb-4">
                <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                <span>Verified Staff/Faculty Account</span>
              </div>
            )}

            {/* --- FULL NAME FIELD --- */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {/* Icon turns green if locked/verified */}
                  <User className={`h-5 w-5 ${isNameLocked ? "text-green-400" : "text-slate-500"}`} />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => !isNameLocked && setFullName(e.target.value)}
                  readOnly={isNameLocked}
                  className={`
                    block w-full pl-11 pr-10 py-4 bg-slate-950/50 border rounded-xl text-white outline-none transition-all
                    ${isNameLocked 
                      ? "border-green-500/30 text-slate-300 cursor-not-allowed bg-green-500/5" 
                      : "border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    }
                  `}
                  placeholder="Enter your full name"
                  required
                />
                {isNameLocked && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-green-500/50" />
                  </div>
                )}
              </div>
              {isNameLocked && <p className="text-xs text-green-500/60 ml-1 flex items-center gap-1"><CheckCircle2 size={10}/> Verified from University Records</p>}
            </div>

            {/* --- STUDENT FIELDS (REG & BATCH) --- */}
            {role === "student" && (
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300 ml-1">Reg Number</label>
                    <div className="relative">
                    <input
                        type="text"
                        value={regNumber || ""}
                        readOnly={isRegLocked}
                        className="block w-full px-4 py-4 bg-slate-950/50 border border-green-500/30 text-slate-300 rounded-xl cursor-not-allowed outline-none text-center"
                    />
                    {isRegLocked && <Lock className="absolute right-4 top-4 h-4 w-4 text-green-500/50" />}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300 ml-1">Batch</label>
                    <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <GraduationCap className="h-5 w-5 text-green-400" />
                    </div>
                    <input
                        type="text"
                        value={batch || ""}
                        readOnly={isBatchLocked}
                        className="block w-full pl-11 pr-4 py-4 bg-slate-950/50 border border-green-500/30 text-slate-300 rounded-xl cursor-not-allowed outline-none"
                    />
                    </div>
                </div>
                </div>
            )}

            {/* --- STUDENT FACULTY SELECTION --- */}
            {role === "student" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300 ml-1">Faculty</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <select
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-slate-950/50 border border-slate-700 rounded-xl text-white appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                    required
                  >
                    <option value="" className="bg-slate-900 text-slate-500">Select your faculty</option>
                    {FACULTY_OPTIONS.map(f => (
                      <option key={f} value={f} className="bg-slate-900">{f}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <ChevronRight className="h-4 w-4 text-slate-500 rotate-90" />
                  </div>
                </div>
              </div>
            )}

            {/* --- ADMIN DESIGNATION SELECTION --- */}
            {role === "admin" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300 ml-1">Designation</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ShieldCheck className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-slate-950/50 border border-slate-700 rounded-xl text-white appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                    required
                  >
                    <option value="" className="bg-slate-900 text-slate-500">Select...</option>
                    {DESIGNATION_OPTIONS.map(d => (
                      <option key={d} value={d} className="bg-slate-900">{d}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <ChevronRight className="h-4 w-4 text-slate-500 rotate-90" />
                  </div>
                </div>
              </div>
            )}

            {/* --- SECTION BADGE (AUTO-DETECTED) --- */}
            <AnimatePresence>
                {section && role === "student" && (
                <motion.div 
                    initial={{ opacity: 0, height: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, height: "auto", scale: 1 }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl overflow-hidden"
                >
                    <div className="flex items-center gap-2 text-indigo-300 text-sm font-bold">
                        <BadgeCheck size={18} className="text-indigo-400" />
                        <span>Automatic Assignment: <span className="text-white">{section}</span></span>
                    </div>
                    <p className="text-xs text-indigo-400/60 mt-1 pl-6">
                        Based on {faculty} rules for Reg # {regNumber}
                    </p>
                </motion.div>
                )}
            </AnimatePresence>

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
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {submitting ? <Loader2 className="animate-spin" /> : "Complete Profile"}
            </motion.button>

          </form>
        </div>
      </motion.div>
    </div>
  );
}