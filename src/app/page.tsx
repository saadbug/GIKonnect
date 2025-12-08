"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar as CalendarIcon, Sparkles, Pin, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { useAuth } from "@/context/AuthContext";
import { collection, onSnapshot, Timestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import Link from "next/link";

// --- Types ---
type Event = {
  id: string;
  title: string;
  date: Date;
  location?: string;
  type: "Quiz" | "Holiday" | "Notice" | "Academic" | "Social" | "Mess" | "Sport";
  scope: "global" | "targeted";
  targetFaculty?: string;
  targetBatch?: string;
  isPinned?: boolean;
  authorName?: string;
  designation?: string;
};

export default function Home() {
  useAuthProtection();
  
  // Use 'as any' to avoid TS errors
  const { userProfile } = useAuth() as any;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Calendar Logic ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; 
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // --- Data Fetching ---
  useEffect(() => {
    if (!userProfile) return;

    // 1. Fetch ALL events ordered by date
    const q = query(collection(db, "events"), orderBy("dateTime", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents: Event[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Handle Date Conversion
        let eventDate = new Date();
        if (data.dateTime) {
             eventDate = data.dateTime instanceof Timestamp ? data.dateTime.toDate() : new Date(data.dateTime);
        }

        fetchedEvents.push({
          id: doc.id,
          title: data.title || "Untitled Event",
          date: eventDate,
          location: data.location || "",
          type: data.type || "Notice",
          scope: data.scope || "global",
          targetFaculty: data.targetFaculty,
          targetBatch: data.targetBatch,
          isPinned: data.isPinned || false,
          authorName: data.authorName || "",
          designation: data.designation || "",
        });
      });

      console.log("📥 All Events:", fetchedEvents);

      // 2. The "Fuzzy" Filter Logic
      const filteredEvents = fetchedEvents.filter((event) => {
        // A. Admin/CR Super-View (See everything for debugging)
        if (userProfile.role === 'admin' || userProfile.role === 'cr') return true;

        // B. Global Events (Everyone sees these)
        if (event.scope === 'global') return true;

        // C. Targeted Events (The Smart Match)
        if (event.scope === 'targeted') {
          // Normalize strings (lowercase, trim) to prevent mismatches
          const userFac = (userProfile.faculty || "").toLowerCase();
          const eventFac = (event.targetFaculty || "").toLowerCase();
          const userBatch = (userProfile.batch || "").toString().toLowerCase().replace("batch", "").trim();
          const eventBatch = (event.targetBatch || "").toString().toLowerCase().replace("batch", "").trim();

          // Check if Faculty Matches
          const facultyMatch = userFac === eventFac;

          // Check if Batch Matches (e.g., "33" == "33")
          const batchMatch = userBatch === eventBatch;

          return facultyMatch && batchMatch;
        }
        
        return false;
      });

      console.log("✅ Visible Events:", filteredEvents);

      // Sort: Pinned first
      filteredEvents.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return a.date.getTime() - b.date.getTime(); // Oldest first (for calendar order) or newest first
      });

      setEvents(filteredEvents);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  // Helper functions for UI
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
          <div className="h-12 w-12 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-blue-400 shadow-lg">
            <CalendarIcon size={22} />
          </div>
        </motion.header>

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
                displayEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start relative z-10">
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
                          {/* Author Tag */}
                          <div className="mt-3 text-xs text-slate-500">
                             Posted by: <span className="text-slate-400">{event.authorName || "Unknown"}</span>
                             {event.designation && <span className="text-slate-500"> ({event.designation})</span>}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${getTypeColor(event.type)}`}>
                          {event.type}
                        </span>
                      </div>
                    </motion.div>
                ))
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