"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import PageLoader from "@/components/PageLoader";

import { 
  Calendar, MapPin, Clock, Trash2, Plus, 
  AlertTriangle, Search, BookOpen, PenTool, CalendarX2, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type ExamSeason = {
  id: string;
  title: string;
  type: "Mids" | "Finals";
};

type MasterExam = {
  id: string;
  course_code: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  venue: string;
};

type UserExam = {
  id: string;
  master_exam_id: string;
  custom_name: string | null;
  master_exam: MasterExam; // Joined data
};

export default function ExamSchedulePage() {
  useAuthProtection();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;

  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState<ExamSeason | null>(null);
  const [masterExams, setMasterExams] = useState<MasterExam[]>([]);
  const [myExams, setMyExams] = useState<UserExam[]>([]);
  const [clashes, setClashes] = useState<string[]>([]);

  // Form State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [customName, setCustomName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // 1. Fetch Data
  useEffect(() => {
    if (!userId) return;

    const fetchExamData = async () => {
      try {
        // Fetch Active Season
        const { data: seasonData } = await supabase
          .from('exam_seasons')
          .select('*')
          .single();

        if (!seasonData) {
          setLoading(false);
          return; // No active season
        }
        setSeason(seasonData as ExamSeason);

        // Fetch Master Schedule for this season
        const { data: masterData } = await supabase
          .from('master_exams')
          .select('*')
          .eq('season_id', seasonData.id)
          .order('exam_date', { ascending: true });
        
        if (masterData) setMasterExams(masterData);

        // Fetch User's Personal Schedule
        const { data: userData } = await supabase
          .from('user_exams')
          .select(`
            id, 
            master_exam_id, 
            custom_name,
            master_exams (*)
          `)
          .eq('user_id', userId);

        if (userData) {
          // Format data and sort by date/time
          const formatted = userData.map((u: any) => ({
            id: u.id,
            master_exam_id: u.master_exam_id,
            custom_name: u.custom_name,
            master_exam: u.master_exams
          })).sort((a, b) => {
            const dateA = new Date(`${a.master_exam.exam_date}T${a.master_exam.start_time}`);
            const dateB = new Date(`${b.master_exam.exam_date}T${b.master_exam.start_time}`);
            return dateA.getTime() - dateB.getTime();
          });
          setMyExams(formatted);
        }
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [userId]);

  // 2. Clash Detection Logic
  useEffect(() => {
    const detectClashes = () => {
      const timeSlots: Record<string, string[]> = {};
      const newClashes: string[] = [];

      myExams.forEach(exam => {
        // Create a unique key for the specific date and start time
        const timeKey = `${exam.master_exam.exam_date}_${exam.master_exam.start_time}`;
        
        if (timeSlots[timeKey]) {
          // A clash exists! Add both exam IDs to the clash array
          timeSlots[timeKey].push(exam.id);
          newClashes.push(...timeSlots[timeKey]);
        } else {
          timeSlots[timeKey] = [exam.id];
        }
      });

      setClashes([...new Set(newClashes)]); // Remove duplicates
    };

    detectClashes();
  }, [myExams]);

  // 3. Handlers
  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !userId) return;
    setIsAdding(true);

    try {
      const { data, error } = await supabase
        .from('user_exams')
        .insert({
          user_id: userId,
          master_exam_id: selectedCourseId,
          custom_name: customName || null
        })
        .select(`
          id, master_exam_id, custom_name, master_exams (*)
        `).single();

      if (error) throw error;

      // Update local state and sort
     // Explicitly declare this as UserExam and cast the joined data
     const newExam: UserExam = {
        id: data.id,
        master_exam_id: data.master_exam_id,
        custom_name: data.custom_name,
        // Sometimes Supabase returns joined data as an array. This safely extracts it.
        master_exam: (Array.isArray(data.master_exams) ? data.master_exams[0] : data.master_exams) as any
      };

      setMyExams(prev => {
        const newArray = [...prev, newExam];
        return newArray.sort((a, b) => {
          const dateA = new Date(`${a.master_exam.exam_date}T${a.master_exam.start_time}`);
          const dateB = new Date(`${b.master_exam.exam_date}T${b.master_exam.start_time}`);
          return dateA.getTime() - dateB.getTime();
        });
      });

      // Reset Form
      setSearchQuery("");
      setSelectedCourseId("");
      setCustomName("");
    } catch (err: any) {
      alert("Error adding exam: " + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveExam = async (id: string) => {
    try {
      await supabase.from('user_exams').delete().eq('id', id);
      setMyExams(prev => prev.filter(exam => exam.id !== id));
    } catch (err) {
      alert("Error removing exam.");
    }
  };

  // Helper formatting
  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Filter out courses already in the user's schedule
  const availableCourses = masterExams.filter(me => 
    !myExams.some(ue => ue.master_exam_id === me.id) &&
    me.course_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) return <PageLoader text="Loading Examination Data..." />;

  // --- EMPTY STATE (No Active Season) ---
  if (!season) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <CalendarX2 size={64} className="text-slate-700 mb-6" />
        <h2 className="text-2xl font-bold mb-2">No Active Exam Season</h2>
        <p className="text-slate-500 text-center max-w-sm">
          Enjoy the peace while it lasts! The administration has not published a Mids or Finals schedule yet.
        </p>
      </div>
    );
  }

  const themeColor = season.type === "Finals" ? "purple" : "blue";

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-24 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className={`absolute -top-[10%] -left-[10%] w-[500px] h-[500px] rounded-full blur-[120px] bg-${themeColor}-600/20`}
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ duration: 10, repeat: Infinity }} 
        />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        
        {/* Header */}
        <header className="mb-10 text-center md:text-left">
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 bg-${themeColor}-500/20 text-${themeColor}-400 border border-${themeColor}-500/30`}>
            {season.title}
          </div>
          <h1 className="text-4xl font-black flex items-center justify-center md:justify-start gap-3">
            My {season.type} Schedule
          </h1>
          <p className="text-slate-400 mt-2">Build your personalized exam itinerary to avoid surprises.</p>
        </header>

        {/* Clash Warning Banner */}
        <AnimatePresence>
          {clashes.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-4 bg-red-950/50 border border-red-500/50 rounded-2xl flex items-start gap-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
            >
              <AlertTriangle className="text-red-500 shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-red-400 text-lg">CRITICAL: Schedule Clash Detected!</h3>
                <p className="text-red-200/80 text-sm mt-1">
                  You have multiple exams scheduled at the exact same time. This is rare but happens. 
                  <strong> Contact your instructors and the examination office immediately </strong> to arrange an alternative setup.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Add Course Form */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/10 sticky top-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className={`text-${themeColor}-400`} /> Add Exam
              </h3>
              
              <form onSubmit={handleAddExam} className="space-y-4">
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Search Course Code</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedCourseId(""); // Reset selection if they type
                      }}
                      placeholder="e.g. CS232"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Custom Datalist / Selection Box */}
                {searchQuery && !selectedCourseId && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl max-h-48 overflow-y-auto shadow-xl">
                    {availableCourses.length === 0 ? (
                      <p className="p-3 text-sm text-slate-500 text-center">No courses found</p>
                    ) : (
                      availableCourses.map(course => (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setSearchQuery(course.course_code);
                          }}
                          className="w-full text-left p-3 text-sm hover:bg-slate-800 border-b border-slate-800/50 transition-colors flex justify-between items-center group"
                        >
                          <span className="font-bold text-white group-hover:text-blue-400">{course.course_code}</span>
                          <span className="text-xs text-slate-500">{formatDate(course.exam_date)}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Custom Alias (Optional)</label>
                  <div className="relative">
                    <PenTool className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input 
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. DBMS"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={!selectedCourseId || isAdding}
                  className={`w-full py-3.5 mt-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    !selectedCourseId 
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                      : `bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]`
                  }`}
                >
                  {isAdding ? <Loader2 className="animate-spin" /> : "Add to My Schedule"}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Schedule Display */}
          <div className="lg:col-span-2 space-y-4">
            {myExams.length === 0 ? (
              <div className="bg-slate-900/40 border border-dashed border-slate-700 rounded-3xl p-12 flex flex-col items-center text-center">
                <BookOpen size={48} className="text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-300 mb-2">Your schedule is empty</h3>
                <p className="text-slate-500 text-sm max-w-sm">Search for your registered courses on the left to build your personalized exam timetable.</p>
              </div>
            ) : (
              <AnimatePresence>
                {myExams.map((exam) => {
                  const isClashing = clashes.includes(exam.id);

                  return (
                    <motion.div 
                      key={exam.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`relative bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border transition-all overflow-hidden ${
                        isClashing 
                          ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]" 
                          : "border-slate-700/50 hover:border-slate-500"
                      }`}
                    >
                      {/* Decorative side accent */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${isClashing ? "bg-red-500" : `bg-${themeColor}-500`}`} />

                      <div className="flex justify-between items-start pl-2">
                        <div>
                          <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            {exam.master_exam.course_code}
                            {exam.custom_name && (
                              <span className="text-lg font-medium text-slate-400">
                                — {exam.custom_name}
                              </span>
                            )}
                          </h3>
                          
                          <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 ${isClashing ? "text-red-400 border border-red-500/30" : "text-slate-300 border border-slate-800"}`}>
                              <Calendar size={16} className={isClashing ? "text-red-500" : `text-${themeColor}-400`} />
                              {formatDate(exam.master_exam.exam_date)}
                            </div>
                            
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 ${isClashing ? "text-red-400 border border-red-500/30" : "text-slate-300 border border-slate-800"}`}>
                              <Clock size={16} className={isClashing ? "text-red-500" : `text-${themeColor}-400`} />
                              {formatTime(exam.master_exam.start_time)} - {formatTime(exam.master_exam.end_time)}
                            </div>

                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 text-slate-300 border border-slate-800">
                              <MapPin size={16} className="text-cyan-400" />
                              {exam.master_exam.venue}
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleRemoveExam(exam.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove from schedule"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}