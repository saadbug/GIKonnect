"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VENUES, MENU_ITEMS, MESS_MENU, MenuItem, Venue, Review, MessComment } from "../lib/foodData";
import { Star, X, Sparkles, Phone, Trash2, Send, ChevronRight, Heart, Users, Utensils, MapPin, Bookmark } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { collection, addDoc, query, onSnapshot, serverTimestamp, deleteDoc, doc, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

// --- HELPER: RELATIVE TIME ---
const formatRelativeTime = (timestamp: any) => {
  if (!timestamp) return "Just now";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  
  const diffInDays = Math.floor(diffInSeconds / 86400);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};

// --- HELPER: BATCH TAG ---
const getBatchTag = (profile: any) => {
  if (profile?.role === 'admin') return 'Faculty';
  if (profile?.batch) return `Batch ${profile.batch}`;
  if (profile?.regNo) return `Batch ${profile.regNo.substring(0, 4)}`;
  return 'Student';
};

export default function FoodPage() {
  useAuthProtection();
  const { user, userProfile } = useAuth() as any;
  
  // Navigation & Selection
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<any | null>(null); // For Pizzas/Sizes
  const [showGenie, setShowGenie] = useState(false);
  
  // Favorites
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showSavedItems, setShowSavedItems] = useState(false);
  const [unfavoriteTarget, setUnfavoriteTarget] = useState<string | null>(null);

  // Data
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [messComments, setMessComments] = useState<MessComment[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");

  // Genie State
  const [genieStep, setGenieStep] = useState(0); 
  const [geniePrefs, setGeniePrefs] = useState({ budget: 500, category: "Any", people: 1 });

  // Forms
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newMessComment, setNewMessComment] = useState("");

  // --- INITIALIZATION ---
  useEffect(() => {
    const savedFavs = localStorage.getItem("gikonnect_food_favs");
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    });
    return () => unsubscribe();
  }, []);

  // --- MESS COMMENTS ---
  useEffect(() => {
    if (selectedVenue?.type !== "Mess") return;
    const q = query(collection(db, "mess_comments"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessComment)));
    });
    return () => unsubscribe();
  }, [selectedVenue]);

  // Reset category when venue changes
  useEffect(() => {
    if (selectedVenue) setActiveCategory("All");
  }, [selectedVenue]);

  // Set default variation when item opens
  useEffect(() => {
    if (selectedItem && selectedItem.variations) {
      setSelectedVariation(selectedItem.variations[0]);
    } else {
      setSelectedVariation(null);
    }
  }, [selectedItem]);

  // --- ACTIONS ---
  const toggleFavorite = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorites.includes(itemId)) {
      setUnfavoriteTarget(itemId);
    } else {
      const newFavs = [...favorites, itemId];
      setFavorites(newFavs);
      localStorage.setItem("gikonnect_food_favs", JSON.stringify(newFavs));
    }
  };

  const confirmUnfavorite = () => {
    if (!unfavoriteTarget) return;
    const newFavs = favorites.filter(id => id !== unfavoriteTarget);
    setFavorites(newFavs);
    localStorage.setItem("gikonnect_food_favs", JSON.stringify(newFavs));
    setUnfavoriteTarget(null);
  };

  const submitReview = async () => {
    if (!selectedItem || !newReviewComment.trim()) return;
    try {
      await addDoc(collection(db, "reviews"), {
        itemId: selectedItem.id,
        userEmail: user.email,
        userName: userProfile?.fullName || "Anonymous",
        userLabel: getBatchTag(userProfile),
        rating: newReviewRating,
        comment: newReviewComment,
        timestamp: serverTimestamp(),
      });
      setNewReviewComment("");
      setNewReviewRating(5);
    } catch (e) { console.error(e); }
  };

  const deleteReview = async (reviewId: string) => {
    if (confirm("Delete this review?")) await deleteDoc(doc(db, "reviews", reviewId));
  };

  const submitMessComment = async () => {
    if (!newMessComment.trim()) return;
    try {
      await addDoc(collection(db, "mess_comments"), {
        userEmail: user.email,
        userName: userProfile?.fullName || "Student",
        userLabel: getBatchTag(userProfile),
        comment: newMessComment,
        timestamp: serverTimestamp(),
      });
      setNewMessComment("");
    } catch (e) { console.error(e); }
  };

  const deleteMessComment = async (id: string) => {
    if (confirm("Delete this comment?")) await deleteDoc(doc(db, "mess_comments", id));
  };

  // --- LOGIC HELPER ---
  const getItemRating = (itemId: string) => {
    const reviews = allReviews.filter(r => r.itemId === itemId);
    if (reviews.length === 0) return { avg: "New", count: 0, num: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { 
      avg: (sum / reviews.length).toFixed(1), 
      count: reviews.length,
      num: sum / reviews.length
    };
  };

  const getFilteredItems = () => {
    if (!selectedVenue) return [];
    let items = MENU_ITEMS[selectedVenue.id] || [];
    if (activeCategory !== "All") {
      items = items.filter(i => i.category === activeCategory);
    }
    return items;
  };

  const getVenueCategories = () => {
    if (!selectedVenue) return [];
    const items = MENU_ITEMS[selectedVenue.id] || [];
    const cats = Array.from(new Set(items.map(i => i.category)));
    return ["All", ...cats];
  };

  const getAllFavoriteItems = () => {
    const allItems = Object.values(MENU_ITEMS).flat();
    return allItems.filter(item => favorites.includes(item.id));
  };

  // --- SMART GENIE LOGIC ---
  const runGenie = () => {
    const results: MenuItem[] = [];
    const budgetPerPerson = geniePrefs.budget / geniePrefs.people;

    // Smart Suggestion: Mess logic
    if (geniePrefs.category === "Desi" && budgetPerPerson < 250) {
      // Mock a Mess Item
      results.push({ 
        id: "mess_guest", 
        name: "GIKI Mess (Guest Meal)", 
        price: 200, 
        category: "Desi", 
        image: "mess_img",
        description: "Best value for money on campus."
      });
    }

    const allItems = Object.values(MENU_ITEMS).flat();
    
    const filtered = allItems.filter(item => {
      // Handle Variations Price Check
      const minPrice = item.variations 
        ? Math.min(...item.variations.map(v => v.price))
        : item.price;
      
      const fitsBudget = minPrice <= budgetPerPerson;
      const fitsCategory = geniePrefs.category === "Any" || item.category === geniePrefs.category;
      return fitsBudget && fitsCategory;
    });

    // Sort by rating
    filtered.sort((a, b) => {
      const rateA = getItemRating(a.id).num || 0;
      const rateB = getItemRating(b.id).num || 0;
      return rateB - rateA;
    });

    return [...results, ...filtered].slice(0, 3);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-24 relative overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px]" />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        
        {/* HEADER */}
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 drop-shadow-lg">
              Dining Hall <Utensils className="text-orange-400" />
            </h1>
            <p className="text-slate-400">Discover campus food & menus.</p>
          </div>
          <div className="flex gap-2">
             <button 
                onClick={() => setShowSavedItems(!showSavedItems)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${showSavedItems ? "bg-red-500/20 text-red-400 border-red-500/50" : "bg-slate-900/50 text-slate-400 border-white/10 hover:text-white"}`}
             >
                <Bookmark fill={showSavedItems ? "currentColor" : "none"} size={18} />
                <span className="text-sm font-bold hidden md:inline">Saved Items</span>
             </button>
             <button 
                onClick={() => setShowGenie(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 transition-transform px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-purple-500/20 border border-white/10"
             >
                <Sparkles size={18} className="text-yellow-300" />
                <span className="hidden md:inline">Genie</span>
             </button>
          </div>
        </header>

        {/* SAVED ITEMS VIEW */}
        <AnimatePresence>
           {showSavedItems && (
              <motion.div 
                 initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                 className="overflow-hidden mb-8"
              >
                 <div className="bg-slate-900/40 rounded-[2rem] border border-white/5 p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400"><Heart fill="currentColor"/> Your Collection</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {getAllFavoriteItems().length > 0 ? getAllFavoriteItems().map(item => (
                          <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-slate-800/60 p-3 rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-slate-700 rounded-lg flex items-center justify-center font-bold text-slate-500 text-[10px]">IMG</div>
                                <div>
                                   <h4 className="font-bold text-sm">{item.name}</h4>
                                   <p className="text-xs text-slate-400">
                                      {item.variations ? "Multiple Options" : `Rs. ${item.price}`}
                                   </p>
                                </div>
                             </div>
                             <button onClick={(e) => toggleFavorite(item.id, e)} className="text-red-500 p-2"><Heart size={18} fill="currentColor" /></button>
                          </div>
                       )) : (
                          <p className="text-slate-500 text-sm">No saved items yet.</p>
                       )}
                    </div>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

        {/* VENUE GRID */}
        {!selectedVenue && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VENUES.map((venue) => {
              // Calculate Venue Rating
              const venueItems = MENU_ITEMS[venue.id] || [];
              const reviews = allReviews.filter(r => venueItems.some(i => i.id === r.itemId));
              const avg = reviews.length ? (reviews.reduce((a,b)=>a+b.rating,0)/reviews.length).toFixed(1) : "New";

              return (
                <motion.div
                  key={venue.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedVenue(venue); setActiveCategory("All"); setShowSavedItems(false); }}
                  className={`relative h-56 rounded-[2rem] overflow-hidden cursor-pointer shadow-2xl border border-white/10 group bg-gradient-to-br ${venue.image}`}
                >
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all duration-500" />
                  <div className="absolute bottom-0 inset-x-0 p-5 bg-slate-900/90 backdrop-blur-md border-t border-white/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-0.5">{venue.name}</h3>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wide">{venue.type}</p>
                        </div>
                        {venue.type !== "Mess" && (
                            <div className="text-right">
                                <span className="flex items-center justify-end gap-1 text-yellow-400 font-bold text-lg">
                                    {avg} <Star size={14} fill="currentColor" />
                                </span>
                                <span className="text-[10px] text-slate-500">{reviews.length} reviews</span>
                            </div>
                        )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* VENUE DETAIL MODAL (Fixed Centered) */}
        <AnimatePresence>
          {selectedVenue && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
              className="fixed inset-0 z-40 bg-slate-950/90 backdrop-blur-xl flex justify-center overflow-hidden"
            >
               <div className="w-full h-full max-w-5xl flex flex-col relative">
                  
                  {/* Sticky Venue Header */}
                  <div className="shrink-0 p-6 flex justify-between items-center border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
                     <div>
                        <h2 className="text-3xl font-bold text-white">{selectedVenue.name}</h2>
                        <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                           <MapPin size={14} />
                           <span>{selectedVenue.description}</span>
                        </div>
                     </div>
                     <div className="flex gap-3">
                        {selectedVenue.phoneNumber && (
                           <button onClick={() => window.location.href = `tel:${selectedVenue.phoneNumber}`} className="bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white p-3 rounded-full transition border border-green-600/30"><Phone size={20} /></button>
                        )}
                        <button onClick={() => setSelectedVenue(null)} className="bg-slate-800 text-slate-400 hover:text-white p-3 rounded-full transition border border-white/10"><X size={20} /></button>
                     </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-6 pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
                     
                     {/* --- MESS UI --- */}
                     {selectedVenue.type === "Mess" ? (
                        <div className="max-w-3xl mx-auto space-y-8">
                           {Object.entries(MESS_MENU).map(([day, meals]) => {
                              const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
                              return (
                                 <div key={day} className={`p-6 rounded-3xl border relative ${isToday ? 'bg-slate-900 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.1)]' : 'bg-slate-900/40 border-white/5'}`}>
                                    {isToday && <span className="absolute top-4 right-4 text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20">TODAY</span>}
                                    <h3 className={`text-2xl font-bold mb-6 ${isToday ? 'text-orange-400' : 'text-slate-300'}`}>{day}</h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                       {Object.entries(meals).map(([type, meal]) => (
                                          <div key={type} className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                             <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 block">{type}</span>
                                             <span className="text-sm font-medium text-slate-200">{meal}</span>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              );
                           })}
                           
                           {/* Mess Discussion */}
                           <div className="bg-slate-900/80 rounded-[2rem] border border-white/10 p-6 md:p-8">
                              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="text-blue-400"/> Community Feed</h3>
                              <div className="flex gap-2 mb-8">
                                 <input value={newMessComment} onChange={(e) => setNewMessComment(e.target.value)} placeholder="How's the food today?" className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition" />
                                 <button onClick={submitMessComment} className="bg-blue-600 p-3 rounded-xl hover:bg-blue-500 text-white"><Send size={20} /></button>
                              </div>
                              <div className="space-y-4">
                                 {messComments.map(c => (
                                    <div key={c.id} className="p-4 rounded-2xl bg-black/20 border border-white/5">
                                       <div className="flex justify-between items-start mb-2">
                                          <div className="flex items-center gap-2">
                                             <span className="font-bold text-blue-300 text-sm">{c.userName}</span>
                                             <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-white/5">{c.userLabel || "Student"}</span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                             <span className="text-[10px] text-slate-500">{formatRelativeTime(c.timestamp)}</span>
                                             {c.userEmail === user.email && <button onClick={() => deleteMessComment(c.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={14}/></button>}
                                          </div>
                                       </div>
                                       <p className="text-slate-300 text-sm leading-relaxed">{c.comment}</p>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     ) : (
                        /* --- RESTAURANT UI --- */
                        <div className="max-w-6xl mx-auto">
                           {/* Category Tabs */}
                           <div className="flex gap-2 mb-8 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
                              {getVenueCategories().map(cat => (
                                 <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat ? "bg-white text-black shadow-lg" : "bg-slate-800 border border-white/10 text-slate-400 hover:text-white"}`}>
                                    {cat}
                                 </button>
                              ))}
                           </div>

                           {/* Menu Grid */}
                           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {getFilteredItems().map(item => {
                                 const rating = getItemRating(item.id);
                                 const isFav = favorites.includes(item.id);
                                 // Price Display Logic
                                 let priceDisplay = `Rs. ${item.price}`;
                                 if (item.variations) {
                                    const prices = item.variations.map(v => v.price);
                                    const min = Math.min(...prices);
                                    const max = Math.max(...prices);
                                    priceDisplay = min === max ? `Rs. ${min}` : `Rs. ${min} - ${max}`;
                                 }

                                 return (
                                    <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-slate-900/60 backdrop-blur-sm p-4 rounded-3xl border border-white/5 hover:border-white/20 hover:bg-slate-800/80 transition cursor-pointer group flex flex-col justify-between h-full">
                                       <div className="flex items-start justify-between mb-4">
                                          <div className="h-16 w-16 bg-slate-800 rounded-2xl flex items-center justify-center font-bold text-slate-600 text-[10px] shrink-0 border border-white/5 group-hover:scale-110 transition-transform">IMG</div>
                                          <button onClick={(e) => toggleFavorite(item.id, e)} className={`p-2 rounded-full hover:bg-white/10 transition ${isFav ? "text-red-500" : "text-slate-600"}`}>
                                             <Heart size={20} fill={isFav ? "currentColor" : "none"} />
                                          </button>
                                       </div>
                                       <div>
                                          <h4 className="font-bold text-lg leading-tight mb-1 group-hover:text-blue-400 transition">{item.name}</h4>
                                          <div className="flex items-center gap-2 mb-3">
                                             <span className="flex items-center gap-1 text-yellow-500 text-xs font-bold"><Star size={10} fill="currentColor"/> {rating.avg}</span>
                                             <span className="text-slate-600 text-xs">• {rating.count} reviews</span>
                                          </div>
                                          <div className="font-bold text-slate-200">{priceDisplay}</div>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- GENIE MODAL --- */}
        <AnimatePresence>
          {showGenie && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
               <div className="bg-slate-900 w-full max-w-md rounded-[2rem] border border-purple-500/30 p-8 relative overflow-hidden shadow-2xl shadow-purple-900/20">
                  <button onClick={() => { setShowGenie(false); setGenieStep(0); }} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X /></button>
                  
                  <div className="text-center mb-8">
                     <div className="inline-block p-4 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full mb-4 border border-purple-500/20">
                        <Sparkles size={40} className="text-purple-400" />
                     </div>
                     <h2 className="text-3xl font-bold text-white mb-2">Food Genie</h2>
                     <p className="text-slate-400">Let AI pick your meal.</p>
                  </div>

                  {genieStep === 0 && (
                     <div className="space-y-6">
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Total Budget</label>
                           <input type="range" min="100" max="2500" step="50" value={geniePrefs.budget} onChange={(e) => setGeniePrefs({...geniePrefs, budget: parseInt(e.target.value)})} className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                           <div className="text-right font-bold text-2xl text-purple-400 mt-2">Rs. {geniePrefs.budget}</div>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">How many people?</label>
                           <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-xl border border-white/5">
                              <Users className="text-purple-400" />
                              <input type="number" min="1" max="10" value={geniePrefs.people} onChange={(e) => setGeniePrefs({...geniePrefs, people: Math.max(1, parseInt(e.target.value))})} className="bg-transparent font-bold text-xl w-full outline-none text-white" />
                           </div>
                        </div>
                        <button onClick={() => setGenieStep(1)} className="w-full bg-purple-600 py-4 rounded-xl font-bold text-lg hover:bg-purple-500 shadow-lg shadow-purple-600/30 transition">Next Step</button>
                     </div>
                  )}

                  {genieStep === 1 && (
                     <div className="space-y-3">
                        <p className="text-center text-slate-300 mb-4 font-medium">What are you craving?</p>
                        {["Any", "Desi", "Fast Food", "Chinese", "Pizza", "Beverages"].map(cat => (
                           <button key={cat} onClick={() => { setGeniePrefs({...geniePrefs, category: cat}); setGenieStep(2); }} className="w-full p-4 bg-slate-800/50 hover:bg-purple-600 hover:text-white border border-white/5 hover:border-purple-500 rounded-2xl text-left flex justify-between transition-all group">
                              <span className="font-bold">{cat}</span> <ChevronRight className="opacity-50 group-hover:opacity-100" />
                           </button>
                        ))}
                     </div>
                  )}

                  {genieStep === 2 && (
                     <div className="space-y-4">
                        <h3 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wide">Top Picks (Rs. {(geniePrefs.budget/geniePrefs.people).toFixed(0)}/person)</h3>
                        {runGenie().length > 0 ? runGenie().map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center p-4 bg-slate-800/40 rounded-2xl border border-white/5 hover:bg-slate-800 transition">
                              <div>
                                 <div className="font-bold text-white">{item.name}</div>
                                 <div className="text-xs text-slate-400 mt-1">
                                    {item.variations ? "Multiple Options" : `Rs. ${item.price}`} • ⭐ {getItemRating(item.id).avg}
                                 </div>
                              </div>
                              <button onClick={() => { 
                                 setShowGenie(false); 
                                 if (item.id === 'mess_guest') {
                                    // Handle Mess Suggestion
                                    const messVenue = VENUES.find(v => v.type === 'Mess');
                                    if(messVenue) setSelectedVenue(messVenue);
                                 } else {
                                    const v = VENUES.find(v => MENU_ITEMS[v.id]?.some(i => i.id === item.id));
                                    if(v) setSelectedVenue(v);
                                    setSelectedItem(item);
                                 }
                              }} className="text-xs px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg font-bold transition">
                                 View
                              </button>
                           </div>
                        )) : <div className="text-center py-8 text-slate-500 bg-slate-800/20 rounded-2xl border border-white/5">No items found in this range. <br/> Try increasing budget.</div>}
                        <button onClick={() => setGenieStep(0)} className="w-full mt-4 py-3 text-slate-400 hover:text-white font-bold text-sm">Start Over</button>
                     </div>
                  )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- UNFAVORITE CONFIRMATION --- */}
        <AnimatePresence>
           {unfavoriteTarget && (
              <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                 <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl">
                    <Heart size={48} className="text-red-500 mx-auto mb-4" fill="currentColor" />
                    <h3 className="text-xl font-bold mb-2 text-white">Remove Item?</h3>
                    <p className="text-slate-400 text-sm mb-6">Are you sure you want to remove this from your saved items?</p>
                    <div className="flex gap-3">
                       <button onClick={() => setUnfavoriteTarget(null)} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 text-white transition">Cancel</button>
                       <button onClick={confirmUnfavorite} className="flex-1 py-3 bg-red-600 rounded-xl font-bold hover:bg-red-500 text-white transition">Remove</button>
                    </div>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>

        {/* --- ITEM DETAIL MODAL (CENTERED POPUP) --- */}
        <AnimatePresence>
           {selectedItem && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                 <div className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-slate-700 flex flex-col max-h-[90vh] shadow-2xl overflow-hidden relative">
                    
                    {/* Header */}
                    <div className="p-6 pb-4 border-b border-white/5 flex justify-between items-start bg-slate-900">
                       <div className="pr-4">
                          <h3 className="text-2xl font-bold text-white leading-tight mb-1">{selectedItem.name}</h3>
                          <div className="text-blue-400 font-bold text-xl">
                             Rs. {selectedVariation ? selectedVariation.price : selectedItem.price}
                          </div>
                       </div>
                       <button onClick={() => { setSelectedItem(null); setSelectedVariation(null); }} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition"><X size={20}/></button>
                    </div>

                    <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
                       <div className="p-6 space-y-6">
                          
                          {/* Variations Selector */}
                          {selectedItem.variations && (
                             <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Option</label>
                                <div className="flex flex-wrap gap-2">
                                   {selectedItem.variations.map((v: any) => (
                                      <button 
                                         key={v.id} 
                                         onClick={() => setSelectedVariation(v)}
                                         className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${selectedVariation?.id === v.id ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700"}`}
                                      >
                                         {v.name}
                                      </button>
                                   ))}
                                </div>
                             </div>
                          )}

                          {/* Rating Summary */}
                          <div className="flex items-center gap-6 bg-slate-800/30 p-5 rounded-3xl border border-white/5">
                             <div className="text-center">
                                <div className="text-4xl font-black text-white">{getItemRating(selectedItem.id).avg}</div>
                                <div className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-wide">Rating</div>
                             </div>
                             <div className="h-10 w-px bg-white/10"></div>
                             <div className="flex-1">
                                <div className="flex text-yellow-400 mb-2 gap-1"><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16} className="opacity-30"/></div>
                                <p className="text-sm text-slate-400">Based on {getItemRating(selectedItem.id).count} reviews</p>
                             </div>
                          </div>

                          {/* Reviews List */}
                          <div className="space-y-4">
                             <h4 className="font-bold text-slate-200 text-lg">Reviews</h4>
                             {allReviews.filter(r => r.itemId === selectedItem.id).length > 0 ? (
                                allReviews.filter(r => r.itemId === selectedItem.id).map(r => (
                                   <div key={r.id} className="bg-slate-800/40 p-5 rounded-2xl border border-white/5">
                                      <div className="flex justify-between items-start mb-3">
                                         <div className="flex items-center gap-2">
                                            <span className="font-bold text-white text-sm">{r.userName}</span>
                                            <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 border border-white/5">{r.userLabel || "Student"}</span>
                                         </div>
                                         <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-slate-500">{formatRelativeTime(r.timestamp)}</span>
                                            {r.userEmail === user.email && <button onClick={() => deleteReview(r.id)} className="text-slate-600 hover:text-red-500 transition"><Trash2 size={14}/></button>}
                                         </div>
                                      </div>
                                      <div className="flex items-center gap-1 mb-2">
                                         {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={10} className={i < r.rating ? "text-yellow-400 fill-current" : "text-slate-700"} />
                                         ))}
                                      </div>
                                      <p className="text-slate-300 text-sm leading-relaxed">{r.comment}</p>
                                   </div>
                                ))
                             ) : (
                                <p className="text-slate-500 text-sm italic">No reviews yet. Be the first!</p>
                             )}
                          </div>
                       </div>
                    </div>

                    {/* Add Review Footer */}
                    <div className="p-5 border-t border-white/5 bg-slate-900">
                       <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Write a Review</h4>
                       <div className="flex justify-center gap-3 mb-4">
                          {[1,2,3,4,5].map(s => (
                             <button key={s} onClick={() => setNewReviewRating(s)} className="transition-transform hover:scale-110 focus:scale-110">
                                <Star size={24} className={s <= newReviewRating ? "text-yellow-400 fill-current" : "text-slate-700"} />
                             </button>
                          ))}
                       </div>
                       <div className="flex gap-3">
                          <input value={newReviewComment} onChange={e=>setNewReviewComment(e.target.value)} placeholder="Share your experience..." className="flex-1 bg-black/40 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition text-sm" />
                          <button onClick={submitReview} className="bg-blue-600 px-5 rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-600/20 text-white"><Send size={18}/></button>
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