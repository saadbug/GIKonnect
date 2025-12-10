"use client";

import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuthProtection } from "@/hooks/useAuthProtection";

// --- Mock Data ---
const MOCK_EVENTS = [
  {
    id: 1,
    society: "GIKI ACM Chapter",
    avatar: "bg-blue-600",
    image: "bg-gradient-to-br from-blue-900 to-slate-900", // Placeholder for actual event image
    caption: "🚀 Softcom '25 is officially here! Join us for the biggest coding hackathon of the year. Registrations open now! #Softcom #GIKI #ACM",
    likes: 234,
    comments: 45,
    time: "2 hours ago",
    isLiked: true,
  },
  {
    id: 2,
    society: "GMS (Media Society)",
    avatar: "bg-red-600",
    image: "bg-gradient-to-br from-red-900 to-orange-900",
    caption: "📸 Capturing moments that last forever. Highlights from yesterday's concert night. Were you there? Tag your friends! 🎵✨",
    likes: 892,
    comments: 120,
    time: "5 hours ago",
    isLiked: false,
  },
  {
    id: 3,
    society: "SOPHEP",
    avatar: "bg-green-600",
    image: "bg-gradient-to-br from-green-900 to-emerald-900",
    caption: "🌿 Plantation Drive 2025. Let's make our campus greener together. Meet us at the clock tower at 4 PM.",
    likes: 156,
    comments: 12,
    time: "1 day ago",
    isLiked: false,
  },
];

export default function EventsPage() {
    useAuthProtection();
  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24 relative">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold font-serif tracking-wide">GIKonnect Events</h1>
        <div className="flex gap-4">
           <Send size={24} className="rotate-[-20deg]" />
        </div>
      </div>

      {/* Feed Container */}
      <div className="max-w-md mx-auto pt-4">
        {MOCK_EVENTS.map((post) => (
          <EventPost key={post.id} post={post} />
        ))}
      </div>

    </div>
  );
}

// --- Single Post Component ---
function EventPost({ post }: { post: any }) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);

  // Handle Double Click Like
  const handleDoubleClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 300) {
      if (!isLiked) {
        setIsLiked(true);
        setLikes((prev: number) => prev + 1);
      }
      setShowHeartOverlay(true);
      setTimeout(() => setShowHeartOverlay(false), 1000);
    }
    setLastClickTime(now);
  };

  const toggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikes((prev: number) => prev - 1);
    } else {
      setIsLiked(true);
      setLikes((prev: number) => prev + 1);
    }
  };

  return (
    <div className="mb-6 bg-black border-b border-white/10 pb-4">
      
      {/* 1. Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-3">
          {/* Avatar Ring */}
          <div className="p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full">
            <div className={`h-8 w-8 rounded-full border-2 border-black ${post.avatar}`}></div>
          </div>
          <div>
            <p className="text-sm font-bold text-white">{post.society}</p>
            <p className="text-[10px] text-gray-400">GIKI Campus</p>
          </div>
        </div>
        <MoreHorizontal size={20} className="text-gray-400" />
      </div>

      {/* 2. Image Container (Double Click to Like) */}
      <div 
        className={`relative aspect-[4/5] w-full ${post.image} flex items-center justify-center cursor-pointer overflow-hidden`}
        onClick={handleDoubleClick}
      >
        <span className="text-white/20 font-bold text-4xl uppercase tracking-widest">Event Photo</span>
        
        {/* Heart Overlay Animation */}
        <AnimatePresence>
          {showHeartOverlay && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart size={100} className="text-white fill-white drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Actions Bar */}
      <div className="px-3 pt-3 flex justify-between items-center">
        <div className="flex gap-4">
          <button onClick={toggleLike} className="transition-transform active:scale-90">
            <Heart 
              size={26} 
              className={isLiked ? "text-red-500 fill-red-500" : "text-white hover:text-gray-300"} 
            />
          </button>
          <button className="transition-transform active:scale-90">
            <MessageCircle size={26} className="text-white hover:text-gray-300" />
          </button>
          <button className="transition-transform active:scale-90">
            <Send size={26} className="text-white hover:text-gray-300 rotate-[-20deg] mt-[-2px]" />
          </button>
        </div>
        <button>
          <Bookmark size={26} className="text-white hover:text-gray-300" />
        </button>
      </div>

      {/* 4. Likes & Caption */}
      <div className="px-3 pt-2 space-y-1">
        <p className="text-sm font-bold text-white">{likes.toLocaleString()} likes</p>
        
        <div className="text-sm text-white leading-tight">
          <span className="font-bold mr-2">{post.society}</span>
          <span className="text-gray-100">{post.caption}</span>
        </div>

        {/* Comments Link */}
        <p className="text-sm text-gray-500 pt-1 cursor-pointer">
          View all {post.comments} comments
        </p>
        
        {/* Timestamp */}
        <p className="text-[10px] text-gray-500 uppercase tracking-wide">
          {post.time}
        </p>
      </div>

    </div>
  );
}