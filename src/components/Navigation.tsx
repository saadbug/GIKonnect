"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Calendar, Utensils, Sparkles, User, Menu } from "lucide-react";
import { useSwipeable } from "react-swipeable";

const NAV_ITEMS = [
  { name: "Home", path: "/", icon: <Home size={20} /> },
  { name: "Timetable", path: "/timetable", icon: <Calendar size={20} /> },
  { name: "Food", path: "/food", icon: <Utensils size={20} /> },
  { name: "Events", path: "/events", icon: <Sparkles size={20} /> },
  { name: "Profile", path: "/profile", icon: <User size={20} /> },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  // --- SWIPE LOGIC ---
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = NAV_ITEMS.findIndex((item) => item.path === pathname);
      if (currentIndex < NAV_ITEMS.length - 1) {
        router.push(NAV_ITEMS[currentIndex + 1].path);
      }
    },
    onSwipedRight: () => {
      const currentIndex = NAV_ITEMS.findIndex((item) => item.path === pathname);
      if (currentIndex > 0) {
        router.push(NAV_ITEMS[currentIndex - 1].path);
      }
    },
    trackMouse: false, // Don't swipe with mouse on desktop
    preventScrollOnSwipe: false, // Allow scrolling up/down
  });

  // Don't show nav on login/onboarding
  if (pathname === "/login" || pathname === "/onboarding" || pathname === "/signup") return null;

  return (
    <>
      {/* 1. INVISIBLE SWIPE AREA (Covers whole screen) */}
      <div {...handlers} className="fixed inset-0 pointer-events-none z-0" />

      {/* 2. FLOATING DOCK */}
      <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto bg-slate-900/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 sm:gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div className="relative flex flex-col items-center justify-center w-12 h-12 cursor-pointer group">
                  
                  {/* Active Glow Background */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute inset-0 bg-blue-500/20 rounded-full blur-md"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  {/* Icon */}
                  <span className={`relative z-10 transition-colors duration-300 ${isActive ? "text-blue-400" : "text-slate-400 group-hover:text-white"}`}>
                    {item.icon}
                  </span>

                  {/* Active Dot */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-dot"
                      className="absolute -bottom-1 w-1 h-1 bg-blue-400 rounded-full"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </motion.div>
      </div>
    </>
  );
}