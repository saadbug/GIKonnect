"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useAuthProtection } from "../../hooks/useAuthProtection";
import { 
  Mail, GraduationCap, Building2, 
  BadgeCheck, LogOut, Loader2, Edit3, 
  Shield, Zap, BookUser, Briefcase
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  useAuthProtection();
  const { userProfile, user } = useAuth() as any;
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoggingOut(false);
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
            <div className={`h-32 relative bg-gradient-to-r ${role === 'admin' ? 'from-purple-900 to-indigo-900' : 'from-blue-800 to-slate-900'}`}>
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
            </div>

            {/* Avatar & Content */}
            <div className="px-6 pb-8 -mt-16 flex flex-col items-center text-center">
              
              {/* Avatar Image */}
              <div className="relative">
                <div className={`h-28 w-28 rounded-2xl bg-slate-900 p-1.5 shadow-2xl border-4 ${currentRole.avatarRing}`}>
                  <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center text-3xl font-bold text-slate-500">
                    {getInitials(userProfile.fullName)}
                  </div>
                </div>
                {/* Verified Badge */}
                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-slate-900 shadow-lg">
                  <BadgeCheck size={18} fill="currentColor" className="text-white" />
                </div>
              </div>

              {/* Name & Designation */}
              <div className="mt-5 mb-6 w-full">
                <h2 className="text-2xl font-bold text-white">
                  {userProfile.fullName || "User Name"}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                    {/* 1. Designation Badge */}
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                        {userProfile.designation || "Student"}
                    </span>
                    
                    {/* 2. Role Power Level Badge */}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md ${currentRole.color}`}>
                        {currentRole.icon}
                        <span className="text-xs font-bold uppercase tracking-wider">{currentRole.label}</span>
                    </div>
                </div>

                {/* 3. Batch Badge (Students Only) */}
                {isStudentOrCR && userProfile.batch && (
                    <div className="mt-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-xs font-bold uppercase tracking-wider">
                            <GraduationCap size={12} /> {formatBatch(userProfile.batch)}
                        </span>
                    </div>
                )}
              </div>

              {/* Info Grid */}
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
          {/* Edit Button */}
          <button className="w-full bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-slate-800/60 hover:border-blue-500/30 transition-all backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                <Edit3 size={18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Edit Profile</p>
                <p className="text-xs text-slate-500">Update details</p>
              </div>
            </div>
          </button>

          {/* Logout Button */}
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
    </div>
  );
}

// Detail Row Component
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