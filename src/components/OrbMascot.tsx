"use client";

import { motion } from "framer-motion";

export default function OrbMascot({ size = "lg" }: { size?: "sm" | "md" | "lg" }) {
  // Size mapping
  const dim = size === "lg" ? "w-64 h-64" : size === "md" ? "w-32 h-32" : "w-16 h-16";
  const core = size === "lg" ? "w-32 h-32" : size === "md" ? "w-16 h-16" : "w-8 h-8";

  return (
    <div className={`relative ${dim} flex items-center justify-center`}>
      
      {/* 1. The "Frosty Aura" (Back Glow) */}
      <motion.div 
        className="absolute inset-0 bg-blue-500/30 rounded-full blur-[60px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 2. Outer Orbital Ring (Glassy) */}
      <motion.div 
        className="absolute inset-4 border border-white/10 rounded-full border-t-blue-400/50 border-b-purple-400/50 backdrop-blur-sm"
        animate={{ rotate: 360, scale: [1, 1.05, 1] }}
        transition={{ 
          rotate: { duration: 15, repeat: Infinity, ease: "linear" },
          scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }}
      />

      {/* 3. Inner Orbital Ring (Fast & Sharp) */}
      <motion.div 
        className="absolute inset-12 border-2 border-transparent border-l-cyan-300/40 border-r-blue-500/40 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* 4. The "Spherical Core" (Glassmorphism Sphere) */}
      <div className={`relative ${core} rounded-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 backdrop-blur-xl border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center overflow-hidden`}>
        
        {/* Core Shine/Reflection */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent opacity-50" />
        
        {/* Inner Pulsing Nucleus */}
        <motion.div 
          className="w-1/3 h-1/3 bg-white rounded-full blur-md"
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      {/* 5. Floating Particles (Satellites) */}
      <motion.div 
        className="absolute top-0 left-1/2 w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_#60A5FA]"
        animate={{ rotate: 360 }}
        style={{ originY: "8rem", originX: "-2rem" }} // Orbit radius hack
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}