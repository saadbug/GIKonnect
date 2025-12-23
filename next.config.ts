import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true, // Keep your existing setting
  
  // 1. Tells Next.js to produce a static 'out' folder instead of a server
  output: 'export',

 
  images: {
    unoptimized: true, 
  },
};

export default nextConfig;