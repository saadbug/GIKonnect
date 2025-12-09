"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { 
  Clock, MapPin, Edit3, Save, Plus, Trash2, Calendar, BookOpen, 
  AlertCircle, Loader2, LayoutGrid, List, FileText, X, Coffee
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type SessionType = 'class' | 'lab';

type ClassSession = {
  id: string;
  subject: string;
  timeStart: string;
  timeEnd: string;
  room: string;
  teacher?: string;
  type: SessionType;
  duration: number; // Slots occupied
};

type WeeklySchedule = {
  Monday: ClassSession[];
  Tuesday: ClassSession[];
  Wednesday: ClassSession[];
  Thursday: ClassSession[];
  Friday: ClassSession[];
};

type Assessment = {
  id: string;
  title: string;
  type: "Quiz" | "Assignment";
  date: any;
  location?: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// --- MASTER TIME CONFIGURATION (9 Slots) ---
const SLOTS_STD = [
  { start: "08:00", end: "08:50" }, // 0
  { start: "09:00", end: "09:50" }, // 1
  { start: "10:30", end: "11:20" }, // 2
  { start: "11:30", end: "12:20" }, // 3
  { start: "12:30", end: "13:20" }, // 4
  // BREAK HAPPENS HERE (Between 4 and 5)
  { start: "14:30", end: "15:20" }, // 5
  { start: "15:30", end: "16:20" }, // 6
  { start: "16:30", end: "17:20" }, // 7
  { start: "17:30", end: "18:20" }, // 8
];

const SLOTS_FRI = [
  { start: "08:00", end: "08:50" }, // 0
  { start: "09:00", end: "09:50" }, // 1
  { start: "10:00", end: "10:50" }, // 2
  { start: "11:00", end: "11:50" }, // 3
  { start: "12:00", end: "12:50" }, // 4
  // BREAK HAPPENS HERE
  { start: "14:30", end: "15:20" }, // 5
  { start: "15:30", end: "16:20" }, // 6
  { start: "16:30", end: "17:20" }, // 7
  { start: "17:30", end: "18:20" }, // 8
];

// Used for Grid Iteration
const GRID_ROWS = Array.from({ length: 9 });

const INITIAL_SCHEDULE: WeeklySchedule = {
  Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
};

// --- HELPERS ---

const getTimeMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const getSessionStatus = (start: string, end: string, day: string, nextUpcomingStart: string | null) => {
  const now = new Date();
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
  
  if (day !== currentDay) return "idle";

  const currentMins = now.getHours() * 60 + now.getMinutes();
  const startMins = getTimeMinutes(start);
  const endMins = getTimeMinutes(end);

  if (currentMins >= endMins) return "finished";
  if (currentMins >= startMins && currentMins < endMins) return "ongoing";
  if (start === nextUpcomingStart) return "upcoming"; 
  
  return "idle";
};

const getDaysDifference = (date: Date) => {
  const now = new Date();
  now.setHours(0,0,0,0);
  const target = new Date(date);
  target.setHours(0,0,0,0);
  const diffTime = target.getTime() - now.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24)); 
};

const getBreakStatus = (day: string) => {
  const now = new Date();
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
  if (day !== currentDay) return false;
  
  const mins = now.getHours() * 60 + now.getMinutes();
  if (day === "Friday") return mins >= 770 && mins < 870; // Juma (12:50 - 14:30)
  return mins >= 800 && mins < 870; // Lunch (13:20 - 14:30)
};

export default function TimetablePage() {
  useAuthProtection();
  const { userProfile } = useAuth() as any;

  // State
  const [schedule, setSchedule] = useState<WeeklySchedule>(INITIAL_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState("Monday");
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [today, setToday] = useState("");
  
  // Modal State
  const [showClassModal, setShowClassModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState<"Quiz" | "Assignment" | null>(null);
  
  const [newClass, setNewClass] = useState<Partial<ClassSession>>({ 
    type: 'class', timeStart: "", subject: "", room: "", teacher: "" 
  });
  const [conflictError, setConflictError] = useState("");
  
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [newAssessment, setNewAssessment] = useState({ title: "", date: "", location: "" });

  const isCR = userProfile?.role === "cr" || userProfile?.role === "admin";
  const docId = userProfile ? `${userProfile.faculty}_${userProfile.batch}` : null;

  // --- Initial Load ---
  useEffect(() => {
    const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
    setToday(currentDay);
    if (DAYS.includes(currentDay)) setActiveDay(currentDay);

    if (!docId) return;

    const fetchTimetable = async () => {
      try {
        const docRef = doc(db, "timetables", docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSchedule(docSnap.data().schedule as WeeklySchedule);
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const q = query(collection(db, "events"), where("scope", "in", ["global", "targeted"]), orderBy("dateTime", "asc"));
    const unsubEvents = onSnapshot(q, (snapshot) => {
      const fetched: Assessment[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (["Quiz", "Assignment"].includes(data.type)) {
           if (data.scope === 'targeted' && (data.targetBatch !== userProfile.batch || data.targetFaculty !== userProfile.faculty)) return;
           fetched.push({
             id: doc.id,
             title: data.title,
             type: data.type as "Quiz" | "Assignment",
             date: data.dateTime?.toDate ? data.dateTime.toDate() : new Date(data.dateTime),
             location: data.location
           });
        }
      });
      setAssessments(fetched.filter(a => getDaysDifference(a.date) >= 0)); 
    });

    fetchTimetable();
    return () => unsubEvents();
  }, [docId, userProfile]);

  // --- Conflict Detection ---
  const checkConflict = (day: string, startTime: string, type: SessionType, durationStr?: number) => {
    const slots = day === "Friday" ? SLOTS_FRI : SLOTS_STD;
    const startIdx = slots.findIndex(s => s.start === startTime);
    if (startIdx === -1) return "Invalid time";

    const duration = type === 'lab' ? (durationStr || 3) : 1;
    if (startIdx + duration > slots.length) return "Duration exceeds day limits";

    const daySessions = schedule[day as keyof WeeklySchedule] || [];
    for (let i = 0; i < duration; i++) {
        const checkIdx = startIdx + i;
        const overlap = daySessions.find(s => {
            const sStartIdx = slots.findIndex(ts => ts.start === s.timeStart);
            return sStartIdx <= checkIdx && (sStartIdx + s.duration) > checkIdx;
        });
        if (overlap) return `Conflict with ${overlap.subject}`;
    }
    return "";
  };

  useEffect(() => {
    if (showClassModal && newClass.timeStart) {
        const error = checkConflict(activeDay, newClass.timeStart, newClass.type || 'class', newClass.duration);
        setConflictError(error);
    } else {
        setConflictError("");
    }
  }, [newClass.timeStart, newClass.type, newClass.duration, showClassModal, activeDay]);

  // --- Handlers ---
  const handleSaveTimetable = async () => {
    if (!docId) return;
    try {
      await setDoc(doc(db, "timetables", docId), {
        faculty: userProfile.faculty,
        batch: userProfile.batch,
        schedule: schedule,
        updatedBy: userProfile.fullName,
        lastUpdated: serverTimestamp(),
      });
      setSaveMessage("Saved!");
      setIsEditing(false);
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (e) { alert("Failed to save."); }
  };

  const handleAddClass = () => {
    if (!newClass.subject || !newClass.timeStart || conflictError) return;
    
    const slots = activeDay === "Friday" ? SLOTS_FRI : SLOTS_STD;
    const startIdx = slots.findIndex(s => s.start === newClass.timeStart);
    const duration = newClass.type === 'lab' ? (parseInt(newClass.duration?.toString() || "3")) : 1;
    const endIdx = Math.min(startIdx + duration - 1, slots.length - 1);
    const timeEnd = slots[endIdx].end;

    const session: ClassSession = {
      id: Date.now().toString(),
      subject: newClass.subject,
      timeStart: newClass.timeStart,
      timeEnd: timeEnd,
      room: newClass.room || "TBD",
      teacher: newClass.teacher || "",
      type: newClass.type || 'class',
      duration: duration
    };

    setSchedule(prev => ({
      ...prev,
      [activeDay as keyof WeeklySchedule]: [...prev[activeDay as keyof WeeklySchedule], session].sort((a,b) => getTimeMinutes(a.timeStart) - getTimeMinutes(b.timeStart))
    }));
    setShowClassModal(false);
    setNewClass({ type: 'class', timeStart: "", subject: "", room: "", teacher: "" });
  };

  const handleRemoveClass = (id: string) => {
    setSchedule(prev => ({
      ...prev,
      [activeDay as keyof WeeklySchedule]: prev[activeDay as keyof WeeklySchedule].filter(s => s.id !== id)
    }));
  };

  const handleAddAssessment = async () => {
    if (!newAssessment.title || !newAssessment.date || !showAssessmentModal) return;
    try {
      await addDoc(collection(db, "events"), {
        title: newAssessment.title,
        type: showAssessmentModal, 
        dateTime: new Date(newAssessment.date),
        location: newAssessment.location || "",
        scope: "targeted",
        targetFaculty: userProfile.faculty,
        targetBatch: userProfile.batch,
        authorName: userProfile.fullName,
        createdAt: serverTimestamp()
      });
      setNewAssessment({ title: "", date: "", location: "" });
    } catch (e) { console.error(e); alert("Error adding assessment"); }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (confirm("Delete this assessment?")) await deleteDoc(doc(db, "events", id));
  };

  // --- Views ---

  const getNextUpcomingTime = (day: string, daySessions: ClassSession[]) => {
    const now = new Date();
    if (day !== now.toLocaleDateString("en-US", { weekday: "long" })) return null;
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const upcoming = daySessions
      .sort((a,b) => getTimeMinutes(a.timeStart) - getTimeMinutes(b.timeStart))
      .find(s => getTimeMinutes(s.timeStart) > currentMins);
    return upcoming ? upcoming.timeStart : null;
  };

  const DailyView = () => {
    const isFriday = activeDay === "Friday";
    const currentSlots = isFriday ? SLOTS_FRI : SLOTS_STD;
    const daySessions = schedule[activeDay as keyof WeeklySchedule] || [];
    const nextUpcomingTime = getNextUpcomingTime(activeDay, daySessions);
    const lunchIndex = 5; 
    let skipSlots = 0;

    return (
      <div className="space-y-3 relative">
        {currentSlots.map((slot, index) => {
          if (skipSlots > 0) { skipSlots--; return null; }

          const renderBreak = (
            <div key={`break-${index}`} className={`flex gap-4 p-4 rounded-2xl border mb-3 items-center justify-center transition-all duration-500 ${getBreakStatus(activeDay) ? "bg-orange-900/40 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.2)] backdrop-blur-md" : "bg-slate-900/30 border-white/5 opacity-40"}`}>
               <Coffee className={getBreakStatus(activeDay) ? "text-orange-400 animate-pulse" : "text-slate-600"} size={20} />
               <span className={`font-bold ${getBreakStatus(activeDay) ? "text-orange-300" : "text-slate-500"}`}>
                 {isFriday ? "Juma Break (12:50 - 14:30)" : "Lunch Break (13:20 - 14:30)"}
               </span>
            </div>
          );

          const session = daySessions.find(s => s.timeStart === slot.start);
          const status = session ? getSessionStatus(session.timeStart, session.timeEnd, activeDay, nextUpcomingTime) : "idle";
          const isActive = status === 'ongoing';
          const isUpcoming = status === 'upcoming';
          const isFinished = status === 'finished';

          const content = (
            <React.Fragment key={slot.start}>
              {index === lunchIndex && renderBreak}

              {session ? (
                (() => {
                  if (session.type === 'lab') skipSlots = session.duration - 1;
                  const isLab = session.type === 'lab';
                  return (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className={`flex gap-4 relative z-10 mb-3 ${isActive ? "scale-[1.02]" : ""}`}
                    >
                      <div className="w-24 pt-4 text-right flex-shrink-0">
                        <span className={`text-sm font-bold ${isActive ? "text-green-400" : isUpcoming ? "text-orange-400" : "text-slate-400"}`}>{session.timeStart}</span>
                        <div className="text-[10px] text-slate-600">{session.timeEnd}</div>
                      </div>
                      <div className={`flex-1 p-4 rounded-2xl border transition-all duration-300 backdrop-blur-md ${
                        isFinished ? "bg-slate-900/20 border-white/5 opacity-50 grayscale" :
                        isActive ? "bg-slate-800/60 border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.15)] ring-1 ring-green-500/30" : 
                        isUpcoming ? "bg-slate-900/60 border-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.1)] ring-1 ring-orange-500/30" : 
                        isLab ? "bg-purple-900/10 border-purple-500/20" : "bg-slate-900/40 border-white/10"
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-bold text-lg ${isLab ? "text-purple-300" : "text-white"}`}>{session.subject}</h3>
                              {isActive && <span className="text-[10px] bg-green-500 text-black font-bold px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]">LIVE</span>}
                              {isUpcoming && <span className="text-[10px] bg-orange-500 text-black font-bold px-2 py-0.5 rounded-full">NEXT</span>}
                              {isFinished && <span className="text-[10px] bg-slate-700 text-slate-300 font-bold px-2 py-0.5 rounded-full">DONE</span>}
                              <span className={`text-[9px] uppercase border px-1.5 rounded ${isLab ? "border-purple-500 text-purple-400" : "border-blue-500 text-blue-400"}`}>
                                {isLab ? "Lab" : "Class"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-slate-400 mt-1">
                              <span className="flex items-center gap-1"><MapPin size={12} className="text-blue-400" /> {session.room}</span>
                              {session.teacher && <span className="flex items-center gap-1"><BookOpen size={12} /> {session.teacher}</span>}
                            </div>
                          </div>
                          {isEditing && (
                            <button onClick={() => handleRemoveClass(session!.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400"><Trash2 size={16} /></button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })()
              ) : (
                <div className="flex gap-4 opacity-30 mb-3">
                  <div className="w-24 pt-2 text-right flex-shrink-0 text-xs text-slate-600 font-mono">{slot.start}</div>
                  <div className="flex-1 h-14 border-b border-dashed border-slate-800"></div>
                </div>
              )}
            </React.Fragment>
          );
          return content;
        })}
      </div>
    );
  };

  const WeeklyView = () => {
    return (
      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <div className="min-w-[900px] bg-slate-900/40 p-4 rounded-3xl border border-white/5 grid grid-cols-[80px_repeat(4,1fr)_1px_1fr_80px] gap-2">
           
           <div className="sticky left-0 top-0 z-20 bg-slate-900/90 backdrop-blur-md rounded-tl-xl border-b border-r border-white/5 h-10"></div>
           {DAYS.map((d) => {
             const isFri = d === "Friday";
             return (
               <React.Fragment key={d}>
                 {isFri && <div className="w-px bg-slate-800 mx-1"></div>} 
                 <div className={`text-center font-bold p-2 rounded text-sm ${d === today ? "text-green-400 bg-green-500/10 border border-green-500/20" : isFri ? "text-purple-300" : "text-slate-400"}`}>
                   {d.substring(0,3)}
                 </div>
                 {isFri && <div className="h-10 border-b border-l border-white/5 flex items-center justify-center text-[10px] font-bold text-purple-400/70">FRI</div>}
               </React.Fragment>
             )
           })}

           {GRID_ROWS.map((_, rIdx) => {
             const stdSlot = SLOTS_STD[rIdx];
             const friSlot = SLOTS_FRI[rIdx];
             
             // VISUAL BREAK
             const renderBreak = (
                <div className="col-span-8 h-10 flex items-center justify-center bg-slate-800/30 rounded text-[10px] uppercase font-bold tracking-widest text-slate-500 my-1">
                   Break Time
                </div>
             );

             const rowContent = (
               <React.Fragment key={`row-${rIdx}`}>
                 <div className="sticky left-0 bg-slate-950/95 z-10 text-[10px] text-slate-500 font-medium flex flex-col items-end justify-center pr-3 border-r border-slate-800 h-14">
                    <span>{stdSlot?.start}</span>
                    <span className="opacity-50">{stdSlot?.end}</span>
                 </div>

                 {DAYS.map((d) => {
                   const isFri = d === "Friday";
                   const currentSlot = isFri ? friSlot : stdSlot;
                   if (!currentSlot) return <div key={`${d}-${rIdx}`} className="bg-transparent" />; 

                   const session = schedule[d as keyof WeeklySchedule].find(s => s.timeStart === currentSlot.start);
                   
                   let visualStatus = "idle";
                   if (session) {
                      const daySessions = schedule[d as keyof WeeklySchedule];
                      const nextUp = getNextUpcomingTime(d, daySessions);
                      visualStatus = getSessionStatus(session.timeStart, session.timeEnd, d, nextUp);
                   }

                   const isCovered = schedule[d as keyof WeeklySchedule].some(s => {
                      const slots = isFri ? SLOTS_FRI : SLOTS_STD;
                      const sIdx = slots.findIndex(ts => ts.start === s.timeStart);
                      return s.type === 'lab' && sIdx < rIdx && sIdx + s.duration > rIdx;
                   });

                   const cell = (
                     isCovered ? null :
                     session ? (
                       <div 
                          key={session.id} 
                          style={{ gridRow: `span ${session.duration}`, height: '100%' }} 
                          className={`p-1.5 rounded-lg text-[10px] border flex flex-col justify-center relative transition-all duration-300
                            ${visualStatus === 'finished' ? "bg-slate-900/10 border-white/5 opacity-40 grayscale" : 
                              session.type === 'lab' ? "bg-purple-900/40 border-purple-500/30 text-purple-200" : "bg-blue-900/40 border-blue-500/30 text-blue-200"} 
                            ${visualStatus === 'ongoing' ? "ring-1 ring-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)] z-10 scale-105" : ""}
                            ${visualStatus === 'upcoming' ? "ring-1 ring-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.15)]" : ""}
                          `}
                       >  
                          {visualStatus === 'ongoing' && <div className="absolute top-1 right-1 px-1 bg-green-500 text-black text-[8px] font-bold rounded">LIVE</div>}
                          {visualStatus === 'upcoming' && <div className="absolute top-1 right-1 px-1 bg-orange-500 text-black text-[8px] font-bold rounded">NEXT</div>}
                          {visualStatus === 'finished' && <div className="absolute top-1 right-1 px-1 bg-slate-700 text-slate-300 text-[8px] font-bold rounded">DONE</div>}
                          <div className="font-bold truncate">{session.subject}</div>
                          <div className="opacity-70 truncate text-[9px]">{session.room}</div>
                       </div>
                     ) : <div key={`${d}-${rIdx}`} className={`rounded-lg h-14 ${d === today ? "bg-green-500/5" : "bg-slate-900/20"}`}></div>
                   );

                   return (
                     <React.Fragment key={`${d}-cell`}>
                       {isFri && <div className="w-px bg-slate-800/50 mx-1"></div>}
                       {cell}
                       {isFri && (
                         <div className="text-[10px] text-purple-400/70 font-medium flex flex-col items-start justify-center pl-3 border-l border-slate-800 h-14">
                            <span>{friSlot?.start}</span>
                            <span className="opacity-50">{friSlot?.end}</span>
                         </div>
                       )}
                     </React.Fragment>
                   );
                 })}
               </React.Fragment>
             );

             // Inject Break at index 5 (after 13:20 slot)
             return rIdx === 5 ? <React.Fragment key={`group-${rIdx}`}>{renderBreak}{rowContent}</React.Fragment> : rowContent;
           })}
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  const nextQuiz = assessments.find(a => a.type === "Quiz");
  const nextAssignment = assessments.find(a => a.type === "Assignment");

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-24 relative overflow-hidden">
      
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Timetable <Calendar className="text-blue-400" />
            </h1>
            <p className="text-slate-400 text-sm">{userProfile.faculty} • {userProfile.batch}</p>
          </div>
          
          <div className="flex gap-2">
            {!isEditing && (
              <div className="bg-slate-900/50 p-1 rounded-xl flex border border-slate-800">
                <button onClick={() => setViewMode('daily')} className={`p-2 rounded-lg transition-all ${viewMode === 'daily' ? "bg-blue-600 text-white" : "text-slate-400"}`}><List size={20} /></button>
                <button onClick={() => setViewMode('weekly')} className={`p-2 rounded-lg transition-all ${viewMode === 'weekly' ? "bg-blue-600 text-white" : "text-slate-400"}`}><LayoutGrid size={20} /></button>
              </div>
            )}
            {isCR && (
              <button
                onClick={() => isEditing ? handleSaveTimetable() : setIsEditing(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-lg ${
                  isEditing ? "bg-green-600 hover:bg-green-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700"
                }`}
              >
                {isEditing ? <Save size={18} /> : <Edit3 size={18} />}
                <span className="hidden md:inline">{isEditing ? "Save" : "Edit"}</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <AssessmentTile type="Quiz" data={nextQuiz} onClick={() => setShowAssessmentModal("Quiz")} isCR={isCR} />
          <AssessmentTile type="Assignment" data={nextAssignment} onClick={() => setShowAssessmentModal("Assignment")} isCR={isCR} />
        </div>

        {viewMode === 'daily' ? (
          <>
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border relative ${
                    activeDay === day 
                      ? "bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/50" 
                      : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <DailyView />

            {isEditing && (
              <button 
                onClick={() => {
                   setNewClass({ type: 'class', timeStart: (activeDay === "Friday" ? SLOTS_FRI : SLOTS_STD)[0].start, subject: "", room: "", teacher: "" });
                   setShowClassModal(true);
                }}
                className="w-full mt-6 py-4 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 font-bold hover:border-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Add Class to {activeDay}
              </button>
            )}
          </>
        ) : (
          <WeeklyView />
        )}
      </main>

      <AnimatePresence>
        {showClassModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between mb-4">
                <h3 className="text-xl font-bold">Add Class ({activeDay})</h3>
                <button onClick={() => setShowClassModal(false)}><X /></button>
              </div>
              <div className="space-y-4">
                <input placeholder="Subject" value={newClass.subject || ""} onChange={e => setNewClass({...newClass, subject: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white" />
                <div className="grid grid-cols-2 gap-4">
                  <select value={newClass.timeStart || ""} onChange={e => setNewClass({...newClass, timeStart: e.target.value})} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-white">
                    {(activeDay === "Friday" ? SLOTS_FRI : SLOTS_STD).map(t => {
                        const isBooked = checkConflict(activeDay, t.start, newClass.type || 'class', newClass.duration) !== "";
                        return <option key={t.start} value={t.start} disabled={isBooked} className={isBooked ? "text-slate-600" : ""}>{t.start} {isBooked ? "(Occupied)" : ""}</option>
                    })}
                  </select>
                  <select value={newClass.type || "class"} onChange={e => setNewClass({...newClass, type: e.target.value as any})} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-white">
                    <option value="class">Class</option>
                    <option value="lab">Lab</option>
                  </select>
                </div>
                {newClass.type === 'lab' && (
                   <select value={newClass.duration || 3} onChange={e => setNewClass({...newClass, duration: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white">
                      <option value={2}>2 Slots (Approx 2 hrs)</option>
                      <option value={3}>3 Slots (Approx 3 hrs)</option>
                   </select>
                )}
                <input placeholder="Room" value={newClass.room || ""} onChange={e => setNewClass({...newClass, room: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white" />
                
                {conflictError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                        <AlertTriangle size={16} /> {conflictError}
                    </div>
                )}

                <button 
                    onClick={handleAddClass} 
                    disabled={!!conflictError || !newClass.subject}
                    className="w-full bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Add
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAssessmentModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 p-6 flex flex-col max-h-[85vh] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between mb-4">
                <h3 className="text-xl font-bold">{showAssessmentModal}s</h3>
                <button onClick={() => setShowAssessmentModal(null)}><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {assessments.filter(a => a.type === showAssessmentModal).length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No upcoming {showAssessmentModal}s.</p>
                ) : (
                  assessments.filter(a => a.type === showAssessmentModal).map(a => {
                    const daysLeft = getDaysDifference(a.date);
                    const color = daysLeft <= 1 ? "red" : "blue";
                    return (
                        <div key={a.id} className={`p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center ${daysLeft <= 1 ? "border-red-500/40 bg-red-900/10" : ""}`}>
                        <div>
                            <div className="font-bold text-white text-lg">{a.title}</div>
                            <div className="text-xs text-slate-400 mt-1 flex gap-3">
                                <span>📅 {a.date.toLocaleDateString()}</span>
                                <span>⏰ {a.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                {a.location && <span>📍 {a.location}</span>}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`block font-bold text-2xl text-${color}-400`}>{daysLeft === 0 ? "Today" : daysLeft}</span>
                            <span className={`text-[10px] uppercase text-${color}-500`}>{daysLeft === 0 ? "Due" : "Days Left"}</span>
                        </div>
                        {isCR && <button onClick={() => handleDeleteAssessment(a.id)} className="text-red-400 p-2"><Trash2 size={16} /></button>}
                        </div>
                    );
                  })
                )}
              </div>
              {isCR && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <input placeholder="Title" value={newAssessment.title} onChange={e => setNewAssessment({...newAssessment, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-sm text-white" />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                        type="datetime-local" 
                        value={newAssessment.date} 
                        onChange={e => setNewAssessment({...newAssessment, date: e.target.value})} 
                        className="bg-slate-950 border border-slate-800 p-2 rounded-lg text-sm text-white [color-scheme:dark]" 
                    />
                    <input placeholder="Location" value={newAssessment.location} onChange={e => setNewAssessment({...newAssessment, location: e.target.value})} className="bg-slate-950 border border-slate-800 p-2 rounded-lg text-sm text-white" />
                  </div>
                  <button onClick={() => { handleAddAssessment(); setShowAssessmentModal(null); }} className="w-full bg-blue-600 py-2 rounded-lg font-bold text-sm hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]">Post</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Tile Component
const AssessmentTile = ({ type, data, onClick, isCR }: any) => {
  if (!data) return (
    <div onClick={onClick} className="flex-1 bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-900/60 transition group">
      {type === "Quiz" ? <AlertCircle className="text-slate-600 group-hover:text-slate-400" /> : <FileText className="text-slate-600 group-hover:text-slate-400" />}
      <span className="text-slate-500 text-sm font-medium">No Upcoming {type}</span>
      {isCR && <Plus size={16} className="text-blue-500 ml-2" />}
    </div>
  );
  
  const daysLeft = getDaysDifference(data.date);
  let timeLabel = `${daysLeft} Days`;
  let color = "blue";

  if (daysLeft <= 0) { timeLabel = "Today"; color = "red"; }
  else if (daysLeft === 1) { timeLabel = "Tomorrow"; color = "orange"; }
  else if (daysLeft <= 3) { color = "orange"; }

  return (
    <div onClick={onClick} className={`flex-1 bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 cursor-pointer transition-all border relative overflow-hidden group border-${color}-500/30 hover:border-${color}-500/60 hover:shadow-[0_0_20px_rgba(0,0,0,0.2)]`}>
      <div className={`absolute top-0 left-0 w-1 h-full bg-${color}-500`} />
      <div className="flex justify-between items-start mb-1 pl-3">
        <div>
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Upcoming {type}</span>
           <h3 className="font-bold text-white group-hover:text-blue-400 transition text-lg">{data.title}</h3>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${color}-500/20 text-${color}-300 uppercase font-bold shadow-[0_0_10px_rgba(0,0,0,0.2)]`}>
          {timeLabel}
        </span>
      </div>
      <p className="text-xs text-slate-400 pl-3 mt-1 flex gap-2">
        <span className="font-bold text-slate-300">{data.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span>• {data.location || "No Location"}</span>
      </p>
    </div>
  );
};