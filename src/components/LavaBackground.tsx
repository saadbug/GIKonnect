"use client";

import { useEffect, useState } from "react";

export default function LavaBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-slate-950 pointer-events-none">
      
      {/* FIX: Removed 'mix-blend-screen' to ensure visibility. 
         Increased opacity to 0.6. 
         Added explicit 'blur-3xl' to soften the edges if the gradient looks too sharp.
      */}

      {/* Blob 1: Blue (Top Left) */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[80vw] h-[80vw] rounded-full opacity-60 blur-3xl animate-blob-1"
        style={{
          background: "radial-gradient(circle, rgba(37,99,235,1) 0%, rgba(37,99,235,0) 60%)",
        }}
      />

      {/* Blob 2: Purple (Top Right) */}
      <div 
        className="absolute top-[10%] -right-[10%] w-[70vw] h-[70vw] rounded-full opacity-50 blur-3xl animate-blob-2"
        style={{
          background: "radial-gradient(circle, rgba(147,51,234,1) 0%, rgba(147,51,234,0) 60%)",
        }}
      />

      {/* Blob 3: Cyan (Bottom Left) */}
      <div 
        className="absolute -bottom-[20%] -left-[10%] w-[80vw] h-[80vw] rounded-full opacity-50 blur-3xl animate-blob-3"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,1) 0%, rgba(6,182,212,0) 60%)",
        }}
      />
      
      {/* Noise Overlay (Adds texture to hide banding) */}
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>
    </div>
  );
}