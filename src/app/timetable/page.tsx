"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { Clock, MapPin, Edit3, Save, Plus, Trash2, Calendar, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type ClassSession = {
  id: string;
  subject: string;
  time: string; // e.g. "09:00 - 10:50"
  room: string;
  teacher?: string;
};

type WeeklySchedule = {
  Monday: ClassSession[];
  Tuesday: ClassSession[];
  Wednesday: ClassSession[];
  Thursday: ClassSession[];
  Friday: ClassSession[];
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const INITIAL_SCHEDULE: WeeklySchedule = {
  Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
};

export default function TimetablePage() {
  useAuthProtection();
  const { userProfile } = useAuth() as any;

  // State
  const [schedule, setSchedule] = useState<WeeklySchedule>(INITIAL_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState("Monday");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Computed Properties
  const isCR = userProfile?.role === "cr" || userProfile?.role === "admin";
  const docId = userProfile ? `${userProfile.faculty}_${userProfile.batch}` : null;

  // --- 1. Auto-Select Today ---
  useEffect(() => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    if (DAYS.includes(today)) setActiveDay(today);
  }, []);

  // --- 2. Fetch Timetable ---
  useEffect(() => {
    if (!docId) return;

    const fetchTimetable = async () => {
      try {
        const docRef = doc(db, "timetables", docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSchedule(docSnap.data().schedule as WeeklySchedule);
        } else {
          console.log("No timetable found, using empty default.");
        }
      } catch (error) {
        console.error("Error loading timetable:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [docId]);

  // --- 3. Save Timetable (CR Only) ---
  const handleSave = async () => {
    if (!docId) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, "timetables", docId), {
        faculty: userProfile.faculty,
        batch: userProfile.batch,
        schedule: schedule,
        updatedBy: userProfile.fullName,
        lastUpdated: serverTimestamp(),
      });
      setIsEditing(false);
      alert("Timetable updated successfully!");
    } catch (error) {
      console.error("Error saving timetable:", error);
      alert("Failed to save. Check your internet.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- CRUD Operations for Local State ---
  const addSlot = (day: string) => {
    const newSlot: ClassSession = {
      id: Date.now().toString(),
      subject: "",
      time: "",
      room: "",
    };
    setSchedule(prev => ({
      ...prev,
      [day as keyof WeeklySchedule]: [...prev[day as keyof WeeklySchedule], newSlot]
    }));
  };

  const removeSlot = (day: string, id: string) => {
    setSchedule(prev => ({
      ...prev,
      [day as keyof WeeklySchedule]: prev[day as keyof WeeklySchedule].filter(s => s.id !== id)
    }));
  };

  const updateSlot = (day: string, id: string, field: keyof ClassSession, value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day as keyof WeeklySchedule]: prev[day as keyof WeeklySchedule].map(s => 
        s.id === id ? { ...s, [field]: value } : s
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-24 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-3xl relative z-10">
        
        {/* Header */}
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Class Schedule <Calendar className="text-blue-400" />
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {userProfile.faculty} • {userProfile.batch}
            </p>
          </div>
          
          {/* CR Controls */}
          {isCR && (
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-lg ${
                isEditing 
                  ? "bg-green-600 hover:bg-green-500 text-white shadow-green-900/20" 
                  : "bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700"
              }`}
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : isEditing ? <Save size={18} /> : <Edit3 size={18} />}
              {isEditing ? "Save Changes" : "Edit Schedule"}
            </button>
          )}
        </header>

        {/* Day Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                activeDay === day 
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50" 
                  : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Schedule List */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {schedule[activeDay as keyof WeeklySchedule]?.length > 0 ? (
                schedule[activeDay as keyof WeeklySchedule].map((session, index) => (
                  <div 
                    key={session.id} 
                    className={`relative p-5 rounded-2xl border mb-4 group transition-all ${
                      isEditing ? "bg-slate-900/80 border-slate-700" : "bg-slate-900/40 backdrop-blur-md border-white/5 hover:border-blue-500/30"
                    }`}
                  >
                    {isEditing ? (
                      // EDIT MODE INPUTS
                      <div className="space-y-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">Slot {index + 1}</span>
                          <button onClick={() => removeSlot(activeDay, session.id)} className="text-red-400 hover:text-red-300 p-1">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input 
                            placeholder="Subject (e.g. CS101)" 
                            value={session.subject}
                            onChange={(e) => updateSlot(activeDay, session.id, 'subject', e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                          />
                          <input 
                            placeholder="Time (e.g. 09:00 - 10:50)" 
                            value={session.time}
                            onChange={(e) => updateSlot(activeDay, session.id, 'time', e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                          />
                          <input 
                            placeholder="Location (e.g. LH-3)" 
                            value={session.room}
                            onChange={(e) => updateSlot(activeDay, session.id, 'room', e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                          />
                          <input 
                            placeholder="Teacher (Optional)" 
                            value={session.teacher}
                            onChange={(e) => updateSlot(activeDay, session.id, 'teacher', e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      // VIEW MODE CARD
                      <div className="flex items-start gap-4">
                        {/* Time Column */}
                        <div className="w-24 flex-shrink-0 pt-1">
                          <div className="text-blue-400 font-bold text-sm flex items-center gap-1.5">
                            <Clock size={14} /> 
                            {session.time.split("-")[0]}
                          </div>
                          <div className="text-slate-500 text-xs mt-1 pl-5">
                            to {session.time.split("-")[1]}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="w-1 self-stretch bg-gradient-to-b from-blue-500/50 to-transparent rounded-full" />

                        {/* Details */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">{session.subject}</h3>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-400">
                            <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700">
                              <MapPin size={12} className="text-orange-400" />
                              {session.room}
                            </span>
                            {session.teacher && (
                              <span className="flex items-center gap-1.5">
                                <BookOpen size={12} />
                                {session.teacher}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // Empty State
                <div className="text-center py-16 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                  <div className="inline-flex p-4 bg-slate-900 rounded-full mb-4 text-slate-600">
                    <Calendar size={32} />
                  </div>
                  <p className="text-slate-500">No classes scheduled for {activeDay}.</p>
                  {isCR && (
                    <p className="text-sm text-blue-400 mt-2 cursor-pointer" onClick={() => setIsEditing(true)}>
                      Click "Edit Schedule" to add classes
                    </p>
                  )}
                </div>
              )}

              {/* Add Button (Only in Edit Mode) */}
              {isEditing && (
                <button
                  onClick={() => addSlot(activeDay)}
                  className="w-full py-4 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 font-bold hover:border-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} /> Add Class Slot
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>
    </div>
  );
}