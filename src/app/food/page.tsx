"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VENUES, MENU_ITEMS, MESS_MENU, MenuItem, Venue, Review, MessComment } from "../lib/foodData";
import { Star, X, ChefHat, Sparkles, Phone, Trash2, Send, ChevronRight, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { collection, addDoc, query, onSnapshot, serverTimestamp, deleteDoc, doc, orderBy } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import Image from "next/image";

export default function FoodPage() {
  const { user, userProfile } = useAuth() as any;
  
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showGenie, setShowGenie] = useState(false);
  
  // Data State
  const [allReviews, setAllReviews] = useState<Review[]>([]); // Fetch ALL reviews to calculate venue ratings
  const [messComments, setMessComments] = useState<MessComment[]>([]);
  
  // Filter State
  const [activeCategory, setActiveCategory] = useState("All");

  // Genie State
  const [genieStep, setGenieStep] = useState(0); 
  const [geniePrefs, setGeniePrefs] = useState({ budget: 500, category: "Any" });

  // Form State
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newMessComment, setNewMessComment] = useState("");

  // --- 1. FETCH ALL REVIEWS (GLOBAL) ---
  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    });
    return () => unsubscribe();
  }, []);

  // --- 2. FETCH MESS COMMENTS ---
  useEffect(() => {
    if (selectedVenue?.type !== "Mess") return;
    const q = query(collection(db, "mess_comments"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessComment)));
    });
    return () => unsubscribe();
  }, [selectedVenue]);

  // --- HELPER: CALCULATE RATINGS ---
  
  // 1. Get Rating for a Single Item
  const getItemRating = (itemId: string) => {
    const reviews = allReviews.filter(r => r.itemId === itemId);
    if (reviews.length === 0) return { avg: 0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { avg: parseFloat((sum / reviews.length).toFixed(1)), count: reviews.length };
  };

  // 2. Get Overall Rating for a Venue (Average of all its items' reviews)
  const getVenueRating = (venueId: string) => {
    const venueItems = MENU_ITEMS[venueId] || [];
    const itemIds = venueItems.map(i => i.id);
    // Find all reviews belonging to any item in this venue
    const venueReviews = allReviews.filter(r => itemIds.includes(r.itemId));

    if (venueReviews.length === 0) return { avg: "New", count: 0 };
    
    const sum = venueReviews.reduce((acc, r) => acc + r.rating, 0);
    return { 
        avg: (sum / venueReviews.length).toFixed(1), 
        count: venueReviews.length 
    };
  };

  // --- GENIE LOGIC ---
  const runGenie = () => {
    // Flatten all items from all restaurants
    const allItems = Object.values(MENU_ITEMS).flat();
    
    return allItems
      .filter(item => item.price <= geniePrefs.budget)
      .filter(item => geniePrefs.category === "Any" || item.category === geniePrefs.category)
      // Sort by LIVE rating from database
      .sort((a, b) => getItemRating(b.id).avg - getItemRating(a.id).avg)
      .slice(0, 3);
  };

  // --- ACTIONS ---
  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const submitReview = async () => {
    if (!selectedItem || !newReviewComment.trim()) return;
    
    // Determine Identity Label
    let identityLabel = "Student";
    if (userProfile?.role === 'admin') identityLabel = "Faculty";
    else if (userProfile?.batch) identityLabel = userProfile.batch; // e.g. "Batch 33"

    try {
      await addDoc(collection(db, "reviews"), {
        itemId: selectedItem.id,
        userEmail: user.email,
        userName: userProfile?.fullName || "Anonymous",
        userLabel: identityLabel, // Saves "Batch 33" or "Faculty"
        rating: newReviewRating,
        comment: newReviewComment,
        timestamp: serverTimestamp(),
      });
      setNewReviewComment("");
      setNewReviewRating(5);
    } catch (e) {
      console.error("Error adding review", e);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (confirm("Delete this review?")) {
      await deleteDoc(doc(db, "reviews", reviewId));
    }
  };

  const submitMessComment = async () => {
    if (!newMessComment.trim()) return;
    try {
      await addDoc(collection(db, "mess_comments"), {
        userEmail: user.email,
        userName: userProfile?.fullName || "Student",
        comment: newMessComment,
        timestamp: serverTimestamp(),
      });
      setNewMessComment("");
    } catch (e) {
      console.error("Error adding comment", e);
    }
  };

  const deleteMessComment = async (id: string) => {
    if (confirm("Delete this comment?")) {
      await deleteDoc(doc(db, "mess_comments", id));
    }
  };

  const getFilteredItems = () => {
    if (!selectedVenue) return [];
    let items = MENU_ITEMS[selectedVenue.id] || [];
    if (activeCategory !== "All") {
      items = items.filter(i => i.category === activeCategory);
    }
    return items;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-24 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]" />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        
        {/* Header */}
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              Campus Dining <ChefHat className="text-orange-400" />
            </h1>
            <p className="text-slate-400">Menus, reviews, and mess schedules.</p>
          </div>
          <button 
            onClick={() => setShowGenie(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 transition-transform px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-purple-500/20"
          >
            <Sparkles size={18} className="text-yellow-300" />
            <span className="hidden md:inline">Food Genie</span>
          </button>
        </header>

        {/* --- MAIN GRID --- */}
        {!selectedVenue && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VENUES.map((venue) => {
              const ratingInfo = getVenueRating(venue.id);
              return (
                <motion.div
                  key={venue.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedVenue(venue); setActiveCategory("All"); }}
                  className={`
                    relative h-48 rounded-3xl overflow-hidden cursor-pointer shadow-2xl border border-white/5 group
                    bg-gradient-to-br ${venue.image}
                  `}
                >
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                  <div className="absolute bottom-0 left-0 p-6 w-full bg-gradient-to-t from-black/90 to-transparent">
                    <div className="flex justify-between items-end">
                        <div>
                            <h3 className="text-2xl font-bold text-white">{venue.name}</h3>
                            <p className="text-sm text-white/80 line-clamp-1">{venue.description}</p>
                        </div>
                        {/* Live Rating Badge on Card */}
                        {venue.type !== "Mess" && (
                            <div className="flex flex-col items-end">
                                <span className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-yellow-400 font-bold text-sm">
                                    <Star size={12} fill="currentColor" /> {ratingInfo.avg}
                                </span>
                            </div>
                        )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* --- VENUE DETAIL VIEW --- */}
        <AnimatePresence>
          {selectedVenue && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed inset-x-0 bottom-0 top-16 z-40 bg-slate-900/95 backdrop-blur-xl rounded-t-[2.5rem] border-t border-white/10 overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.8)] flex flex-col"
            >
               {/* Fixed Header Section */}
               <div className="p-6 md:p-8 border-b border-white/5 bg-slate-900/50 relative">
                  
                  {/* FIXED CLOSE BUTTON (Top Right) */}
                  <button 
                    onClick={() => setSelectedVenue(null)}
                    className="absolute top-6 right-6 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition z-50 border border-white/10"
                  >
                    <X size={20} />
                  </button>

                  <div className="pr-12"> {/* Padding for close button */}
                      <h2 className="text-3xl md:text-4xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                        {selectedVenue.name}
                      </h2>
                      <p className="text-slate-400 text-sm mb-3">{selectedVenue.description}</p>
                      
                      {/* Controls Row */}
                      <div className="flex flex-wrap items-center gap-3">
                         {selectedVenue.type !== "Mess" && (
                            <span className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-lg border border-yellow-400/20 text-sm font-bold">
                               <Star size={14} fill="currentColor" /> {getVenueRating(selectedVenue.id).avg} Overall
                            </span>
                         )}
                         {selectedVenue.phoneNumber && (
                           <button 
                              onClick={() => handleCall(selectedVenue.phoneNumber!)}
                              className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg shadow-green-600/20 transition-all"
                           >
                              <Phone size={16} /> Call Order
                           </button>
                         )}
                      </div>
                  </div>
               </div>

               {/* Scrollable Content Area */}
               <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-32">
                  
                  {/* MESS LAYOUT */}
                  {selectedVenue.type === "Mess" ? (
                    <div className="space-y-8">
                       <div className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
                          <h3 className="text-blue-300 font-bold mb-4 flex items-center gap-2 text-xl">
                            <Clock size={20} /> Weekly Menu
                          </h3>
                          <div className="grid gap-3">
                             {Object.entries(MESS_MENU).map(([day, meals]) => {
                               const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
                               return (
                                 <div key={day} className={`p-4 rounded-xl border ${isToday ? 'bg-orange-500/10 border-orange-500/50' : 'bg-slate-800/50 border-slate-700'}`}>
                                   <div className="flex justify-between items-center mb-2">
                                     <h4 className={`font-bold ${isToday ? 'text-orange-400' : 'text-white'}`}>{day}</h4>
                                     {isToday && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">TODAY</span>}
                                   </div>
                                   <div className="grid grid-cols-3 text-sm text-slate-400 gap-2">
                                     <div><span className="block text-[10px] uppercase font-bold text-slate-500">Breakfast</span> {meals.Breakfast}</div>
                                     <div><span className="block text-[10px] uppercase font-bold text-slate-500">Lunch</span> {meals.Lunch}</div>
                                     <div><span className="block text-[10px] uppercase font-bold text-slate-500">Dinner</span> {meals.Dinner}</div>
                                   </div>
                                 </div>
                               );
                             })}
                          </div>
                       </div>

                       {/* Mess Comments */}
                       <div className="border-t border-slate-800 pt-6">
                          <h3 className="text-xl font-bold text-white mb-4">Discussion</h3>
                          <div className="flex gap-2 mb-6">
                             <input 
                                type="text" 
                                value={newMessComment}
                                onChange={(e) => setNewMessComment(e.target.value)}
                                placeholder="Add a comment..." 
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                             />
                             <button onClick={submitMessComment} className="bg-blue-600 p-3 rounded-xl hover:bg-blue-500"><Send size={20} /></button>
                          </div>
                          <div className="space-y-4">
                             {messComments.map(comment => (
                                <div key={comment.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                                   <div className="flex justify-between items-start mb-1">
                                      <span className="font-bold text-blue-400 text-sm">{comment.userName}</span>
                                      {comment.userEmail === user.email && (
                                         <button onClick={() => deleteMessComment(comment.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={14} /></button>
                                      )}
                                   </div>
                                   <p className="text-slate-300 text-sm">{comment.comment}</p>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  ) : (
                    /* RESTAURANT LAYOUT */
                    <div>
                      {/* Filter Pills */}
                      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                         {["All", "Desi", "Fast Food", "Beverages", "Snacks", "Special"].map(cat => (
                            <button
                              key={cat}
                              onClick={() => setActiveCategory(cat)}
                              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                            >
                               {cat}
                            </button>
                         ))}
                      </div>

                      {/* Items Grid */}
                      <div className="grid gap-4">
                        {getFilteredItems().map((item) => {
                          const { avg, count } = getItemRating(item.id);
                          return (
                            <div 
                              key={item.id} 
                              onClick={() => setSelectedItem(item)}
                              className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 hover:bg-slate-800 hover:border-orange-500/50 transition cursor-pointer group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-16 w-16 bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative border border-slate-700">
                                   {/* If using Image, make sure 'item.image' is a valid path in public folder */}
                                   {/* Fallback to text if image fails or for placeholder */}
                                   <span className="text-xs font-bold text-slate-600">IMG</span>
                                </div>
                                <div>
                                  <h4 className="font-bold text-lg group-hover:text-orange-400 transition">{item.name}</h4>
                                  <div className="flex items-center gap-2 text-xs mt-1">
                                    <span className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                                      <Star size={10} fill="currentColor" /> {avg}
                                    </span>
                                    <span className="text-slate-500">({count})</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="block text-xl font-bold text-white">Rs. {item.price}</span>
                                <span className="text-xs text-slate-500">{item.category}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- FOOD GENIE MODAL --- */}
        <AnimatePresence>
          {showGenie && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-purple-500/30 p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500" />
                <button onClick={() => { setShowGenie(false); setGenieStep(0); }} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X /></button>
                
                <div className="text-center mb-6">
                   <div className="inline-block p-4 bg-purple-500/20 rounded-full mb-4">
                      <Sparkles size={32} className="text-purple-400" />
                   </div>
                   <h2 className="text-2xl font-bold text-white">Food Genie</h2>
                   <p className="text-slate-400">Finding best rated food for your budget...</p>
                </div>

                {/* Genie Steps */}
                {genieStep === 0 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">Max Budget?</label>
                      <input 
                        type="range" min="100" max="1000" step="50" 
                        value={geniePrefs.budget} 
                        onChange={(e) => setGeniePrefs({...geniePrefs, budget: parseInt(e.target.value)})}
                        className="w-full accent-purple-500"
                      />
                      <div className="text-center font-bold text-2xl mt-2 text-purple-300">Rs. {geniePrefs.budget}</div>
                    </div>
                    <button onClick={() => setGenieStep(1)} className="w-full bg-purple-600 py-3 rounded-xl font-bold hover:bg-purple-500">Next</button>
                  </div>
                )}

                {genieStep === 1 && (
                  <div className="space-y-4">
                     <p className="text-sm text-slate-300 mb-2">Craving?</p>
                     {["Any", "Desi", "Fast Food", "Beverages"].map(cat => (
                       <button 
                         key={cat}
                         onClick={() => { setGeniePrefs({...geniePrefs, category: cat}); setGenieStep(2); }}
                         className="w-full p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left flex justify-between"
                       >
                         {cat} <ChevronRight size={16} />
                       </button>
                     ))}
                  </div>
                )}

                {genieStep === 2 && (
                   <div className="space-y-4">
                      <h3 className="text-lg font-bold text-purple-300">Top Rated Matches:</h3>
                      {runGenie().length > 0 ? (
                        runGenie().map(item => {
                          const rating = getItemRating(item.id).avg;
                          return (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                               <div>
                                 <div className="font-bold">{item.name}</div>
                                 <div className="text-xs text-slate-500">Rs. {item.price} • ⭐ {rating}</div>
                               </div>
                               <button onClick={() => { setShowGenie(false); setSelectedVenue(VENUES.find(v => MENU_ITEMS[v.id]?.includes(item)) || null); setSelectedItem(item); }} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500 hover:text-white">View</button>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-center text-slate-500">No high-rated items found in this budget.</p>
                      )}
                      <button onClick={() => setGenieStep(0)} className="w-full mt-4 py-2 text-slate-400 hover:text-white text-sm">Start Over</button>
                   </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- ITEM REVIEW MODAL --- */}
        <AnimatePresence>
          {selectedItem && (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
             >
                <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 flex flex-col max-h-[85vh]">
                   <div className="flex justify-between items-start p-6 border-b border-slate-800">
                      <div>
                        <h3 className="text-xl font-bold">{selectedItem.name}</h3>
                        <p className="text-slate-400 text-sm">Rs. {selectedItem.price}</p>
                      </div>
                      <button onClick={() => setSelectedItem(null)} className="text-slate-500 hover:text-white"><X /></button>
                   </div>
                   
                   <div className="overflow-y-auto p-6 flex-1 space-y-6">
                      <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-700">
                          <div className="text-4xl font-bold text-yellow-400 flex justify-center items-center gap-2">
                             {getItemRating(selectedItem.id).avg} <Star fill="currentColor" size={32} />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Based on {getItemRating(selectedItem.id).count} reviews</p>
                      </div>

                      <div className="space-y-4">
                          <h4 className="font-bold text-sm text-slate-300">Reviews</h4>
                          {allReviews.filter(r => r.itemId === selectedItem.id).length > 0 ? (
                            allReviews.filter(r => r.itemId === selectedItem.id).map(review => (
                              <div key={review.id} className="text-sm p-4 bg-slate-950 rounded-xl border border-slate-800">
                                 <div className="flex justify-between items-center mb-2">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-300">{review.userName}</span>
                                        {/* REVIEWER IDENTITY BADGE */}
                                        <span className="text-[10px] uppercase font-bold text-blue-400">
                                            {review.userLabel || "Student"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <span className="flex items-center text-yellow-500 text-xs">
                                          <Star size={10} fill="currentColor" /> {review.rating}
                                       </span>
                                       {review.userEmail === user.email && (
                                          <button onClick={() => deleteReview(review.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={12} /></button>
                                       )}
                                    </div>
                                 </div>
                                 <p className="text-slate-400">{review.comment}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-slate-600 italic">No reviews yet.</p>
                          )}
                      </div>
                   </div>

                   <div className="p-6 border-t border-slate-800 bg-slate-900 rounded-b-2xl">
                      <div className="flex gap-1 mb-3 justify-center">
                         {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => setNewReviewRating(star)}>
                               <Star size={24} className={star <= newReviewRating ? "text-yellow-400 fill-yellow-400" : "text-slate-700"} />
                            </button>
                         ))}
                      </div>
                      <div className="flex gap-2">
                        <input 
                           value={newReviewComment}
                           onChange={(e) => setNewReviewComment(e.target.value)}
                           placeholder="Review..." 
                           className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={submitReview} className="bg-blue-600 px-4 rounded-xl font-bold hover:bg-blue-500"><Send size={18} /></button>
                      </div>
                   </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}