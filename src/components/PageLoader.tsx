"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function PageLoader({ text = "Syncing Campus Data..." }: { text?: string }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} 
        />
        <motion.div 
          className="absolute bottom-[10%] -right-[10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px]" 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} 
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} 
        />
      </div>

      {/* Syncing Animation */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        
        {/* Orbiting Logo */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Inner Core */}
          <motion.div 
            className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="text-white w-6 h-6" />
          </motion.div>

          {/* Outer Ring 1 */}
          <motion.div 
            className="absolute inset-0 border-2 border-blue-500/30 rounded-full border-t-blue-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Outer Ring 2 (Reverse) */}
          <motion.div 
            className="absolute inset-[-8px] border-2 border-purple-500/20 rounded-full border-b-purple-400"
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <motion.h2 
            className="text-xl font-bold text-white tracking-wide"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            GIKonnect
          </motion.h2>
          <p className="text-sm text-slate-400 font-mono tracking-widest uppercase">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}