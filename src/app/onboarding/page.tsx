"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { User, GraduationCap, Building2, AlertCircle, ArrowRight, Loader2, Sparkles, ShieldCheck, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";

const FACULTY_OPTIONS = [
  "Artificial Intelligence",
  "Computer Engineering",
  "Computer Science",
  "Cyber Security",
  "Chemical Engineering",
  "Civil Engineering",
  "Data Science",
  "Electrical Engineering", // Has Sections
  "Basic Sciences",
  "Management Sciences",
  "Material Engineering",
  "Mechanical Engineering", // Has Sections
  "Software Engineering",
];

// Updated Designation List
const DESIGNATION_OPTIONS = ["Professor", "Assistant Professor", "Lecturer", "TA", "Admin"];

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [batch, setBatch] = useState<string | null>(null);
  const [faculty, setFaculty] = useState("");
  const [designation, setDesignation] = useState("");
  const [role, setRole] = useState("student");
  const [regNumber, setRegNumber] = useState<number | null>(null);
  const [section, setSection] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- 1. AUTO-DETECT ROLE & BATCH ---
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      router.push("/login");
      return;
    }

    const email = user.email;
    const studentMatch = email.match(/^u(\d{7})@giki\.edu\.pk$/i);

    if (studentMatch) {
      const fullRegStr = studentMatch[1];
      const yearStr = fullRegStr.substring(0, 4);
      const regInt = parseInt(fullRegStr);
      
      const batchNum = parseInt(yearStr) - 1990;
      setBatch(`Batch ${batchNum}`);
      setRegNumber(regInt);
      setRole("student");
      setFaculty(""); // Reset faculty so student must choose
    } else {
      // Admin / Staff Logic
      setRole("admin");
      setBatch(null);
      setFaculty("Faculty/Admin"); // Default faculty for admins
    }
  }, [router]);

  // --- 2. SECTION LOGIC ---
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
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) return;

      let finalFaculty = faculty;
      
      // Only apply section logic for students
      if (role === "student" && section) {
        finalFaculty = `${faculty} - ${section}`;
      }

      const userData = {
        fullName,
        email: user.email,
        role: role,
        batch: role === "student" ? batch : null,
        faculty: finalFaculty,
        designation: role === "admin" ? designation : "Student",
        section: section,
      };

      await setDoc(doc(db, "users", user.uid), userData);
      window.location.href = '/profile';
    } catch (error: any) {
      console.error(error);
      setError("Failed to save profile.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" animate={{ x: [0, -100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-4 border border-blue-500/20">
            <Sparkles className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Aboard</h1>
          <p className="text-slate-400">Let's finish setting up your profile.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Role Badge */}
            {role === "admin" ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
                <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                <span>Verified Staff/Faculty Account</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-200 text-sm">
                <GraduationCap className="h-5 w-5 flex-shrink-0" />
                <span>Student Account ({batch})</span>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" required className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
              </div>
            </div>

            {/* Faculty Selection - ONLY FOR STUDENTS */}
            {role === "student" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300 ml-1">
                  Faculty / Major
                </label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                  <select value={faculty} onChange={(e) => setFaculty(e.target.value)} required className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer">
                    <option value="" className="bg-slate-900">Select...</option>
                    {FACULTY_OPTIONS.map((opt) => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Auto-Detected Section Display (Students) */}
            {section && role === "student" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                <div className="flex items-center gap-2 text-indigo-300 text-sm font-bold">
                  <BadgeCheck size={16} />
                  <span>Assigned: {section}</span>
                </div>
                <p className="text-xs text-indigo-400/70 mt-1 pl-6">Based on your Reg # {regNumber}</p>
              </motion.div>
            )}

            {/* Admin Designation - ONLY FOR ADMINS */}
            {role === "admin" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300 ml-1">Designation</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                  <select value={designation} onChange={(e) => setDesignation(e.target.value)} required className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer">
                    <option value="" className="bg-slate-900">Select...</option>
                    {DESIGNATION_OPTIONS.map((opt) => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
                  </select>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><span>Complete Setup</span><ArrowRight className="h-5 w-5" /></>}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}