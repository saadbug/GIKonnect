"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // Import for Portal
import { 
  ChevronLeft, ChevronRight, MapPin, Clock, Calendar as CalendarIcon, Sparkles, 
  Pin, Plus, Trash2, Filter, X, Globe, Target, User, Mail, ShieldAlert, 
  Loader2, Lock, ChevronDown 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { useAuth } from "@/context/AuthContext";
import { collection, onSnapshot, Timestamp, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import Link from "next/link";
import Image from "next/image";

// --- Types ---
type Event = {
  id: string;
  title: string;
  description?: string;
  date: Date;
  location?: string;
  type: "Quiz" | "Holiday" | "Notice" | "Academic" | "Social" | "Mess" | "Sport" | "Mids" | "Finals" | "Assignment" | "Personal";
  scope: "global" | "targeted" | "personal";
  targetFaculty?: string;
  targetBatch?: string;
  isPinned?: boolean;
  authorName?: string;
  authorId?: string;
  authorEmail?: string;
  designation?: string; 
};

const FACULTIES = [
  "Computer Science", "Electrical Engineering", "Mechanical Engineering", 
  "Artificial Intelligence", "Software Engineering", "Chemical Engineering",
  "Civil Engineering", "Data Science", "Cyber Security"
];
const BATCHES = ["Batch 32", "Batch 33", "Batch 34", "Batch 35"];

// --- PORTAL COMPONENT (The Fix) ---
const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
};

export default function Home() {
  useAuthProtection();
  
  const { userProfile, user, loading: authLoading } = useAuth() as any;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // UI States
  const [showAdminFilter, setShowAdminFilter] = useState(false);
  const [adminViewTarget, setAdminViewTarget] = useState<{ faculty: string, batch: string } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false); 

  // Modal States
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // --- Scroll Lock Logic ---
  useEffect(() => {
    if (selectedEvent || deleteTarget) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedEvent, deleteTarget]);

  // --- Calendar Logic ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; 
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // --- Data Fetching ---
  useEffect(() => {
    if (!userProfile || !user) return;

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
          title: data.title || "Untitled",
          description: data.description || "",
          date: eventDate,
          location: data.location || "",
          type: data.type || "Notice",
          scope: data.scope || "global",
          targetFaculty: data.targetFaculty,
          targetBatch: data.targetBatch,
          isPinned: data.isPinned || false,
          authorName: data.authorName || "Unknown",
          authorId: data.authorId,
          authorEmail: data.authorEmail,
          designation: data.designation || "Student",
        });
      });

      const filteredEvents = fetchedEvents.filter((event) => {
        if (event.scope === 'personal') return event.authorId === user.uid;
        if (event.scope === 'global') return true;
        if (event.scope === 'targeted') {
          if (userProfile.role === 'admin' && adminViewTarget) {
             const filterFac = adminViewTarget.faculty.toLowerCase();
             const filterBatch = adminViewTarget.batch.toLowerCase().replace("batch", "").trim();
             const eventFac = (event.targetFaculty || "").toLowerCase();
             const eventBatch = (event.targetBatch || "").toString().toLowerCase().replace("batch", "").trim();
             return filterFac === eventFac && filterBatch === eventBatch;
          }
          const userFac = (userProfile.faculty || "").split(" - ")[0].trim().toLowerCase();
          const userBatch = (userProfile.batch || "").toString().toLowerCase().replace("batch", "").trim();
          const eventFac = (event.targetFaculty || "").toLowerCase();
          const eventBatch = (event.targetBatch || "").toString().toLowerCase().replace("batch", "").trim();
          return userFac === eventFac && userBatch === eventBatch;
        }
        return false;
      });

      filteredEvents.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return a.date.getTime() - b.date.getTime();
      });

      setEvents(filteredEvents);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile, user, adminViewTarget]);

  // --- Helpers ---
  const getEventsForDay = (day: number) => {
    return events.filter((e) => 
      e.date.getDate() === day &&
      e.date.getMonth() === month &&
      e.date.getFullYear() === year
    );
  };

  const displayEvents = selectedDate
    ? events.filter((e) => 
        e.date.getDate() === selectedDate.getDate() &&
        e.date.getMonth() === selectedDate.getMonth() &&
        e.date.getFullYear() === selectedDate.getFullYear()
      )
    : events.filter((e) => e.date >= new Date());

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Quiz": return "bg-red-500/10 text-red-300 border-red-500/20"; 
      case "Mids": 
      case "Finals": return "bg-red-900/40 text-red-200 border-red-700/50"; 
      case "Assignment": return "bg-orange-500/10 text-orange-300 border-orange-500/20"; 
      case "Holiday": return "bg-green-500/10 text-green-300 border-green-500/20";
      case "Notice": return "bg-blue-500/10 text-blue-300 border-blue-500/20";
      case "Personal": return "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";
      default: return "bg-slate-500/10 text-slate-300 border-slate-500/20";
    }
  };

  const getDotColor = (type: string) => {
    switch (type) {
        case "Quiz": return "bg-red-500";
        case "Mids": 
        case "Finals": return "bg-red-800";
        case "Assignment": return "bg-orange-500";
        case "Personal": return "bg-indigo-500";
        default: return "bg-cyan-400";
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "events", deleteTarget));
      setDeleteTarget(null);
      setSelectedEvent(null);
    } catch (err) { alert("Failed to delete."); }
  };

  if (authLoading || !userProfile) return <LiquidLoader />;

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans text-white pb-24">
      
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none fixed">
        <motion.div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity }} />
        <motion.div className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity }} />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-lg relative z-10">
        
        {/* --- HEADER --- */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-start mb-8"
        >
          {/* LEFT: Logo + Title */}
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image 
                  src="/logo.png" 
                  alt="GIKonnect Logo" 
                  fill 
                  className="object-contain drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" 
                />
              </div>
              GIKonnect <Sparkles className="h-5 w-5 text-yellow-400" />
            </h1>
            <p className="text-sm text-slate-400 ml-1">Your Campus, Synchronized.</p>
          </div>
          
          {/* RIGHT: Actions */}
          <div className="flex gap-2 relative">
             {userProfile?.role === 'admin' && (
                <button 
                   onClick={() => setShowAdminFilter(!showAdminFilter)}
                   className={`p-3 rounded-2xl border transition-all ${showAdminFilter || adminViewTarget ? "bg-purple-600 text-white border-purple-500 shadow-lg" : "bg-slate-900/50 text-slate-400 border-white/10 hover:text-white"}`}
                >
                   <Filter size={20} />
                </button>
             )}

             <div className="relative">
                <button 
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span className="text-sm font-bold hidden sm:inline">Add</span>
                </button>

                <AnimatePresence>
                    {showAddMenu && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-14 w-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                            <Link href="/personal-event" onClick={() => setShowAddMenu(false)}>
                                <div className="px-4 py-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800 text-sm flex items-center gap-2">
                                    <Lock size={14} className="text-indigo-400"/> Personal Event
                                </div>
                            </Link>
                            {(userProfile.role === 'admin' || userProfile.role === 'cr') && (
                                <Link href="/admin" onClick={() => setShowAddMenu(false)}>
                                    <div className="px-4 py-3 hover:bg-slate-800 cursor-pointer text-sm flex items-center gap-2 text-blue-300">
                                        <Globe size={14} /> Publish Event
                                    </div>
                                </Link>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
             </div>
          </div>
        </motion.header>

        {/* --- ADMIN FILTER --- */}
        <AnimatePresence>
          {showAdminFilter && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 p-4 rounded-2xl">
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">Admin Spyglass</h3>
                    {adminViewTarget && <button onClick={() => setAdminViewTarget(null)} className="text-xs text-red-400"><X size={12}/> Clear</button>}
                 </div>
                 <div className="grid grid-cols-1 gap-3">
                    <select 
                      className="bg-slate-950 border border-slate-700 rounded-xl p-2 text-sm text-white"
                      onChange={(e) => setAdminViewTarget(prev => ({ batch: prev?.batch || BATCHES[0], faculty: e.target.value }))}
                      value={adminViewTarget?.faculty || ""}
                    >
                        <option value="">Select Faculty</option>
                        {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select 
                      className="bg-slate-950 border border-slate-700 rounded-xl p-2 text-sm text-white"
                      onChange={(e) => setAdminViewTarget(prev => ({ faculty: prev?.faculty || FACULTIES[0], batch: e.target.value }))}
                      value={adminViewTarget?.batch || ""}
                    >
                        <option value="">Select Batch</option>
                        {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- CALENDAR --- */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-6 mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition text-slate-300"><ChevronLeft size={20} /></button>
            <h2 className="text-lg font-bold text-white tracking-wide">{monthNames[month]} <span className="text-blue-400">{year}</span></h2>
            <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition text-slate-300"><ChevronRight size={20} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <div key={d}>{d}</div>)}
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
                    ${isSelected ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg" : isToday ? "bg-blue-500/20 text-blue-400 font-bold border border-blue-500/50" : "text-slate-300 hover:bg-white/5"}
                  `}
                >
                  <span>{day}</span>
                  <div className="flex gap-0.5 mt-1 h-1.5">
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <div key={idx} className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : getDotColor(e.type)}`} />
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* --- EVENTS LIST --- */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
              {dataLoading ? (
                <div className="text-center py-10 text-slate-500">Loading events...</div>
              ) : displayEvents.length > 0 ? (
                displayEvents.map((event, index) => {
                    const isGlobal = event.scope === 'global';
                    const showDateHeader = !selectedDate;

                    return (
                        <div key={event.id}>
                            {/* Date Header for View All Mode */}
                            {showDateHeader && (index === 0 || displayEvents[index - 1].date.toDateString() !== event.date.toDateString()) && (
                                <div className="mt-6 mb-2 pl-2 text-sm font-bold text-slate-500 flex items-center gap-2">
                                    <CalendarIcon size={14}/> 
                                    {event.date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                                </div>
                            )}

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setSelectedEvent(event)}
                                className={`cursor-pointer bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border transition-all group relative overflow-hidden ${isGlobal ? "border-blue-500/20 hover:border-blue-500/40" : "border-orange-500/20 hover:border-orange-500/40"}`}
                            >
                                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] uppercase font-bold tracking-wider 
                                    ${event.scope === 'personal' 
                                        ? "bg-indigo-500/20 text-indigo-300" 
                                        : isGlobal 
                                            ? "bg-blue-500/20 text-blue-300" 
                                            : "bg-orange-500/20 text-orange-300"
                                    }`}
                                >
                                    {event.scope === 'personal' ? (
                                        <span className="flex items-center gap-1"><Lock size={10}/> Personal</span>
                                    ) : isGlobal ? (
                                        <span className="flex items-center gap-1"><Globe size={10} /> Global</span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <Target size={10} /> {event.targetBatch} • {event.targetFaculty?.split("  ")[0]}
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-between items-start relative z-10 pt-2">
                                    <div className="flex-1 pr-8">
                                        <div className="flex items-center gap-2 mb-1">
                                            {event.isPinned && <Pin size={14} className="text-yellow-400 fill-yellow-400" />}
                                            <h3 className="font-semibold text-white text-lg leading-tight">{event.title}</h3>
                                        </div>
                                        
                                        <div className="flex items-center text-xs text-slate-400 mt-2 gap-3 flex-wrap">
                                            <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-md border border-white/5">
                                                <Clock size={12} className="text-blue-400" />
                                                {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </span>
                                            {event.location && (
                                                <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-md border border-white/5">
                                                    <MapPin size={12} className="text-cyan-400" />
                                                    {event.location}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="mt-3 text-xs text-slate-500">
                                            Posted by: <span className="text-slate-300 font-medium">{event.authorName}</span>
                                            {event.designation && (
                                                <span className="ml-2 bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-slate-700">
                                                    {event.designation}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${getTypeColor(event.type)}`}>
                                        {event.type}
                                    </span>
                                </div>
                            </motion.div>
                        </div>
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

      {/* --- EVENT DETAILS MODAL (PORTAL FIX) --- */}
      <ModalPortal>
        <AnimatePresence>
          {selectedEvent && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedEvent(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-900/95 w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative"
                onClick={e => e.stopPropagation()}
              >
                <div className={`h-32 bg-gradient-to-br w-full relative ${selectedEvent.scope === 'global' ? 'from-blue-600/30 to-indigo-600/30' : 'from-orange-600/30 to-purple-600/30'}`}>
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

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                          <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><Clock size={12}/> Date & Time</p>
                          <p className="text-sm font-medium text-white">{selectedEvent.date.toDateString()}</p>
                          <p className="text-xs text-slate-400">{selectedEvent.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                          <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><MapPin size={12}/> Location</p>
                          <p className="text-sm font-medium text-white">{selectedEvent.location || "TBD"}</p>
                      </div>
                   </div>

                   <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                         {selectedEvent.description || "No additional details provided."}
                      </p>
                   </div>

                   {/* Footer */}
                   <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-slate-700 rounded-full flex items-center justify-center text-slate-400">
                             <User size={16} />
                          </div>
                          <div>
                             <p className="text-xs text-slate-400">Posted by</p>
                             <p className="text-sm font-bold text-white flex items-center gap-2">
                                {selectedEvent.authorName}
                                {selectedEvent.designation && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">{selectedEvent.designation}</span>}
                             </p>
                          </div>
                      </div>
                      
                      {(userProfile.role === 'admin' || selectedEvent.authorId === user.uid) && (
                          <button 
                              onClick={() => setDeleteTarget(selectedEvent.id)}
                              className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition"
                          >
                              <Trash2 size={18} />
                          </button>
                      )}
                   </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalPortal>

      {/* --- DELETE CONFIRMATION (PORTAL FIX) --- */}
      <ModalPortal>
        <AnimatePresence>
          {deleteTarget && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
               <motion.div 
                 initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                 className="bg-slate-900 border border-red-500/30 p-6 rounded-2xl max-w-xs w-full shadow-[0_0_50px_rgba(239,68,68,0.2)]"
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
      </ModalPortal>

    </div>
  );
}

function LiquidLoader() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-900/10 blur-3xl pointer-events-none" />
      <div className="relative">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="w-24 h-24 rounded-full border-b-2 border-r-2 border-blue-500/50 absolute top-0 left-0 blur-sm" />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-24 h-24 rounded-full border-t-2 border-l-2 border-cyan-400 absolute top-0 left-0" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="w-24 h-24 flex items-center justify-center">
           <Sparkles className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" size={32} />
        </motion.div>
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="absolute mt-32 text-slate-500 text-xs font-bold tracking-[0.2em] uppercase">Syncing</motion.p>
    </div>
  );
}