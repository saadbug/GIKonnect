"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import {
  Calendar,
  MapPin,
  FileText,
  Tag,
  Pin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Home,
  Sparkles,
  ShieldCheck,
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

const EVENT_TYPES = ["Quiz", "Assignment", "Project", "Notice", "Session", "Holiday"];

// Generate batch options (Batch 1 to Batch 50)
const BATCH_OPTIONS = Array.from({ length: 50 }, (_, i) => `Batch ${i + 1}`);

export default function AdminDashboard() {
  const { user, userProfile, loading: authLoading } = useAuthProtection();
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

  // Auto-set scope for CR users
  useEffect(() => {
    if (userProfile?.role === "cr") {
      setScope("targeted");
      setTargetFaculty(userProfile.faculty || "");
      setTargetBatch(userProfile.batch || "");
    }
  }, [userProfile]);

  // Check access control
  if (!authLoading && userProfile) {
    const hasAccess = (userProfile as any).role === "admin" || (userProfile as any).role === "cr";
    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans text-white pb-24 flex items-center justify-center">
          {/* Lava Lamp Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"
              animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]"
              animate={{ x: [0, -100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 max-w-md w-full mx-4 relative z-10"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-3 bg-red-500/10 rounded-full mb-4 border border-red-500/20">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-slate-400 mb-6">
                You don't have permission to access this page. Only administrators and class representatives can create events.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/")}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Home className="h-5 w-5" />
                <span>Return Home</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
    }
  }

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const isAdmin = (userProfile as any).role === "admin";
  const isCR = (userProfile as any).role === "cr";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      // Validation: Check if user and userProfile exist
      if (!user || !userProfile) {
        const errorMsg = "User profile not loaded";
        console.error("Validation error:", errorMsg);
        alert(errorMsg);
        setErrorMessage(errorMsg);
        setIsSubmitting(false);
        return;
      }

      // Validate required fields
      if (!title || !description || !dateTime || !location || !eventType) {
        throw new Error("Please fill in all required fields");
      }

      // For CR users, ensure scope is set correctly
      let finalScope = scope;
      let finalTargetFaculty = targetFaculty;
      let finalTargetBatch = targetBatch;

      if (isCR) {
        finalScope = "targeted";
        finalTargetFaculty = (userProfile as any).faculty || "";
        finalTargetBatch = (userProfile as any).batch || "";
      } else if (isAdmin && scope === "targeted") {
        if (!targetFaculty || !targetBatch) {
          throw new Error("Please select both Faculty and Batch for targeted events");
        }
      }

      // Parse date/time
      const eventDateTime = new Date(dateTime);

      // Prepare event data
      const eventData = {
        // Standard event fields
        title,
        description,
        dateTime: eventDateTime,
        location,
        type: eventType,
        isPinned,
        scope: finalScope,
        targetFaculty: finalScope === "targeted" ? finalTargetFaculty : null,
        targetBatch: finalScope === "targeted" ? finalTargetBatch : null,

        // Audit trail fields
        authorUid: user.uid,
        authorName: (userProfile as any).fullName || "Unknown",
        authorEmail: user.email || "",
        authorRole: (userProfile as any).role || "student",
        authorDesignation: (userProfile as any).designation || "Student",
        timestamp: serverTimestamp(),
      };

      // Explicit logging before save attempt
      console.log("Attempting to save:", eventData);

      // Save to Firestore with robust error handling
      try {
        const eventsCollection = collection(db, "events");
        await addDoc(eventsCollection, eventData);
        
        // Success feedback
        setSuccessMessage("Event published successfully!");
        
        // Clear form
        setTitle("");
        setDescription("");
        setDateTime("");
        setLocation("");
        setEventType("");
        setIsPinned(false);
        if (isAdmin) {
          setScope("global");
          setTargetFaculty("");
          setTargetBatch("");
        }

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 5000);
      } catch (firebaseError: any) {
        // Full Firebase error logging
        console.error("FULL FIREBASE ERROR:", firebaseError);
        const errorMsg = firebaseError.message || "Failed to save event to database. Please try again.";
        alert(`Error: ${errorMsg}`);
        throw firebaseError;
      }
    } catch (error: any) {
      console.error("Error creating event:", error);
      const errorMsg = error.message || "Failed to create event. Please try again.";
      setErrorMessage(errorMsg);
      // Show browser alert for visibility
      if (error.message !== "User profile not loaded") {
        alert(`Error: ${errorMsg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans text-white pb-24">
      {/* Lava Lamp Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]"
          animate={{ x: [0, -100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute -bottom-[20%] left-[20%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]"
          animate={{ x: [0, 50, 0], y: [0, -100, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-blue-400 shadow-lg">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg flex items-center gap-2">
                Admin Dashboard <Sparkles className="h-5 w-5 text-yellow-400" />
              </h1>
              <p className="text-sm text-slate-400">
                Create and manage campus events
              </p>
            </div>
          </div>
          {isCR && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-200 text-sm">
              <ShieldCheck className="h-5 w-5 flex-shrink-0" />
              <span>Class Representative Mode - Events will be posted to your batch</span>
            </div>
          )}
        </motion.header>

        {/* Create Event Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-6 md:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400"
                >
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-slate-300 ml-1">
                Event Title *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter event title"
                  required
                  disabled={isSubmitting}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 ml-1">
                Description *
              </label>
              <div className="relative group">
                <div className="absolute top-4 left-4 pointer-events-none">
                  <FileText className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter event description"
                  required
                  rows={4}
                  disabled={isSubmitting}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none disabled:opacity-60"
                />
              </div>
            </div>

            {/* Date/Time and Location Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date/Time */}
              <div className="space-y-2">
                <label htmlFor="dateTime" className="block text-sm font-medium text-slate-300 ml-1">
                  Date & Time *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    id="dateTime"
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label htmlFor="location" className="block text-sm font-medium text-slate-300 ml-1">
                  Location *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter location"
                    required
                    disabled={isSubmitting}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <label htmlFor="eventType" className="block text-sm font-medium text-slate-300 ml-1">
                Event Type *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Tag className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <select
                  id="eventType"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer disabled:opacity-60"
                >
                  <option value="" className="bg-slate-900">Select event type</option>
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-slate-900">
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pin to Top Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-3">
                <Pin className="h-5 w-5 text-yellow-400" />
                <div>
                  <label htmlFor="isPinned" className="text-sm font-medium text-slate-300 cursor-pointer">
                    Pin to Top (High Importance)
                  </label>
                  <p className="text-xs text-slate-500">This event will appear at the top of the list</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                disabled={isSubmitting}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 ${
                  isPinned ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPinned ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Scope Logic - Only for Admin */}
            {isAdmin && (
              <div className="space-y-4 p-4 bg-slate-950/50 rounded-xl border border-slate-700/50">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Target Audience *
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="scope"
                      value="global"
                      checked={scope === "global"}
                      onChange={(e) => {
                        setScope(e.target.value as "global" | "targeted");
                        setTargetFaculty("");
                        setTargetBatch("");
                      }}
                      disabled={isSubmitting}
                      className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-slate-300 group-hover:text-white transition-colors">Global Event</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="scope"
                      value="targeted"
                      checked={scope === "targeted"}
                      onChange={(e) => setScope(e.target.value as "global" | "targeted")}
                      disabled={isSubmitting}
                      className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-slate-300 group-hover:text-white transition-colors">Specific Batch</span>
                  </label>
                </div>

                {scope === "targeted" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
                  >
                    <div className="space-y-2">
                      <label htmlFor="targetFaculty" className="block text-sm font-medium text-slate-300 ml-1">
                        Faculty *
                      </label>
                      <select
                        id="targetFaculty"
                        value={targetFaculty}
                        onChange={(e) => setTargetFaculty(e.target.value)}
                        required={scope === "targeted"}
                        disabled={isSubmitting}
                        className="block w-full px-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer disabled:opacity-60"
                      >
                        <option value="" className="bg-slate-900">Select faculty</option>
                        {FACULTY_OPTIONS.map((faculty) => (
                          <option key={faculty} value={faculty} className="bg-slate-900">
                            {faculty}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="targetBatch" className="block text-sm font-medium text-slate-300 ml-1">
                        Batch *
                      </label>
                      <select
                        id="targetBatch"
                        value={targetBatch}
                        onChange={(e) => setTargetBatch(e.target.value)}
                        required={scope === "targeted"}
                        disabled={isSubmitting}
                        className="block w-full px-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer disabled:opacity-60"
                      >
                        <option value="" className="bg-slate-900">Select batch</option>
                        {BATCH_OPTIONS.map((batch) => (
                          <option key={batch} value={batch} className="bg-slate-900">
                            {batch}
                          </option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* CR Read-only Message */}
            {isCR && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-200 text-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                  <span>
                    Posting to: <strong>{(userProfile as any).faculty}</strong> - <strong>{(userProfile as any).batch}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Creator Info Display */}
            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-700/50 text-sm">
              <p className="text-slate-400 mb-1">Created by:</p>
              <p className="text-white font-semibold">
                {(userProfile as any).designation || "Student"} {(userProfile as any).fullName}
              </p>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <span>Publish Event</span>
                  <CheckCircle2 className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}

