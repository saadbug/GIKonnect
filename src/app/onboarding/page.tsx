"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { User, GraduationCap, Building2, AlertCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";
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

const DESIGNATIONS = ["Professor", "Lecturer", "TA", "Management", "Administration"];

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [batch, setBatch] = useState<string | null>(null);
  const [faculty, setFaculty] = useState("");
  const [designation, setDesignation] = useState("");
  const [role, setRole] = useState("student");
  const [regNumber, setRegNumber] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- AUTO-DETECT ROLE & BATCH ---
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      router.push("/login");
      return;
    }

    const email = user.email;
    // Regex to capture "u" + "2023123" (full 7 digit reg number)
    const studentMatch = email.match(/^u(\d{7})@giki\.edu\.pk$/);

    if (studentMatch) {
      const fullRegStr = studentMatch[1]; // e.g. "2023623"
      const yearStr = fullRegStr.substring(0, 4); // "2023"
      const regInt = parseInt(fullRegStr);
      
      const batchNum = parseInt(yearStr) - 1990;
      setBatch(`Batch ${batchNum}`);
      setRegNumber(regInt);
      setRole("student");
    } else {
      // Non-student email (Faculty/Admin)
      setRole("admin");
      setBatch(null);
    }
  }, [router]);

  // --- SECTION LOGIC HELPER ---
  const determineSection = (fac: string, batchNum: string, reg: number): string | null => {
    // Extract batch year from "Batch 33" -> 33 + 1990 = 2023
    const batchYear = 1990 + parseInt(batchNum.replace("Batch ", ""));

    // Logic from Image provided
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

    return null; // No sections for others
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) return;

      let finalFaculty = faculty;
      
      // Apply Section Logic
      if (role === "student" && batch && regNumber) {
        const section = determineSection(faculty, batch, regNumber);
        if (section) {
          finalFaculty = `${faculty} - ${section}`;
        }
      }

      const userData = {
        fullName,
        email: user.email,
        role: role, // 'student' or 'admin'
        // If admin, batch is null. If student, batch is set.
        batch: role === "student" ? batch : null,
        faculty: finalFaculty,
        designation: role === "admin" ? designation : "Student",
        sectionAssigned: role === "student" && determineSection(faculty, batch!, regNumber!) ? true : false
      };

      await setDoc(doc(db, "users", user.uid), userData);
      window.location.href = '/profile'; // Force reload to update context
    } catch (error: any) {
      console.error(error);
      setError("Failed to save profile.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <motion.div className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-4 border border-blue-500/20">
            <Sparkles className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Aboard</h1>
          <p className="text-slate-400">Let's set up your profile.</p>
        </motion.div>

        <motion.div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Student: Batch Display */}
            {role === "student" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300 ml-1">Batch (Auto-Detected)</label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                  <input
                    value={batch || "Detecting..."}
                    disabled
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 ml-1">
                {role === "student" ? "Faculty / Major" : "Department"}
              </label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                <select
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900">Select...</option>
                  {FACULTY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-slate-900">{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Admin: Designation */}
            {role === "admin" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300 ml-1">Designation</label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                  className="block w-full px-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900">Select...</option>
                  {DESIGNATIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-slate-900">{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Saving..." : "Complete Setup"} <ArrowRight className="h-5 w-5" />
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}