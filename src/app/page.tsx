"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar as CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types & Dummy Data ---
type Event = {
  id: number;
  title: string;
  date: Date; // Year, Month (0-11), Day
  location: string;
  type: "Academic" | "Social" | "Mess" | "Sport";
};

// Dummy Data: Add your GIKI events here
const SAMPLE_EVENTS: Event[] = [
  {
    id: 1,
    title: "Sophee Orientation",
    date: new Date(2025, 11, 5), // Dec 5, 2025
    location: "Ghulam Ishaq Khan Auditorium",
    type: "Academic",
  },
  {
    id: 2,
    title: "CS 101 Midterm",
    date: new Date(2025, 11, 12), // Dec 12, 2025
    location: "Lecture Hall 3",
    type: "Academic",
  },
  {
    id: 3,
    title: "All Pakistan Coding Comp",
    date: new Date(2025, 11, 15),
    location: "FCI Lab 6",
    type: "Social",
  },
  {
    id: 4,
    title: "Special Biryani Dinner",
    date: new Date(2025, 11, 12),
    location: "Mess 1 & 2",
    type: "Mess",
  },
];

export default function Home() {
  // State for the currently viewed month
  const [currentDate, setCurrentDate] = useState(new Date());
  // State for the specific day user clicked
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

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

  // Navigation handlers
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Helper: Check if a specific day has events
  const getEventsForDay = (day: number) => {
    return SAMPLE_EVENTS.filter((e) => {
      return (
        e.date.getDate() === day &&
        e.date.getMonth() === month &&
        e.date.getFullYear() === year
      );
    });
  };

  // Helper: Get events to display (Selected day OR all upcoming if nothing selected)
  const displayEvents = selectedDate
    ? SAMPLE_EVENTS.filter(
        (e) =>
          e.date.getDate() === selectedDate.getDate() &&
          e.date.getMonth() === selectedDate.getMonth() &&
          e.date.getFullYear() === selectedDate.getFullYear()
      )
    : SAMPLE_EVENTS.filter((e) => e.date >= new Date()); // Show future events by default

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black font-sans pb-20">
      <main className="container mx-auto px-4 py-6 max-w-lg">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              GIKonnect
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your Campus, Synchronized.
            </p>
          </div>
          <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
            <CalendarIcon size={20} />
          </div>
        </header>

        {/* Calendar Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 p-5 mb-8">
          
          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition">
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {monthNames[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition">
              <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider py-2">
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
              const hasEvents = dayEvents.length > 0;
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
                    aspect-square relative flex flex-col items-center justify-center rounded-xl text-sm transition-colors
                    ${isSelected 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none" 
                      : isToday 
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    }
                  `}
                >
                  <span>{day}</span>
                  {/* Event Dot Indicators */}
                  <div className="flex gap-0.5 mt-1 h-1.5">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`w-1 h-1 rounded-full ${isSelected ? "bg-white/70" : "bg-blue-500"}`} 
                      />
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Events List */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {selectedDate ? (
                <>
                  Events for <span className="text-blue-600">{selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}</span>
                </>
              ) : "Upcoming Events"}
            </h2>
            {selectedDate && (
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-xs text-gray-500 hover:text-blue-600"
              >
                View All
              </button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {displayEvents.length > 0 ? (
                displayEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 gap-2">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {event.location}
                          </span>
                        </div>
                      </div>
                      <span className={`
                        text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider
                        ${event.type === 'Academic' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : ''}
                        ${event.type === 'Social' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : ''}
                        ${event.type === 'Mess' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : ''}
                      `}>
                        {event.type}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="text-center py-10 text-gray-400 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800"
                >
                  <p>No events scheduled for this day.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </main>
    </div>
  );
}