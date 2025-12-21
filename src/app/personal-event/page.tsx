"use client";

import { useState } from "react";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  MapPin,
  FileText,
  Tag,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PERSONAL_EVENT_TYPES = ["Quiz", "Assignment", "Project", "Reminder", "Exam", "Other"];

export default function PersonalEventPage() {
  // 1. Auth Protection
  useAuthProtection();
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // 2. Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("");
  
  // 3. UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  if (authLoading || !userProfile) {
    return <PageLoader text="Loading Planner..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      if (!title || !dateTime || !eventType) {
        throw new Error("Please fill in the required fields (Title, Date, Type).");
      }

      const eventData = {
        title,
        description,
        dateTime: new Date(dateTime),
        location,
        type: eventType,
        isPinned: false, // Personal events are not pinned globally
        scope: "personal", // <--- THE KEY FIELD
        
        // Author Info (For deletion rights)
        authorUid: user?.uid,
        authorName: userProfile.fullName,
        authorId: user?.uid, // Redundant but consistent with Home Page logic
        
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "events"), eventData);
      
      setSuccessMessage("Added to your calendar!");
      
      // Reset Form
      setTitle("");
      setDescription("");
      setDateTime("");
      setLocation("");
      setEventType("");

      // Redirect after short delay
      setTimeout(() => {
        router.push("/");
      }, 1500);

    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Failed to save event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans text-white pb-24">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-[10%] right-[10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-[10%] -left-[10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.2, 1] }} 
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-lg relative z-10">
        
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-8 flex items-center gap-4"
        >
          <button 
            onClick={() => router.back()} 
            className="p-3 bg-slate-900/50 border border-white/10 rounded-xl hover:bg-slate-800 transition"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Personal Event <Lock className="h-5 w-5 text-indigo-400" />
            </h1>
            <p className="text-sm text-slate-400">Add a private reminder or task.</p>
          </div>
        </motion.header>

        {/* Form Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Success/Error Feedback */}
            <AnimatePresence>
              {successMessage && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 flex items-center gap-2">
                  <CheckCircle2 size={18} /> {successMessage}
                </motion.div>
              )}
              {errorMessage && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2">
                  <AlertCircle size={18} /> {errorMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Title *</label>
              <div className="relative">
                <FileText className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Study for Calculus"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            {/* Date & Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Date Picker (Modern Style) */}
               <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-300 ml-1">When? *</label>
                 <div className="relative">
                   <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 pointer-events-none" />
                   <input 
                     type="datetime-local" 
                     value={dateTime}
                     onChange={(e) => setDateTime(e.target.value)}
                     className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 cursor-pointer"
                     required
                   />
                 </div>
               </div>

               {/* Event Type */}
               <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-300 ml-1">Type *</label>
                 <div className="relative">
                   <Tag className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 pointer-events-none" />
                   <select 
                     value={eventType}
                     onChange={(e) => setEventType(e.target.value)}
                     className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                     required
                   >
                     <option value="" className="bg-slate-900">Select Type</option>
                     {PERSONAL_EVENT_TYPES.map(t => (
                       <option key={t} value={t} className="bg-slate-900">{t}</option>
                     ))}
                   </select>
                 </div>
               </div>
            </div>

            {/* Location (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Location (Optional)</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Library / Room 204"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Description (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Details (Optional)</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 h-5 w-5 text-slate-500" />
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes..."
                  rows={3}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600 resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isSubmitting ? (
                <> <Loader2 className="animate-spin" /> Saving... </>
              ) : (
                <> <Sparkles size={18} /> Add to Calendar </>
              )}
            </motion.button>

          </form>
        </motion.div>
      </main>
    </div>
  );
}