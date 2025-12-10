"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VENUES, MENU_ITEMS, MESS_MENU, MenuItem, Venue, Review, MessComment } from "../lib/foodData";
import { Star, X, ChefHat, Sparkles, Phone, Trash2, Send, ChevronRight, Clock, Heart, Users, Utensils } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { collection, addDoc, query, onSnapshot, serverTimestamp, deleteDoc, doc, orderBy } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

export default function FoodPage() {
    useAuthProtection();
  const { user, userProfile } = useAuth() as any;
  
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showGenie, setShowGenie] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]); // Array of Item IDs
  const [showFavorites, setShowFavorites] = useState(false);
  const [unfavoriteTarget, setUnfavoriteTarget] = useState<string | null>(null); // For confirm popup

  // Data State
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [messComments, setMessComments] = useState<MessComment[]>([]);
  
  // Filter State
  const [activeCategory, setActiveCategory] = useState("All");

  // Genie State
  const [genieStep, setGenieStep] = useState(0); 
  const [geniePrefs, setGeniePrefs] = useState({ budget: 500, category: "Any", people: 1 });

  // Form State
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newMessComment, setNewMessComment] = useState("");

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    // Load Favorites from LocalStorage
    const savedFavs = localStorage.getItem("gikonnect_food_favs");
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    // Fetch Reviews
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

  // --- HELPERS ---
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

  const getItemRating = (itemId: string) => {
    const reviews = allReviews.filter(r => r.itemId === itemId);
    if (reviews.length === 0) return { avg: 0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { avg: parseFloat((sum / reviews.length).toFixed(1)), count: reviews.length };
  };

  const getVenueRating = (venueId: string) => {
    const venueItems = MENU_ITEMS[venueId] || [];
    const itemIds = venueItems.map(i => i.id);
    const venueReviews = allReviews.filter(r => itemIds.includes(r.itemId));

    if (venueReviews.length === 0) return { avg: "New", count: 0 };
    const sum = venueReviews.reduce((acc, r) => acc + r.rating, 0);
    return { 
        avg: (sum / venueReviews.length).toFixed(1), 
        count: venueReviews.length 
    };
  };

  // --- GENIE LOGIC 2.0 ---
  const runGenie = () => {
    const allItems = Object.values(MENU_ITEMS).flat();
    const budgetPerPerson = geniePrefs.budget / geniePrefs.people;

    return allItems
      .filter(item => item.price <= budgetPerPerson) // Check price vs per-person budget
      .filter(item => geniePrefs.category === "Any" || item.category === geniePrefs.category)
      .sort((a, b) => getItemRating(b.id).avg - getItemRating(a.id).avg)
      .slice(0, 3);
  };

  // --- ACTIONS ---
  const handleCall = (number: string) => { window.location.href = `tel:${number}`; };

  const submitReview = async () => {
    if (!selectedItem || !newReviewComment.trim()) return;
    let identityLabel = "Student";
    if (userProfile?.role === 'admin') identityLabel = "Faculty";
    else if (userProfile?.batch) identityLabel = userProfile.batch;

    try {
      await addDoc(collection(db, "reviews"), {
        itemId: selectedItem.id,
        userEmail: user.email,
        userName: userProfile?.fullName || "Anonymous",
        userLabel: identityLabel,
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
        comment: newMessComment,
        timestamp: serverTimestamp(),
      });
      setNewMessComment("");
    } catch (e) { console.error(e); }
  };

  const deleteMessComment = async (id: string) => {
    if (confirm("Delete this comment?")) await deleteDoc(doc(db, "mess_comments", id));
  };

  const getFilteredItems = () => {
    if (!selectedVenue) return [];
    let items = MENU_ITEMS[selectedVenue.id] || [];
    if (activeCategory !== "All") {
      items = items.filter(i => i.category === activeCategory);
    }
    return items;
  };

  const getAllFavoriteItems = () => {
    const allItems = Object.values(MENU_ITEMS).flat();
    return allItems.filter(item => favorites.includes(item.id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-24 relative overflow-hidden">
      
      {/* --- PREMIUM BACKGROUND --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px]" />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        
        {/* Header */}
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 drop-shadow-lg">
              Dining Hall <Utensils className="text-orange-400" />
            </h1>
            <p className="text-slate-400">Discover campus food & menus.</p>
          </div>
          <div className="flex gap-2">
             <button 
                onClick={() => setShowFavorites(!showFavorites)}
                className={`p-3 rounded-xl border transition-all ${showFavorites ? "bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30" : "bg-slate-900/50 text-slate-400 border-white/10 hover:text-white"}`}
             >
                <Heart fill={showFavorites ? "currentColor" : "none"} size={20} />
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

        {/* --- FAVORITES VIEW --- */}
        <AnimatePresence>
           {showFavorites && (
              <motion.div 
                 initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                 className="overflow-hidden mb-8"
              >
                 <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Heart className="text-red-500" fill="currentColor"/> Your Favorites</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getAllFavoriteItems().length > 0 ? getAllFavoriteItems().map(item => (
                       <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-slate-600 text-xs">IMG</div>
                             <div>
                                <h4 className="font-bold">{item.name}</h4>
                                <p className="text-xs text-slate-400">Rs. {item.price}</p>
                             </div>
                          </div>
                          <button onClick={(e) => toggleFavorite(item.id, e)} className="text-red-500"><Heart fill="currentColor" /></button>
                       </div>
                    )) : (
                       <p className="text-slate-500">No favorites yet. Heart some items!</p>
                    )}
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

        {/* --- VENUE GRID --- */}
        {!selectedVenue && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VENUES.map((venue) => {
              const ratingInfo = getVenueRating(venue.id);
              return (
                <motion.div
                  key={venue.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedVenue(venue); setActiveCategory("All"); setShowFavorites(false); }}
                  className={`relative h-56 rounded-[2rem] overflow-hidden cursor-pointer shadow-2xl border border-white/10 group bg-gradient-to-br ${venue.image}`}
                >
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all duration-500" />
                  
                  {/* Frosted Glass Info Bar */}
                  <div className="absolute bottom-0 inset-x-0 p-6 bg-slate-900/80 backdrop-blur-md border-t border-white/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">{venue.name}</h3>
                            <p className="text-xs text-slate-300 line-clamp-1">{venue.description}</p>
                        </div>
                        {venue.type !== "Mess" && (
                            <div className="text-right">
                                <span className="flex items-center justify-end gap-1 text-yellow-400 font-bold text-lg">
                                    {ratingInfo.avg} <Star size={16} fill="currentColor" />
                                </span>
                                <span className="text-[10px] text-slate-400">{ratingInfo.count} reviews</span>
                            </div>
                        )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* --- VENUE DETAIL MODAL (FULL SCREEN GLASS) --- */}
        <AnimatePresence>
          {selectedVenue && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xl overflow-y-auto"
            >
               {/* Sticky Header */}
               <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 p-6 flex justify-between items-center shadow-lg">
                  <div>
                     <h2 className="text-3xl font-bold text-white">{selectedVenue.name}</h2>
                     <p className="text-slate-400 text-sm">{selectedVenue.description}</p>
                  </div>
                  <div className="flex gap-3">
                     {selectedVenue.phoneNumber && (
                        <button onClick={() => handleCall(selectedVenue.phoneNumber!)} className="bg-green-600 p-3 rounded-full hover:bg-green-500 shadow-lg shadow-green-500/20"><Phone size={20} /></button>
                     )}
                     <button onClick={() => setSelectedVenue(null)} className="bg-slate-800 p-3 rounded-full hover:bg-slate-700 border border-white/10"><X size={20} /></button>
                  </div>
               </div>

               <div className="p-6 pb-32 max-w-4xl mx-auto mt-4">
                  {/* MESS LAYOUT */}
                  {selectedVenue.type === "Mess" ? (
                    <div className="space-y-8">
                       <div className="grid gap-4">
                          {Object.entries(MESS_MENU).map(([day, meals]) => {
                             const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
                             return (
                               <div key={day} className={`p-6 rounded-3xl border relative overflow-hidden ${isToday ? 'bg-slate-900 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)]' : 'bg-slate-900/50 border-white/5'}`}>
                                 {isToday && <div className="absolute top-0 right-0 px-4 py-1 bg-orange-500 text-white text-xs font-bold rounded-bl-2xl">TODAY</div>}
                                 <h3 className={`text-xl font-bold mb-4 ${isToday ? 'text-orange-400' : 'text-slate-300'}`}>{day}</h3>
                                 
                                 <div className="grid md:grid-cols-3 gap-4">
                                    {/* Breakfast */}
                                    <div className="bg-yellow-500/5 border border-yellow-500/10 p-4 rounded-2xl">
                                       <span className="text-[10px] uppercase font-bold text-yellow-500 tracking-wider block mb-1">Breakfast</span>
                                       <span className="text-sm text-slate-300">{meals.Breakfast}</span>
                                    </div>
                                    {/* Lunch */}
                                    <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-2xl">
                                       <span className="text-[10px] uppercase font-bold text-orange-500 tracking-wider block mb-1">Lunch</span>
                                       <span className="text-sm text-slate-300">{meals.Lunch}</span>
                                    </div>
                                    {/* Dinner */}
                                    <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl">
                                       <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider block mb-1">Dinner</span>
                                       <span className="text-sm text-slate-300">{meals.Dinner}</span>
                                    </div>
                                 </div>
                               </div>
                             );
                          })}
                       </div>

                       {/* Discussion Board */}
                       <div className="bg-slate-900/50 rounded-3xl border border-white/5 p-6">
                          <h3 className="text-xl font-bold mb-4">Community Discussion</h3>
                          <div className="flex gap-2 mb-6">
                             <input value={newMessComment} onChange={(e) => setNewMessComment(e.target.value)} placeholder="Say something about the food..." className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" />
                             <button onClick={submitMessComment} className="bg-blue-600 p-3 rounded-xl hover:bg-blue-500"><Send size={20} /></button>
                          </div>
                          <div className="space-y-4">
                             {messComments.map(c => (
                                <div key={c.id} className="p-4 rounded-2xl bg-black/20 border border-white/5">
                                   <div className="flex justify-between mb-1"><span className="text-blue-400 font-bold text-sm">{c.userName}</span>{c.userEmail===user.email&&<button onClick={()=>deleteMessComment(c.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={14}/></button>}</div>
                                   <p className="text-slate-300 text-sm">{c.comment}</p>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  ) : (
                    /* RESTAURANT LAYOUT */
                    <div>
                      {/* Categories */}
                      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                         {["All", "Desi", "Fast Food", "Beverages", "Snacks", "Special"].map(cat => (
                            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat ? "bg-white text-black shadow-lg" : "bg-slate-900 border border-white/10 text-slate-400 hover:text-white"}`}>
                               {cat}
                            </button>
                         ))}
                      </div>

                      {/* Menu Grid */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {getFilteredItems().map(item => {
                           const { avg, count } = getItemRating(item.id);
                           const isFav = favorites.includes(item.id);
                           return (
                              <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-slate-900/60 backdrop-blur-md p-4 rounded-[1.5rem] border border-white/5 hover:border-white/20 transition cursor-pointer group flex items-center justify-between relative overflow-hidden">
                                 <div className="flex items-center gap-5 relative z-10">
                                    <div className="h-20 w-20 bg-slate-800 rounded-2xl flex items-center justify-center font-bold text-slate-600 text-sm">IMG</div>
                                    <div>
                                       <h4 className="text-lg font-bold group-hover:text-blue-400 transition">{item.name}</h4>
                                       <div className="flex items-center gap-2 mt-1">
                                          <span className="flex items-center gap-1 text-yellow-400 text-xs bg-yellow-400/10 px-2 py-0.5 rounded-lg border border-yellow-400/10"><Star size={10} fill="currentColor"/> {avg}</span>
                                          <span className="text-slate-500 text-xs">({count})</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="text-right relative z-10">
                                    <span className="block text-xl font-bold">Rs. {item.price}</span>
                                    <button onClick={(e) => toggleFavorite(item.id, e)} className={`mt-2 p-2 rounded-full hover:bg-white/10 transition ${isFav ? "text-red-500" : "text-slate-600"}`}>
                                       <Heart size={20} fill={isFav ? "currentColor" : "none"} />
                                    </button>
                                 </div>
                              </div>
                           )
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
                           <label className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 block">Total Budget</label>
                           <input type="range" min="100" max="2000" step="50" value={geniePrefs.budget} onChange={(e) => setGeniePrefs({...geniePrefs, budget: parseInt(e.target.value)})} className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                           <div className="text-right font-bold text-2xl text-purple-400 mt-2">Rs. {geniePrefs.budget}</div>
                        </div>
                        <div>
                           <label className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 block">People Count</label>
                           <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-xl border border-white/5">
                              <Users className="text-purple-400" />
                              <input type="number" min="1" max="10" value={geniePrefs.people} onChange={(e) => setGeniePrefs({...geniePrefs, people: Math.max(1, parseInt(e.target.value))})} className="bg-transparent font-bold text-xl w-full outline-none" />
                           </div>
                        </div>
                        <button onClick={() => setGenieStep(1)} className="w-full bg-purple-600 py-4 rounded-xl font-bold text-lg hover:bg-purple-500 shadow-lg shadow-purple-600/30 transition">Next Step</button>
                     </div>
                  )}

                  {genieStep === 1 && (
                     <div className="space-y-3">
                        <p className="text-center text-slate-300 mb-4">What are you craving?</p>
                        {["Any", "Desi", "Fast Food", "Beverages"].map(cat => (
                           <button key={cat} onClick={() => { setGeniePrefs({...geniePrefs, category: cat}); setGenieStep(2); }} className="w-full p-4 bg-slate-800/50 hover:bg-purple-600 hover:text-white border border-white/5 hover:border-purple-500 rounded-2xl text-left flex justify-between transition-all group">
                              <span className="font-bold">{cat}</span> <ChevronRight className="opacity-50 group-hover:opacity-100" />
                           </button>
                        ))}
                     </div>
                  )}

                  {genieStep === 2 && (
                     <div className="space-y-4">
                        <h3 className="text-lg font-bold text-purple-300 mb-2">Top Picks (Rs. {(geniePrefs.budget/geniePrefs.people).toFixed(0)} / person)</h3>
                        {runGenie().length > 0 ? runGenie().map(item => (
                           <div key={item.id} className="flex justify-between items-center p-4 bg-slate-800/40 rounded-2xl border border-white/5">
                              <div><div className="font-bold">{item.name}</div><div className="text-xs text-slate-500">Rs. {item.price} • ⭐ {getItemRating(item.id).avg}</div></div>
                              <button onClick={() => { setShowGenie(false); setSelectedVenue(VENUES.find(v => MENU_ITEMS[v.id]?.includes(item)) || null); setSelectedItem(item); }} className="text-xs px-3 py-1.5 bg-purple-500 text-white rounded-lg font-bold">View</button>
                           </div>
                        )) : <p className="text-center text-slate-500 py-4">No items match this budget.</p>}
                        <button onClick={() => setGenieStep(0)} className="w-full mt-4 py-3 text-slate-400 hover:text-white font-bold">Start Over</button>
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
                 <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
                    <Heart size={40} className="text-red-500 mx-auto mb-4" fill="currentColor" />
                    <h3 className="text-xl font-bold mb-2">Remove from Favorites?</h3>
                    <div className="flex gap-3 mt-6">
                       <button onClick={() => setUnfavoriteTarget(null)} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold hover:bg-slate-700">Cancel</button>
                       <button onClick={confirmUnfavorite} className="flex-1 py-3 bg-red-600 rounded-xl font-bold hover:bg-red-500 text-white">Remove</button>
                    </div>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>

        {/* --- ITEM DETAIL MODAL --- */}
        <AnimatePresence>
           {selectedItem && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                 <div className="bg-slate-900 w-full max-w-md rounded-[2rem] border border-slate-700 flex flex-col max-h-[85vh] shadow-2xl">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                       <div><h3 className="text-2xl font-bold">{selectedItem.name}</h3><p className="text-slate-400 font-bold text-lg">Rs. {selectedItem.price}</p></div>
                       <button onClick={() => setSelectedItem(null)} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700"><X /></button>
                    </div>
                    <div className="overflow-y-auto p-6 flex-1 space-y-6">
                       <div className="flex items-center justify-center gap-4 bg-yellow-500/10 p-6 rounded-3xl border border-yellow-500/20">
                          <div className="text-5xl font-bold text-yellow-400">{getItemRating(selectedItem.id).avg}</div>
                          <div className="text-left"><div className="flex text-yellow-400"><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" className="opacity-30" /></div><p className="text-sm text-yellow-200/70 mt-1">{getItemRating(selectedItem.id).count} Reviews</p></div>
                       </div>
                       <div className="space-y-4">
                          <h4 className="font-bold text-slate-400 uppercase tracking-wider text-xs">Recent Reviews</h4>
                          {allReviews.filter(r => r.itemId === selectedItem.id).map(r => (
                             <div key={r.id} className="bg-slate-800/40 p-4 rounded-2xl border border-white/5">
                                <div className="flex justify-between mb-2"><span className="font-bold text-sm">{r.userName}</span><span className="flex items-center text-yellow-400 text-xs gap-1"><Star size={10} fill="currentColor"/> {r.rating}</span></div>
                                <p className="text-slate-300 text-sm">{r.comment}</p>
                             </div>
                          ))}
                       </div>
                    </div>
                    <div className="p-6 border-t border-slate-800 bg-slate-950 rounded-b-[2rem]">
                       <div className="flex justify-center gap-2 mb-4">{[1,2,3,4,5].map(s=><button key={s} onClick={()=>setNewReviewRating(s)}><Star size={28} className={s<=newReviewRating?"text-yellow-400 fill-current":"text-slate-700"}/></button>)}</div>
                       <div className="flex gap-2"><input value={newReviewComment} onChange={e=>setNewReviewComment(e.target.value)} placeholder="Write a review..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none" /><button onClick={submitReview} className="bg-blue-600 px-5 rounded-xl"><Send/></button></div>
                    </div>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

      </main>
    </div>
  );
}