"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      // 1. Start slightly lower, transparent, and blurry
      initial={{ 
        opacity: 0, 
        y: 20, 
        scale: 0.98,
        filter: "blur(10px)" 
      }}
      // 2. Animate to full visibility, original position, sharp focus
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        filter: "blur(0px)" 
      }}
      // 3. The "Luxury" Curve (Fast start, very slow smooth finish)
      transition={{ 
        duration: 0.7, 
        ease: [0.22, 1, 0.36, 1] 
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}