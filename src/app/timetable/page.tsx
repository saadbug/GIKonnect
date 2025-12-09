"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { 
  Clock, MapPin, Edit3, Save, Plus, Trash2, Calendar, BookOpen, 
  AlertCircle, Loader2, CheckCircle2, LayoutGrid, List, FileText, X 
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
  duration: number;
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
  date: any; // Timestamp or Date
  location?: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TIME_SLOTS = [
  { start: "09:00", end: "09:50", label: "09:00 - 09:50" },
  { start: "10:00", end: "10:50", label: "10:00 - 10:50" },
  { start: "11:00", end: "11:50", label: "11:00 - 11:50" },
  { start: "12:00", end: "12:50", label: "12:00 - 12:50" },
  { start: "14:30", end: "15:20", label: "02:30 - 03:20" },
  { start: "15:30", end: "16:20", label: "03:30 - 04:20" },
  { start: "16:30", end: "17:20", label: "04:30 - 05:20" },
  { start: "17:30", end: "18:20", label: "05:30 - 06:20" },
];

const INITIAL_SCHEDULE: WeeklySchedule = {
  Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
};

// --- HELPER: Time Comparison ---
const getSessionStatus = (start: string, end: string, day: string) => {
  const now = new Date();
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
  
  if (day !== currentDay) return "idle";

  const getMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = getMinutes(start);
  const endMinutes = getMinutes(end);

  if (currentMinutes >= startMinutes && currentMinutes < endMinutes) return "ongoing";
  if (currentMinutes < startMinutes && startMinutes - currentMinutes <= 10) return "soon";
  
  return "idle";
};

const getDaysDifference = (date: Date) => {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return days;
};

export default function TimetablePage() {
  useAuthProtection();
  const { userProfile } = useAuth() as any;

  // --- State ---
  const [schedule, setSchedule] = useState<WeeklySchedule>(INITIAL_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState("Monday");
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [today, setToday] = useState("");
  
  const [showClassModal, setShowClassModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState<"Quiz" | "Assignment" | null>(null);
  const [newClass, setNewClass] = useState<Partial<ClassSession>>({ type: 'class', timeStart: TIME_SLOTS[0].start });
  
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [newAssessment, setNewAssessment] = useState({ title: "", date: "", location: "" });

  const isCR = userProfile?.role === "cr" || userProfile?.role === "admin";
  const docId = userProfile ? `${userProfile.faculty}_${userProfile.batch}` : null;

  // --- Fetching ---
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
      } catch (error) {
        console.error("Error loading timetable:", error);
      } finally {
        setLoading(false);
      }
    };

    const q = query(
      collection(db, "events"), 
      where("scope", "in", ["global", "targeted"]), 
      orderBy("dateTime", "asc")
    );

    const unsubEvents = onSnapshot(q, (snapshot) => {
      const fetched: Assessment[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (["Quiz", "Assignment"].includes(data.type)) {
           if (data.scope === 'targeted') {
             if (data.targetBatch !== userProfile.batch || data.targetFaculty !== userProfile.faculty) return;
           }
           fetched.push({
             id: doc.id,
             title: data.title,
             type: data.type as "Quiz" | "Assignment",
             date: data.dateTime?.toDate ? data.dateTime.toDate() : new Date(data.dateTime),
             location: data.location
           });
        }
      });
      setAssessments(fetched.filter(a => a.date >= new Date())); 
    });

    fetchTimetable();
    return () => unsubEvents();
  }, [docId, userProfile]);

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
    } catch (e) {
      alert("Failed to save.");
    }
  };

  const handleAddClass = () => {
    if (!newClass.subject || !newClass.timeStart) return;
    
    const startIdx = TIME_SLOTS.findIndex(s => s.start === newClass.timeStart);
    const duration = newClass.type === 'lab' ? 3 : 1;
    const endIdx = Math.min(startIdx + duration - 1, TIME_SLOTS.length - 1);
    const timeEnd = TIME_SLOTS[endIdx].end;

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
      [activeDay as keyof WeeklySchedule]: [...prev[activeDay as keyof WeeklySchedule], session].sort((a,b) => a.timeStart.localeCompare(b.timeStart))
    }));
    
    setShowClassModal(false);
    setNewClass({ type: 'class', timeStart: TIME_SLOTS[0].start, subject: "", room: "", teacher: "" });
  };

  const handleRemoveClass = (id: string) => {
    setSchedule(prev => ({
      ...prev,
      [activeDay as keyof WeeklySchedule]: prev[activeDay as keyof WeeklySchedule].filter(s => s.id !== id)
    }));
  };

  const handleAddAssessment = async () => {
    if (!newAssessment.title || !newAssessment.date) return;
    try {
      await addDoc(collection(db, "events"), {
        title: newAssessment.title,
        type: showAssessmentModal, 
        dateTime: new Date(newAssessment.date),
        location: newAssessment.location,
        scope: "targeted",
        targetFaculty: userProfile.faculty,
        targetBatch: userProfile.batch,
        authorName: userProfile.fullName,
        createdAt: serverTimestamp()
      });
      setNewAssessment({ title: "", date: "", location: "" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (confirm("Delete this assessment?")) {
      await deleteDoc(doc(db, "events", id));
    }
  };

  const nextQuiz = assessments.find(a => a.type === "Quiz");
  const nextAssignment = assessments.find(a => a.type === "Assignment");

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-24 relative overflow-hidden">
      
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        
        {/* Header */}
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

        {/* Assessment Tiles (Moved Below Header) */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <AssessmentTile type="Quiz" data={nextQuiz} onClick={() => setShowAssessmentModal("Quiz")} isCR={isCR} />
          <AssessmentTile type="Assignment" data={nextAssignment} onClick={() => setShowAssessmentModal("Assignment")} isCR={isCR} />
        </div>

        {/* View Mode */}
        {viewMode === 'daily' ? (
          <>
            {/* Day Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border relative ${
                    activeDay === day 
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50" 
                      : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {day}
                  {day === today && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-950 animate-pulse"></span>}
                </button>
              ))}
            </div>

            {/* Daily List */}
            <div className="space-y-3 relative">
                {TIME_SLOTS.map((slot, index) => {
                  const daySessions = schedule[activeDay as keyof WeeklySchedule] || [];
                  
                  const blockingLab = daySessions.find(s => {
                     const sIdx = TIME_SLOTS.findIndex(ts => ts.start === s.timeStart);
                     return s.type === 'lab' && sIdx < index && sIdx + s.duration > index;
                  });

                  if (blockingLab) return null; 

                  const session = daySessions.find(s => s.timeStart === slot.start);
                  const status = session ? getSessionStatus(session.timeStart, session.timeEnd, activeDay) : "idle";
                  const isActive = status === 'ongoing';
                  const isSoon = status === 'soon';

                  if (session) {
                    return (
                      <motion.div 
                        key={session.id} 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex gap-4 relative z-10 ${isActive ? "scale-[1.02]" : ""}`}
                        style={{ gridRow: `span ${session.duration}` }}
                      >
                        <div className="w-24 pt-4 text-right flex-shrink-0">
                          <span className={`text-sm font-bold ${isActive ? "text-green-400" : isSoon ? "text-orange-400" : "text-slate-400"}`}>{session.timeStart}</span>
                          <div className="text-[10px] text-slate-600">{session.timeEnd}</div>
                        </div>
                        <div className={`flex-1 p-4 rounded-2xl border transition-all ${
                          isActive ? "bg-slate-800/80 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]" : 
                          isSoon ? "bg-slate-900/60 border-orange-500/30" : 
                          session.type === 'lab' ? "bg-purple-900/10 border-purple-500/20" : 
                          "bg-slate-900/40 border-white/5"
                        }`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-bold text-lg ${session.type === 'lab' ? "text-purple-300" : "text-white"}`}>{session.subject}</h3>
                                {isActive && <span className="text-[10px] bg-green-500 text-black font-bold px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
                                {isSoon && <span className="text-[10px] bg-orange-500 text-black font-bold px-2 py-0.5 rounded-full">SOON</span>}
                              </div>
                              <div className="flex flex-wrap gap-3 text-sm text-slate-400 mt-1">
                                <span className="flex items-center gap-1"><MapPin size={12} className="text-blue-400" /> {session.room}</span>
                                {session.teacher && <span className="flex items-center gap-1"><BookOpen size={12} /> {session.teacher}</span>}
                              </div>
                            </div>
                            {isEditing && (
                              <button onClick={() => handleRemoveClass(session.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400"><Trash2 size={16} /></button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                     <div key={slot.start} className="flex gap-4 opacity-30">
                        <div className="w-24 pt-2 text-right flex-shrink-0 text-xs text-slate-600 font-mono">{slot.start}</div>
                        <div className="flex-1 h-12 border-b border-dashed border-slate-800"></div>
                     </div>
                  );
                })}
            </div>

            {isEditing && (
              <button 
                onClick={() => setShowClassModal(true)}
                className="w-full mt-6 py-4 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 font-bold hover:border-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Add Class to {activeDay}
              </button>
            )}
          </>
        ) : (
          /* WEEKLY GRID VIEW */
          <div className="overflow-x-auto pb-4 scrollbar-hide">
            {/* Added a solid dark background to the corner so it covers weird gaps */}
            <div className="min-w-[800px] bg-slate-900/40 p-4 rounded-3xl border border-white/5 grid grid-cols-[100px_repeat(5,1fr)] gap-2">
               
               {/* Top Left Corner */}
               <div className="sticky left-0 top-0 z-20 bg-slate-900/40 backdrop-blur-md rounded-tl-xl border-b border-r border-white/5 h-10"></div>
               
               {/* Headers */}
               {DAYS.map(d => <div key={d} className={`text-center font-bold p-2 rounded ${d === today ? "text-blue-400 bg-blue-500/10" : "text-slate-400"}`}>{d.substring(0,3)}</div>)}
               
               {/* Rows */}
               {TIME_SLOTS.map((slot, rIdx) => (
                 <React.Fragment key={slot.start}>
                   <div className="text-[10px] text-slate-500 font-medium flex items-center justify-end pr-3 border-r border-slate-800 h-12 ">
                      {slot.start} - {slot.end.split(":")[1]}
                   </div>
                   {DAYS.map(d => {
                     const session = schedule[d as keyof WeeklySchedule].find(s => s.timeStart === slot.start);
                     const isCovered = schedule[d as keyof WeeklySchedule].some(s => {
                        const sIdx = TIME_SLOTS.findIndex(ts => ts.start === s.timeStart);
                        return s.type === 'lab' && sIdx < rIdx && sIdx + s.duration > rIdx;
                     });
                     
                     if (isCovered) return null;
                     
                     if (session) {
                       const isLab = session.type === 'lab';
                       return (
                         <div 
                            key={session.id} 
                            style={{ gridRow: `span ${session.duration}`, height: '100%' }} 
                            className={`p-2 rounded-lg text-xs border flex flex-col justify-center ${isLab ? "bg-purple-900/40 border-purple-500/30" : "bg-blue-900/40 border-blue-500/30"}`}
                         >
                            <div className="font-bold truncate">{session.subject}</div>
                            <div className="opacity-70 truncate">{session.room}</div>
                         </div>
                       );
                     }
                     return <div key={`${d}-${rIdx}`} className="bg-slate-900/20 rounded-lg h-12"></div>
                   })}
                 </React.Fragment>
               ))}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {showClassModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6">
              <div className="flex justify-between mb-4">
                <h3 className="text-xl font-bold">Add Class ({activeDay})</h3>
                <button onClick={() => setShowClassModal(false)}><X /></button>
              </div>
              <div className="space-y-4">
                <input placeholder="Subject" value={newClass.subject} onChange={e => setNewClass({...newClass, subject: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white" />
                <div className="grid grid-cols-2 gap-4">
                  <select value={newClass.timeStart} onChange={e => setNewClass({...newClass, timeStart: e.target.value})} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-white">
                    {TIME_SLOTS.map(t => <option key={t.start} value={t.start}>{t.label}</option>)}
                  </select>
                  <select value={newClass.type} onChange={e => setNewClass({...newClass, type: e.target.value as any})} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-white">
                    <option value="class">Class (50m)</option>
                    <option value="lab">Lab (3h)</option>
                  </select>
                </div>
                <input placeholder="Room" value={newClass.room} onChange={e => setNewClass({...newClass, room: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white" />
                <button onClick={handleAddClass} className="w-full bg-blue-600 py-3 rounded-xl font-bold">Add</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAssessmentModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 p-6 flex flex-col max-h-[85vh]">
              <div className="flex justify-between mb-4">
                <h3 className="text-xl font-bold">{showAssessmentModal}s</h3>
                <button onClick={() => setShowAssessmentModal(null)}><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {assessments.filter(a => a.type === showAssessmentModal).length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No upcoming {showAssessmentModal}s.</p>
                ) : (
                  assessments.filter(a => a.type === showAssessmentModal).map(a => (
                    <div key={a.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{a.title}</div>
                        <div className="text-xs text-slate-400">{a.date.toLocaleString()} • {a.location}</div>
                      </div>
                      {isCR && <button onClick={() => handleDeleteAssessment(a.id)} className="text-red-400 p-2"><Trash2 size={16} /></button>}
                    </div>
                  ))
                )}
              </div>
              {isCR && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <input placeholder="Title" value={newAssessment.title} onChange={e => setNewAssessment({...newAssessment, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-sm text-white" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="datetime-local" value={newAssessment.date} onChange={e => setNewAssessment({...newAssessment, date: e.target.value})} className="bg-slate-950 border border-slate-800 p-2 rounded-lg text-sm text-white" />
                    <input placeholder="Location" value={newAssessment.location} onChange={e => setNewAssessment({...newAssessment, location: e.target.value})} className="bg-slate-950 border border-slate-800 p-2 rounded-lg text-sm text-white" />
                  </div>
                  <button onClick={handleAddAssessment} className="w-full bg-blue-600 py-2 rounded-lg font-bold text-sm">Post</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component for Tiles
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

  if (daysLeft === 0) { timeLabel = "Today"; color = "red"; }
  else if (daysLeft === 1) { timeLabel = "Tomorrow"; color = "orange"; }
  else if (daysLeft <= 3) { color = "orange"; }

  const glowClass = type === "Quiz" && daysLeft <= 2 ? "shadow-[0_0_20px_rgba(239,68,68,0.3)] border-red-500/50" : "border-white/10";

  return (
    <div onClick={onClick} className={`flex-1 bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 cursor-pointer transition-all border relative overflow-hidden group ${glowClass}`}>
      <div className={`absolute top-0 left-0 w-1 h-full bg-${color}-500`} />
      <div className="flex justify-between items-start mb-1 pl-3">
        <div>
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Upcoming {type}</span>
           <h3 className="font-bold text-white group-hover:text-blue-400 transition text-lg">{data.title}</h3>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${color}-500/20 text-${color}-300 uppercase font-bold`}>
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