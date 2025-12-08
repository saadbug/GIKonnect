"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar as CalendarIcon, Sparkles, Pin, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { useAuth } from "@/context/AuthContext";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

// --- Types ---
type Event = {
  id: string;
  title: string;
  date: Timestamp | Date;
  location?: string;
  type: "Quiz" | "Holiday" | "Notice" | "Academic" | "Social" | "Mess" | "Sport";
  scope: "global" | "faculty" | "batch";
  targetFaculty?: string;
  targetBatch?: string;
  isPinned?: boolean;
  authorName?: string;
  designation?: string;
};

export default function Home() {
  useAuthProtection(); // Protect the home page
  const { userProfile } = useAuth();
  
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
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Adjust Mon=0

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Fetch events from Firestore
  useEffect(() => {
    if (!userProfile) return;

    const eventsRef = collection(db, "events");
    
    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      const fetchedEvents: Event[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedEvents.push({
          id: doc.id,
          title: data.title || "",
          date: data.date || new Date(),
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

      // Filter events based on scope and targetFaculty/targetBatch
      const filteredEvents = fetchedEvents.filter((event) => {
        // Show if global scope
        if (event.scope === "global") return true;
        
        // Show if matches user's faculty and batch
        if (!userProfile) return false;
        
        if (
          event.scope === "faculty" &&
          event.targetFaculty === (userProfile as any).faculty &&
          event.targetBatch === (userProfile as any).batch
        ) {
          return true;
        }
        
        return false;
      });

      // Sort: pinned first, then by date (soonest first)
      filteredEvents.sort((a, b) => {
        // First sort by pinned status
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        // Then sort by date
        const dateA = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.date);
        const dateB = b.date instanceof Timestamp ? b.date.toDate() : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

      setEvents(filteredEvents);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  // Helper function to convert Firestore Timestamp to Date
  const getEventDate = (eventDate: Timestamp | Date): Date => {
    if (eventDate instanceof Timestamp) {
      return eventDate.toDate();
    }
    return new Date(eventDate);
  };

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const eventDate = getEventDate(e.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
  };

  const displayEvents = selectedDate
    ? events.filter((e) => {
        const eventDate = getEventDate(e.date);
        return (
          eventDate.getDate() === selectedDate.getDate() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : events.filter((e) => {
        const eventDate = getEventDate(e.date);
        return eventDate >= new Date();
      });

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans text-white pb-24">
      
      {/* --- ACTIVE LAVA LAMP BACKGROUND --- */}
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
            <p className="text-sm text-slate-400">
              Your Campus, Synchronized.
            </p>
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

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty Slots */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Actual Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month;
              const isToday = 
                new Date().getDate() === day && 
                new Date().getMonth() === month && 
                new Date().getFullYear() === year;

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
                  {/* Neon Dot Indicators */}
                  <div className="flex gap-0.5 mt-1 h-1.5">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-cyan-400 shadow-[0_0_5px_#22d3ee]"}`} 
                      />
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Events List */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
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
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-xs font-semibold text-slate-400 hover:text-blue-400 transition-colors uppercase tracking-wider"
              >
                View All
              </button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {loading ? (
                // Skeleton Loader
                Array.from({ length: 3 }).map((_, index) => (
                  <motion.div
                    key={`skeleton-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="h-5 bg-slate-800/50 rounded-md w-3/4 mb-3 animate-pulse"></div>
                        <div className="flex items-center gap-3">
                          <div className="h-6 bg-slate-800/50 rounded-md w-20 animate-pulse"></div>
                          <div className="h-6 bg-slate-800/50 rounded-md w-24 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-6 w-16 bg-slate-800/50 rounded-full animate-pulse"></div>
                    </div>
                  </motion.div>
                ))
              ) : displayEvents.length > 0 ? (
                displayEvents.map((event, index) => {
                  const eventDate = getEventDate(event.date);
                  const getTypeColor = (type: string) => {
                    switch (type) {
                      case "Quiz":
                        return "bg-red-500/10 text-red-300 border-red-500/20";
                      case "Holiday":
                        return "bg-green-500/10 text-green-300 border-green-500/20";
                      case "Notice":
                        return "bg-blue-500/10 text-blue-300 border-blue-500/20";
                      case "Academic":
                        return "bg-purple-500/10 text-purple-300 border-purple-500/20";
                      case "Social":
                        return "bg-orange-500/10 text-orange-300 border-orange-500/20";
                      case "Mess":
                        return "bg-green-500/10 text-green-300 border-green-500/20";
                      case "Sport":
                        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
                      default:
                        return "bg-slate-500/10 text-slate-300 border-slate-500/20";
                    }
                  };

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden"
                    >
                      {/* Subtle gradient hover effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/0 to-blue-600/0 group-hover:via-blue-600/5 transition-all duration-500" />

                      <div className="flex justify-between items-start relative z-10">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {event.isPinned && (
                              <Pin size={14} className="text-yellow-400 fill-yellow-400" />
                            )}
                            <h3 className="font-semibold text-white text-lg">{event.title}</h3>
                          </div>
                          <div className="flex items-center text-xs text-slate-400 mt-2 gap-3 flex-wrap">
                            <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-md">
                              <Clock size={12} className="text-blue-400" />
                              {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-md">
                                <MapPin size={12} className="text-cyan-400" />
                                {event.location}
                              </span>
                            )}
                          </div>
                          {/* Author Tag */}
                          {event.authorName && (
                            <div className="mt-3 text-xs text-slate-500">
                              Posted by: <span className="text-slate-400">{event.authorName}</span>
                              {event.designation && (
                                <span className="text-slate-500"> ({event.designation})</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Type Badge */}
                        <span className={`
                          text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border
                          ${getTypeColor(event.type)}
                        `}>
                          {event.type}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800"
                >
                  <CalendarIcon className="mx-auto h-8 w-8 text-slate-600 mb-2 opacity-50" />
                  <p>No events scheduled for this day.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </main>
    </div>
  );
}