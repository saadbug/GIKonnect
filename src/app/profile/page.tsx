"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase"; // Supabase instead of Firebase
import { useAuth } from "../../context/AuthContext";
import { useAuthProtection } from "../../hooks/useAuthProtection";
import { 
  Mail, GraduationCap, Building2, 
  BadgeCheck, LogOut, Loader2, Edit3, 
  Shield, Zap, BookUser, Briefcase, AlertCircle, X, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

const FACULTY_OPTIONS = [
  "Artificial Intelligence", "Computer Engineering", "Computer Science",
  "Cyber Security", "Chemical Engineering", "Civil Engineering",
  "Data Science", "Electrical Engineering", "Basic Sciences",
  "Management Sciences", "Material Engineering", "Mechanical Engineering",
  "Software Engineering",
];

// Portal for the Edit Modal
const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
};

export default function ProfilePage() {
  useAuthProtection();
  const { userProfile, user } = useAuth() as any;
  const router = useRouter();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [newFaculty, setNewFaculty] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Lock scrolling when modal is open
  useEffect(() => {
    if (isEditing) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isEditing]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoggingOut(false);
    }
  };

  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");
    setIsUpdating(true);

    try {
      if (!newFaculty) throw new Error("Please select a faculty.");
      const userId = user?.id;

      // 1. Fetch the exact cooldown timestamp from the database
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('faculty_last_updated')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Enforce the 24-hour rule
      if (profileData.faculty_last_updated) {
        const lastUpdated = new Date(profileData.faculty_last_updated);
        const now = new Date();
        const diffInHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
          const hoursLeft = Math.ceil(24 - diffInHours);
          throw new Error(`You can only change your department once every 24 hours. Try again in ${hoursLeft} hours.`);
        }
      }

      // 3. Update the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          faculty: newFaculty,
          faculty_last_updated: new Date().toISOString() 
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setEditSuccess("Profile updated successfully!");
      
      // Force reload to update context
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      setEditError(err.message || "Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const formatBatch = (batchData: string) => {
    if (!batchData) return "";
    return batchData.toString().toLowerCase().includes("batch") 
      ? batchData 
      : `Batch ${batchData}`;
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // --- ROLE LOGIC ---
  const role = userProfile.role || 'student';
  const isStudentOrCR = role === 'student' || role === 'cr';
  
  // Dynamic Styles based on Role
  const roleConfig = {
    admin: {
      label: "Administrator",
      icon: <Shield size={14} className="text-purple-200" />,
      color: "bg-purple-500/20 border-purple-500/30 text-purple-300",
      avatarRing: "border-purple-500"
    },
    cr: {
      label: "Class Representative",
      icon: <Zap size={14} className="text-orange-200" />,
      color: "bg-orange-500/20 border-orange-500/30 text-orange-300",
      avatarRing: "border-orange-500"
    },
    faculty: {
      label: "Faculty",
      icon: <Briefcase size={14} className="text-emerald-200" />,
      color: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
      avatarRing: "border-emerald-500"
    },
    student: {
      label: "Student",
      icon: <BookUser size={14} className="text-blue-200" />,
      color: "bg-blue-500/20 border-blue-500/30 text-blue-300",
      avatarRing: "border-slate-700"
    }
  };

  const currentRole = roleConfig[role as keyof typeof roleConfig] || roleConfig.student;

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-24 relative overflow-hidden text-white">
      
      {/* --- LIQUID GLASS BACKGROUND --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]"
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[20%] right-[-10%] w-80 h-80 bg-blue-600/20 rounded-full blur-[100px]"
          animate={{ x: [0, -50, 0], y: [0, -100, 0], scale: [1, 1.5, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-lg relative z-10">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">
              My Profile
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Manage your account
            </p>
          </div>
          {/* Neon Status Dot */}
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/50 shadow-lg">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
             </span>
             <span className="text-xs font-bold text-slate-300">ACTIVE</span>
          </div>
        </div>

        {/* --- MAIN ID CARD --- */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="rounded-3xl overflow-hidden border border-white/10 relative backdrop-blur-xl bg-slate-900/40 shadow-2xl">
            
            {/* Card Banner */}
            <div className={`h-32 relative bg-gradient-to-r ${role === 'admin' ? 'from-purple-900 to-indigo-900' : role === 'faculty' ? 'from-emerald-900 to-teal-900' : 'from-blue-800 to-slate-900'}`}>
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
            </div>

            {/* Avatar & Content */}
            <div className="px-6 pb-8 -mt-16 flex flex-col items-center text-center">
              
              <div className="relative">
                <div className={`h-28 w-28 rounded-2xl bg-slate-900 p-1.5 shadow-2xl border-4 ${currentRole.avatarRing}`}>
                  <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center text-3xl font-bold text-slate-500">
                    {getInitials(userProfile.fullName)}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-slate-900 shadow-lg">
                  <BadgeCheck size={18} fill="currentColor" className="text-white" />
                </div>
              </div>

              <div className="mt-5 mb-6 w-full">
                <h2 className="text-2xl font-bold text-white">
                  {userProfile.fullName || "User Name"}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                        {userProfile.designation || "Student"}
                    </span>
                    
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md ${currentRole.color}`}>
                        {currentRole.icon}
                        <span className="text-xs font-bold uppercase tracking-wider">{currentRole.label}</span>
                    </div>
                </div>

                {isStudentOrCR && userProfile.batch && (
                    <div className="mt-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-xs font-bold uppercase tracking-wider">
                            <GraduationCap size={12} /> {formatBatch(userProfile.batch)}
                        </span>
                    </div>
                )}
              </div>

              <div className="grid grid-cols-1 w-full gap-3">
                 <DetailRow 
                   icon={<Building2 className="h-4 w-4 text-cyan-400" />} 
                   label={role === 'student' ? "Faculty" : "Department"} 
                   value={userProfile.faculty} 
                 />
                 <DetailRow 
                   icon={<Mail className="h-4 w-4 text-blue-400" />} 
                   label="Email Address" 
                   value={user?.email || ""} 
                 />
                 {userProfile.section && (
                    <DetailRow 
                        icon={<Briefcase className="h-4 w-4 text-purple-400" />} 
                        label="Section" 
                        value={userProfile.section} 
                    />
                 )}
              </div>

            </div>
          </div>
        </motion.div>

        {/* --- ACTIONS --- */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <button 
            onClick={() => {
                setNewFaculty(userProfile.faculty?.split(" - ")[0] || "");
                setIsEditing(true);
            }}
            className="w-full bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-slate-800/60 hover:border-blue-500/30 transition-all backdrop-blur-md"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                <Edit3 size={18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Edit Profile</p>
                <p className="text-xs text-slate-500">Update department</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-red-950/30 hover:border-red-500/30 transition-all backdrop-blur-md"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-red-500">
                  {isLoggingOut ? "Signing out..." : "Log Out"}
                </p>
                <p className="text-xs text-red-500/50">End session</p>
              </div>
            </div>
          </button>
        </motion.div>
      </main>

      {/* --- EDIT PROFILE MODAL --- */}
      <ModalPortal>
        <AnimatePresence>
          {isEditing && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => !isUpdating && setIsEditing(false)}>
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }} 
                 animate={{ scale: 1, opacity: 1 }} 
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="bg-slate-900 border border-slate-700/50 p-6 rounded-3xl max-w-sm w-full shadow-2xl relative"
                 onClick={e => e.stopPropagation()}
               >
                 <button onClick={() => !isUpdating && setIsEditing(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition">
                    <X size={20} />
                 </button>
                 
                 <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">Edit Department</h3>
                    <div className="flex gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-300 text-xs leading-relaxed">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <p><strong>Warning:</strong> You can only change your department once every 24 hours. Your section will be automatically recalculated.</p>
                    </div>
                 </div>

                 <form onSubmit={handleUpdateFaculty} className="space-y-4">
                    
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300 ml-1">New Faculty/Department</label>
                        <select 
                            value={newFaculty}
                            onChange={(e) => setNewFaculty(e.target.value)}
                            disabled={isUpdating}
                            className="block w-full px-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white appearance-none focus:ring-2 focus:ring-blue-500/50 outline-none transition-all disabled:opacity-50"
                        >
                            <option value="">Select Faculty...</option>
                            {FACULTY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>

                    <AnimatePresence>
                        {editError && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-red-400 text-xs p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                {editError}
                            </motion.div>
                        )}
                        {editSuccess && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-green-400 text-xs p-2 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-1">
                                <CheckCircle2 size={14} /> {editSuccess}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button 
                        type="submit" 
                        disabled={isUpdating || newFaculty === (userProfile.faculty?.split(" - ")[0])}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-all flex justify-center items-center gap-2 mt-2"
                    >
                        {isUpdating ? <Loader2 size={18} className="animate-spin" /> : "Save Changes"}
                    </button>
                 </form>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </ModalPortal>

    </div>
  );
}

function DetailRow({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-white/5 backdrop-blur-sm hover:bg-slate-800/60 transition-colors">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium text-slate-200">{value || "N/A"}</span>
      </div>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}