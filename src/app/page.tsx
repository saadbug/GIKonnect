"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar as CalendarIcon, Sparkles, Pin, Plus, Trash2, Filter, X, Globe, Target, User, Mail, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { useAuth } from "@/context/AuthContext";
import { collection, onSnapshot, Timestamp, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import Link from "next/link";
import LavaBackground from "@/components/LavaBackground";

// --- Types ---
type Event = {
  id: string;
  title: string;
  description?: string;
  date: Date;
  location?: string;
  type: "Quiz" | "Holiday" | "Notice" | "Academic" | "Social" | "Mess" | "Sport";
  scope: "global" | "targeted";
  targetFaculty?: string;
  targetBatch?: string;
  isPinned?: boolean;
  authorName?: string;
  authorEmail?: string;
  designation?: string;
  authorRole?: string;
};

const FACULTIES = [
  "Computer Science", "Electrical Engineering", "Mechanical Engineering", 
  "Artificial Intelligence", "Software Engineering", "Chemical Engineering",
  "Civil Engineering", "Data Science", "Cyber Security"
];
// Updated to specific batches
const BATCHES = ["Batch 32", "Batch 33", "Batch 34", "Batch 35"];

export default function Home() {
  useAuthProtection();
  
  const { userProfile } = useAuth() as any;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin Filter State
  const [showAdminFilter, setShowAdminFilter] = useState(false);
  const [adminViewTarget, setAdminViewTarget] = useState<{ faculty: string, batch: string } | null>(null);

  // Modal States
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // --- Calendar Logic ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; 
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // --- Actions ---
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "events", deleteTarget));
      setDeleteTarget(null);
      setSelectedEvent(null); // Close detail view if open
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Failed to delete event.");
    }
  };

  // --- Data Fetching ---
  useEffect(() => {
    if (!userProfile) return;

    const q = query(collection(db, "events"), orderBy("dateTime", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents: Event[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        let eventDate = new Date();
        if (data.dateTime) {
             eventDate = data.dateTime instanceof Timestamp ? data.dateTime.toDate() : new Date(data.dateTime);
        }

        fetchedEvents.push({
          id: doc.id,
          title: data.title || "Untitled Event",
          description: data.description || "",
          date: eventDate,
          location: data.location || "",
          type: data.type || "Notice",
          scope: data.scope || "global",
          targetFaculty: data.targetFaculty,
          targetBatch: data.targetBatch,
          isPinned: data.isPinned || false,
          authorName: data.authorName || "Unknown",
          authorEmail: data.authorEmail || "",
          designation: data.authorDesignation || data.designation || "Student",
          authorRole: data.authorRole || "",
        });
      });

      const filteredEvents = fetchedEvents.filter((event) => {
        if (event.scope === 'global') return true;

        if (event.scope === 'targeted') {
          const userFac = (userProfile.faculty || "").toLowerCase();
          const userBatch = (userProfile.batch || "").toString().toLowerCase().replace("batch", "").trim();
          const eventFac = (event.targetFaculty || "").toLowerCase();
          const eventBatch = (event.targetBatch || "").toString().toLowerCase().replace("batch", "").trim();

          if (userProfile.batch) {
             if (userFac === eventFac && userBatch === eventBatch) return true;
          }

          if (userProfile.role === 'admin' && adminViewTarget) {
             const filterFac = adminViewTarget.faculty.toLowerCase();
             const filterBatch = adminViewTarget.batch.toLowerCase().replace("batch", "").trim();
             if (filterFac === eventFac && filterBatch === eventBatch) return true;
          }
        }
        return false;
      });

      filteredEvents.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return a.date.getTime() - b.date.getTime(); 
      });

      setEvents(filteredEvents);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile, adminViewTarget]);

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      return (
        e.date.getDate() === day &&
        e.date.getMonth() === month &&
        e.date.getFullYear() === year
      );
    });
  };

  const displayEvents = selectedDate
    ? events.filter((e) => {
        return (
          e.date.getDate() === selectedDate.getDate() &&
          e.date.getMonth() === selectedDate.getMonth() &&
          e.date.getFullYear() === selectedDate.getFullYear()
        );
      })
    : events.filter((e) => e.date >= new Date()); 

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Quiz": return "bg-red-500/10 text-red-300 border-red-500/20";
      case "Holiday": return "bg-green-500/10 text-green-300 border-green-500/20";
      case "Notice": return "bg-blue-500/10 text-blue-300 border-blue-500/20";
      case "Academic": return "bg-purple-500/10 text-purple-300 border-purple-500/20";
      case "Social": return "bg-orange-500/10 text-orange-300 border-orange-500/20";
      default: return "bg-slate-500/10 text-slate-300 border-slate-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans text-white pb-24">
      
      {/* Active Lava Lamp Background */}
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

      <main className="container mx-auto px-4 py-8 max-w-lg relative z-10">
        
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg flex items-center gap-2">
              GIKonnect <Sparkles className="h-5 w-5 text-yellow-400" />
            </h1>
            <p className="text-sm text-slate-400">Your Campus, Synchronized.</p>
          </div>
          
          {userProfile?.role === 'admin' && (
             <button 
                onClick={() => setShowAdminFilter(!showAdminFilter)}
                className={`p-3 rounded-2xl border transition-all ${showAdminFilter || adminViewTarget ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20" : "bg-slate-900/50 text-slate-400 border-white/10 hover:text-white"}`}
             >
                <Filter size={20} />
             </button>
          )}
        </motion.header>

        {/* --- ADMIN FILTER PANEL --- */}
        <AnimatePresence>
          {showAdminFilter && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 p-4 rounded-2xl">
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">Admin Spyglass</h3>
                    {adminViewTarget && (
                      <button onClick={() => setAdminViewTarget(null)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                        <X size={12} /> Clear Filter
                      </button>
                    )}
                 </div>
                 <div className="grid grid-cols-1 gap-3">
                    <select 
                      className="bg-slate-950 border border-slate-700 rounded-xl p-2 text-sm text-white focus:border-purple-500 outline-none"
                      onChange={(e) => setAdminViewTarget(prev => ({ batch: prev?.batch || BATCHES[0], faculty: e.target.value }))}
                      value={adminViewTarget?.faculty || ""}
                    >
                       <option value="">Select Faculty to View</option>
                       {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select 
                      className="bg-slate-950 border border-slate-700 rounded-xl p-2 text-sm text-white focus:border-purple-500 outline-none"
                      onChange={(e) => setAdminViewTarget(prev => ({ faculty: prev?.faculty || FACULTIES[0], batch: e.target.value }))}
                      value={adminViewTarget?.batch || ""}
                    >
                       <option value="">Select Batch to View</option>
                       {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Glass Calendar Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-6 mb-8"
        >
          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition text-slate-300">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-white tracking-wide">
              {monthNames[month]} <span className="text-blue-400">{year}</span>
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition text-slate-300">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month;
              const isToday = new Date().getDate() === day && new Date().getMonth() === month;

              return (
                <motion.button
                  key={day}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedDate(new Date(year, month, day))}
                  className={`
                    aspect-square relative flex flex-col items-center justify-center rounded-xl text-sm transition-all duration-200
                    ${isSelected 
                      ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30" 
                      : isToday 
                        ? "bg-blue-500/20 text-blue-400 font-bold border border-blue-500/50" 
                        : "text-slate-300 hover:bg-white/5"
                    }
                  `}
                >
                  <span>{day}</span>
                  <div className="flex gap-0.5 mt-1 h-1.5">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <div key={idx} className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-cyan-400 shadow-[0_0_5px_#22d3ee]"}`} />
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Events List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex justify-between items-end mb-4 px-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {selectedDate ? (
                <>
                  <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                  Events for <span className="text-blue-400">{selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}</span>
                </>
              ) : "Upcoming Events"}
            </h2>
            {selectedDate && (
              <button onClick={() => setSelectedDate(null)} className="text-xs font-semibold text-slate-400 hover:text-blue-400 uppercase tracking-wider">
                View All
              </button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="text-center py-10 text-slate-500">Loading events...</div>
              ) : displayEvents.length > 0 ? (
                displayEvents.map((event, index) => {
                    const isGlobal = event.scope === 'global';
                    // UPDATED DELETE LOGIC: Admin can delete ANYTHING. CR can delete their faculty stuff.
                    const canDelete = 
                        userProfile.role === 'admin' || 
                        (userProfile.role === 'cr' && !isGlobal && event.targetFaculty === userProfile.faculty);

                    return (
                        <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setSelectedEvent(event)} // Open Details Modal
                        className={`cursor-pointer bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border transition-all group relative overflow-hidden ${isGlobal ? "border-blue-500/20 hover:border-blue-500/40" : "border-orange-500/20 hover:border-orange-500/40"}`}
                        >
                        <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] uppercase font-bold tracking-wider ${isGlobal ? "bg-blue-500/20 text-blue-300" : "bg-orange-500/20 text-orange-300"}`}>
                            {isGlobal ? (
                                <span className="flex items-center gap-1"><Globe size={10} /> Global</span>
                            ) : (
                                <span className="flex items-center gap-1"><Target size={10} /> {event.targetBatch} • {event.targetFaculty?.split(" ")[0]}</span>
                            )}
                        </div>

                        <div className="flex justify-between items-start relative z-10 pt-2">
                            <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {event.isPinned && <Pin size={14} className="text-yellow-400 fill-yellow-400" />}
                                <h3 className="font-semibold text-white text-lg">{event.title}</h3>
                            </div>
                            
                            <div className="flex items-center text-xs text-slate-400 mt-2 gap-3 flex-wrap">
                                <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-md">
                                <Clock size={12} className="text-blue-400" />
                                {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {event.location && (
                                <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-md">
                                    <MapPin size={12} className="text-cyan-400" />
                                    {event.location}
                                </span>
                                )}
                            </div>
                            
                            <div className="mt-3 text-xs text-slate-500 flex justify-between items-end pr-2">
                                <div>
                                    Posted by: <span className="text-slate-400">{event.authorName}</span>
                                    <span className="text-slate-500 text-[10px] ml-1 bg-slate-800 px-1 py-0.5 rounded border border-slate-700">
                                      {event.designation}
                                    </span>
                                </div>
                                {canDelete && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(event.id); }}
                                        className="p-2 hover:bg-red-500/10 rounded-full text-slate-600 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            </div>
                            
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${getTypeColor(event.type)}`}>
                            {event.type}
                            </span>
                        </div>
                        </motion.div>
                    );
                })
              ) : (
                <div className="text-center py-12 text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                  <CalendarIcon className="mx-auto h-8 w-8 text-slate-600 mb-2 opacity-50" />
                  <p>No events found.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* --- EVENT DETAILS MODAL --- */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900/90 backdrop-blur-xl w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Header Splash */}
              <div className={`h-32 bg-gradient-to-br w-full relative ${selectedEvent.scope === 'global' ? 'from-blue-600/30 to-indigo-600/30' : 'from-orange-600/30 to-purple-600/30'}`}>
                 <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20"></div>
                 <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 bg-black/20 p-2 rounded-full hover:bg-black/40 text-white transition">
                    <X size={20} />
                 </button>
                 <div className="absolute bottom-6 left-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/40 backdrop-blur-md border border-white/10 text-white mb-2 inline-block`}>
                       {selectedEvent.type}
                    </span>
                    <h2 className="text-2xl font-bold text-white drop-shadow-md">{selectedEvent.title}</h2>
                 </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                 {/* Metadata Grid */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                       <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><Clock size={12}/> Date & Time</p>
                       <p className="text-sm font-medium text-white">{selectedEvent.date.toDateString()}</p>
                       <p className="text-xs text-slate-400">{selectedEvent.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                       <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><MapPin size={12}/> Location</p>
                       <p className="text-sm font-medium text-white">{selectedEvent.location || "TBD"}</p>
                    </div>
                 </div>

                 {/* Description */}
                 <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                       {selectedEvent.description || "No additional details provided."}
                    </p>
                 </div>

                 {/* Target Info */}
                 {selectedEvent.scope === 'targeted' && (
                    <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                       <Target size={16} className="text-orange-400" />
                       <p className="text-xs text-orange-200">
                          Target Audience: <span className="font-bold">{selectedEvent.targetBatch}</span> - {selectedEvent.targetFaculty}
                       </p>
                    </div>
                 )}

                 {/* Author Info */}
                 <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center text-slate-400">
                          <User size={20} />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white">{selectedEvent.authorName}</p>
                          <p className="text-xs text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded inline-block mt-0.5">
                             {selectedEvent.designation}
                          </p>
                       </div>
                    </div>
                    {selectedEvent.authorEmail && (
                        <a href={`mailto:${selectedEvent.authorEmail}`} className="text-slate-500 hover:text-white transition">
                           <Mail size={18} />
                        </a>
                    )}
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
             <motion.div 
               initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
               className="bg-slate-900 border border-red-500/30 p-6 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.2)]"
             >
                <div className="flex flex-col items-center text-center gap-4">
                   <div className="h-12 w-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
                      <ShieldAlert size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-white">Delete Event?</h3>
                      <p className="text-sm text-slate-400 mt-1">This action cannot be undone.</p>
                   </div>
                   <div className="flex gap-3 w-full mt-2">
                      <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 transition">Cancel</button>
                      <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 rounded-xl font-bold hover:bg-red-500 transition shadow-lg shadow-red-900/20">Delete</button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Button for Admin/CR */}
      {(userProfile?.role === 'admin' || userProfile?.role === 'cr') && (
        <div className="fixed bottom-6 right-6 z-50">
           <Link href="/admin">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/40 flex items-center justify-center transition-all"
              >
                <Plus className="h-6 w-6" />
              </motion.button>
           </Link>
        </div>
      )}
    </div>
  );
}