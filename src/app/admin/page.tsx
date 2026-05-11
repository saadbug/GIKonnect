"use client";

import { useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar, MapPin, FileText, Tag, Pin, Loader2,
  CheckCircle2, AlertCircle, Home, Sparkles, ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FACULTY_OPTIONS = [
  "Artificial Intelligence", "Computer Engineering", "Computer Science",
  "Cyber Security", "Chemical Engineering", "Civil Engineering",
  "Data Science", "Electrical Engineering", "Basic Sciences",
  "Management Sciences", "Material Engineering", "Mechanical Engineering",
  "Software Engineering",
];

const EVENT_TYPES = ["Quiz", "Assignment", "Project", "Notice", "Session", "Holiday"];
const BATCH_OPTIONS = Array.from({ length: 50 }, (_, i) => `Batch ${i + 1}`);

export default function AdminDashboard() {
  useAuthProtection();

  const { user, userProfile, loading: authLoading } = useAuth() as any;
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [scope, setScope] = useState<"global" | "targeted">("global");
  const [targetFaculty, setTargetFaculty] = useState("");
  const [targetBatch, setTargetBatch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (userProfile?.role === "cr") {
      setScope("targeted");
      setTargetFaculty(userProfile.faculty || "");
      setTargetBatch(userProfile.batch || "");
    }
  }, [userProfile]);

  if (!authLoading && userProfile) {
    const hasAccess = userProfile.role === "admin" || userProfile.role === "cr" || userProfile.role === "faculty";
    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans text-white pb-24 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 max-w-md w-full mx-4 relative z-10">
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-3 bg-red-500/10 rounded-full mb-4 border border-red-500/20">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-slate-400 mb-6">You don't have permission to access this page.</p>
              <motion.button onClick={() => router.push("/")} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
                <Home className="h-5 w-5" /> <span>Return Home</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
    }
  }

  if (authLoading || !userProfile) {
    return <PageLoader text="Accessing Admin Panel..." />;
  }

  const isAdmin = userProfile.role === "admin";
  const isCR = userProfile.role === "cr";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const userId = user?.id || user?.uid;
      if (!userId || !userProfile) throw new Error("User profile not loaded");
      if (!title || !description || !dateTime || !location || !eventType) throw new Error("Please fill in all required fields");

      let finalScope = scope;
      let finalTargetFaculty = targetFaculty;
      let finalTargetBatch = targetBatch;

      if (isCR) {
        finalScope = "targeted";
        finalTargetFaculty = userProfile.faculty || "";
        finalTargetBatch = userProfile.batch || "";
      } else if (isAdmin && scope === "targeted") {
        if (!targetFaculty || !targetBatch) throw new Error("Please select both Faculty and Batch");
      }

      // Convert local date/time input to ISO String for Postgres
      const eventDateTime = new Date(dateTime).toISOString();

      const eventData = {
        title,
        description,
        date_time: eventDateTime,
        location,
        type: eventType,
        is_pinned: isPinned,
        scope: finalScope,
        target_faculty: finalScope === "targeted" ? finalTargetFaculty : null,
        target_batch: finalScope === "targeted" ? finalTargetBatch : null,
        author_id: userId,
        author_name: userProfile.fullName || "Unknown",
        author_email: user.email || "",
        designation: userProfile.designation || "Student"
      };

      const { error } = await supabase.from("events").insert(eventData);
      
      if (error) throw error;

      setSuccessMessage("Event published successfully!");
      setTitle(""); setDescription(""); setDateTime(""); setLocation(""); setEventType(""); setIsPinned(false);
      
      if (isAdmin) {
        setScope("global"); setTargetFaculty(""); setTargetBatch("");
      }

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error: any) {
      console.error("Error creating event:", error);
      setErrorMessage(error.message || "Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans text-white pb-24">
      <main className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-blue-400 shadow-lg">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg flex items-center gap-2">
                Admin Dashboard <Sparkles className="h-5 w-5 text-yellow-400" />
              </h1>
              <p className="text-sm text-slate-400">Create and manage campus events</p>
            </div>
          </div>
          {isCR && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-200 text-sm">
              <ShieldCheck className="h-5 w-5 flex-shrink-0" />
              <span>Class Representative Mode - Events will be posted to your batch</span>
            </div>
          )}
        </motion.header>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <AnimatePresence>
              {successMessage && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {errorMessage && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" /> <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 ml-1">Event Title *</label>
              <div className="relative group">
                <FileText className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-blue-400" />
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting} className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-blue-500/50 outline-none" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 ml-1">Description *</label>
              <div className="relative group">
                <FileText className="absolute left-4 top-4 h-5 w-5 text-slate-500 group-focus-within:text-blue-400" />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} disabled={isSubmitting} className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-blue-500/50 outline-none resize-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date/Time */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300 ml-1">Date & Time *</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-blue-400" />
                  <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} required disabled={isSubmitting} className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-blue-500/50 outline-none" />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300 ml-1">Location *</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-blue-400" />
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required disabled={isSubmitting} className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-blue-500/50 outline-none" />
                </div>
              </div>
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 ml-1">Event Type *</label>
              <div className="relative group">
                <Tag className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-blue-400" />
                <select value={eventType} onChange={(e) => setEventType(e.target.value)} required disabled={isSubmitting} className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:ring-blue-500/50 outline-none appearance-none">
                  <option value="" className="bg-slate-900">Select event type</option>
                  {EVENT_TYPES.map((type) => <option key={type} value={type} className="bg-slate-900">{type}</option>)}
                </select>
              </div>
            </div>

            {/* Pin Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-3">
                <Pin className="h-5 w-5 text-yellow-400" />
                <div>
                  <label className="text-sm font-medium text-slate-300 cursor-pointer">Pin to Top (High Importance)</label>
                </div>
              </div>
              <button type="button" onClick={() => setIsPinned(!isPinned)} disabled={isSubmitting} className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${isPinned ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-slate-700"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPinned ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {/* Scope (Admin only) */}
            {isAdmin && (
              <div className="space-y-4 p-4 bg-slate-950/50 rounded-xl border border-slate-700/50">
                <label className="block text-sm font-medium text-slate-300 mb-3">Target Audience *</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" value="global" checked={scope === "global"} onChange={(e) => { setScope("global"); setTargetFaculty(""); setTargetBatch(""); }} className="w-4 h-4 text-blue-600 bg-slate-800" />
                    <span className="text-slate-300">Global Event</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" value="targeted" checked={scope === "targeted"} onChange={(e) => setScope("targeted")} className="w-4 h-4 text-blue-600 bg-slate-800" />
                    <span className="text-slate-300">Specific Batch</span>
                  </label>
                </div>

                {scope === "targeted" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <select value={targetFaculty} onChange={(e) => setTargetFaculty(e.target.value)} required={scope === "targeted"} className="block w-full px-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white outline-none">
                      <option value="" className="bg-slate-900">Select faculty</option>
                      {FACULTY_OPTIONS.map((fac) => <option key={fac} value={fac} className="bg-slate-900">{fac}</option>)}
                    </select>
                    <select value={targetBatch} onChange={(e) => setTargetBatch(e.target.value)} required={scope === "targeted"} className="block w-full px-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white outline-none">
                      <option value="" className="bg-slate-900">Select batch</option>
                      {BATCH_OPTIONS.map((bat) => <option key={bat} value={bat} className="bg-slate-900">{bat}</option>)}
                    </select>
                  </motion.div>
                )}
              </div>
            )}

            <motion.button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
              {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Publishing...</> : <>Publish Event <CheckCircle2 className="h-5 w-5" /></>}
            </motion.button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}