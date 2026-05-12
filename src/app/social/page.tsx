"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/app/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "next/navigation";
import { 
  Search, Send, Phone, Image as ImageIcon, Mic, 
  Globe, GraduationCap, UserCircle, Loader2, X, Trash2, MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type Message = {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  chat_type: 'direct' | 'class' | 'global';
  content: string;
  media_type: 'text' | 'image' | 'audio';
  created_at: string;
  profiles: { full_name: string; reg_no: string | null; role: string } | null;
};

type ChatPartner = {
  id: string;
  full_name: string;
  reg_no: string | null;
  role: string;
};

export default function SocialPage() {
  useAuthProtection();
  const { userProfile, user, loading: authLoading } = useAuth() as any;
  const router = useRouter();

  // Active Chat State
  const [activeChat, setActiveChat] = useState<{ id: string, name: string, type: 'direct'|'class'|'global', peerId?: string }>({
    id: 'global', name: 'Global Campus', type: 'global'
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [recentChats, setRecentChats] = useState<ChatPartner[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatPartner[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Messages & Setup Realtime
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      let query = supabase.from('messages').select(`*, profiles:sender_id(full_name, reg_no, role)`).order('created_at', { ascending: true });

      if (activeChat.type === 'global') {
        query = query.eq('chat_type', 'global');
      } else if (activeChat.type === 'class') {
        query = query.eq('chat_type', 'class')
                     .eq('target_faculty', userProfile.faculty.split(' - ')[0])
                     .eq('target_batch', userProfile.batch);
      } else {
        query = query.eq('chat_type', 'direct')
                     .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChat.peerId}),and(sender_id.eq.${activeChat.peerId},receiver_id.eq.${user.id})`);
      }

      const { data } = await query;
      if (data) {
        setMessages(data as Message[]);
        scrollToBottom();
      }
    };

    fetchMessages();

    const channel = supabase.channel('realtime_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const msg = payload.new as Message;
        
        const { data: profile } = await supabase.from('profiles').select('full_name, reg_no, role').eq('id', msg.sender_id).single();
        msg.profiles = profile;

        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
        
        // Refresh recent chats if we get a new DM
        if (msg.chat_type === 'direct') fetchRecentChats();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChat, user, userProfile]);

  // 2. Fetch Recent Direct Messages List
  const fetchRecentChats = async () => {
    if (!user) return;
    
    // Fetch all DMs involving the current user to find unique chat partners
    const { data } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, sender:sender_id(id, full_name, reg_no, role), receiver:receiver_id(id, full_name, reg_no, role)')
      .eq('chat_type', 'direct')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (data) {
      const partnersMap = new Map();
      data.forEach((msg: any) => {
        // Determine who the *other* person is in the conversation
        const partner = msg.sender_id === user.id ? msg.receiver : msg.sender;
        // If it's a valid partner we haven't added yet (Map guarantees uniqueness), add them!
        if (partner && !partnersMap.has(partner.id)) {
          partnersMap.set(partner.id, partner);
        }
      });
      setRecentChats(Array.from(partnersMap.values()));
    }
  };

  useEffect(() => {
    fetchRecentChats();
  }, [user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 3. Advanced Search (Reg No or Name)
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const searchUsers = async () => {
      const { data } = await supabase.from('profiles')
        .select('id, full_name, reg_no, role')
        .or(`reg_no.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .neq('id', user.id) 
        .limit(10);
      if (data) setSearchResults(data);
    };
    searchUsers();
  }, [searchQuery]);

  // 4. Send Message Handler (Instant UI Update)
  const handleSendMessage = async (e?: React.FormEvent, fileUrl?: string, mediaType: 'text'|'image'|'audio' = 'text') => {
    e?.preventDefault();
    const contentToSend = fileUrl || newMessage.trim();
    if (!contentToSend) return;

    setNewMessage(""); 

    try {
      const { data, error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: activeChat.type === 'direct' ? activeChat.peerId : null,
        chat_type: activeChat.type,
        target_faculty: activeChat.type === 'class' ? userProfile.faculty.split(' - ')[0] : null,
        target_batch: activeChat.type === 'class' ? userProfile.batch : null,
        content: contentToSend,
        media_type: mediaType
      }).select(`*, profiles:sender_id(full_name, reg_no, role)`).single();

      if (error) throw error;

      if (data) {
        setMessages(prev => [...prev, data as Message]);
        scrollToBottom();
        // If it's a new DM, refresh the sidebar
        if (activeChat.type === 'direct') fetchRecentChats();
      }
    } catch (err) {
      alert("Failed to send message.");
    }
  };

  // 5. Delete Functions
  const handleDeleteMessage = async (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    await supabase.from('messages').delete().eq('id', msgId);
  };

  const handleClearChat = async () => {
    if (activeChat.type !== 'direct') {
      alert("You can only clear Direct Message histories.");
      return;
    }
    if (!confirm("Delete all messages in this chat? This will remove them for both users.")) return;

    setMessages([]); 
    await supabase.from('messages').delete()
      .eq('chat_type', 'direct')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChat.peerId}),and(sender_id.eq.${activeChat.peerId},receiver_id.eq.${user.id})`);
    
    fetchRecentChats(); // Update sidebar
  };

  // 6. File Upload (Images)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB to conserve campus bandwidth.");
      return;
    }

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;

    try {
      const { error } = await supabase.storage.from('chat_media').upload(`images/${fileName}`, file);
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('chat_media').getPublicUrl(`images/${fileName}`);
      await handleSendMessage(undefined, publicUrlData.publicUrl, 'image');
    } catch (err) {
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  // Call Initiation
  const initiateCall = () => {
    let roomHash = '';
    if (activeChat.type === 'direct') {
      roomHash = [user.id, activeChat.peerId].sort().join('-');
    } else if (activeChat.type === 'class') {
      roomHash = `class-${userProfile.faculty.split(' - ')[0]}-${userProfile.batch}`.replace(/\s+/g, '');
    } else {
      roomHash = 'global-campus-lobby';
    }
    router.push(`/study-room/call-${roomHash}`);
  };

  if (authLoading || !userProfile) return <PageLoader text="Connecting to Secure Network..." />;

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* --- LEFT SIDEBAR (CHATS & SEARCH) --- */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-800 flex flex-col bg-slate-950/80 backdrop-blur-xl z-20 shrink-0">
        
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search Name or Reg No..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
          
          {searchQuery && (
            <div className="mb-4">
              <p className="px-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Directory Results</p>
              {searchResults.length === 0 ? (
                <p className="px-2 text-sm text-slate-600">No registered students found.</p>
              ) : (
                searchResults.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => {
                      setActiveChat({ id: `direct_${s.id}`, name: s.full_name, type: 'direct', peerId: s.id });
                      setSearchQuery(""); 
                    }}
                    className="w-full text-left p-3 rounded-xl flex items-center gap-3 hover:bg-slate-900 transition-colors"
                  >
                    <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                      <UserCircle size={20} />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="font-bold text-sm truncate">{s.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">Reg: {s.reg_no || "Faculty"}</p>
                    </div>
                  </button>
                ))
              )}
              <hr className="border-slate-800 my-4 mx-2" />
            </div>
          )}

          <p className="px-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Pinned</p>
          
          <button 
            onClick={() => setActiveChat({ id: 'global', name: 'Global Campus', type: 'global' })}
            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${activeChat.id === 'global' ? 'bg-blue-600/10 border border-blue-500/20' : 'hover:bg-slate-900'}`}
          >
            <div className="h-12 w-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center shrink-0">
              <Globe size={24} />
            </div>
            <div>
              <p className="font-bold text-sm text-white">Global Campus</p>
              <p className="text-xs text-blue-400 font-medium">Broadcast to everyone</p>
            </div>
          </button>

          <button 
            onClick={() => setActiveChat({ id: 'class', name: `${userProfile.faculty.split(' - ')[0]} ${userProfile.batch}`, type: 'class' })}
            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${activeChat.id === 'class' ? 'bg-orange-600/10 border border-orange-500/20' : 'hover:bg-slate-900'}`}
          >
            <div className="h-12 w-12 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center shrink-0">
              <GraduationCap size={24} />
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-white truncate">{userProfile.batch} Chat</p>
              <p className="text-xs text-orange-400 font-medium truncate">{userProfile.faculty.split(' - ')[0]}</p>
            </div>
          </button>

          {/* --- NEW: RECENT DIRECT MESSAGES --- */}
          <div className="pt-4 mt-2">
             <p className="px-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Direct Messages</p>
             {recentChats.length === 0 ? (
               <p className="px-2 text-xs text-slate-600">No recent chats.</p>
             ) : (
               recentChats.map(partner => (
                 <button 
                    key={partner.id}
                    onClick={() => setActiveChat({ id: `direct_${partner.id}`, name: partner.full_name, type: 'direct', peerId: partner.id })}
                    className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${activeChat.id === `direct_${partner.id}` ? 'bg-slate-800 border border-slate-700' : 'hover:bg-slate-900'}`}
                  >
                    <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                      <UserCircle size={20} />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="font-bold text-sm text-white truncate">{partner.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">Reg: {partner.reg_no || "Faculty"}</p>
                    </div>
                  </button>
               ))
             )}
          </div>

        </div>
      </div>

      {/* --- RIGHT PANEL (ACTIVE CHAT) --- */}
      <div className="flex-1 flex flex-col relative bg-slate-950 pb-20 md:pb-0">
        
        {/* Chat Header */}
        <div className="h-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-20 shrink-0">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 shrink-0">
              {activeChat.type === 'global' ? <Globe /> : activeChat.type === 'class' ? <GraduationCap /> : <UserCircle />}
            </div>
            <div className="overflow-hidden pr-2">
              <h2 className="font-bold text-base md:text-lg leading-tight truncate">{activeChat.name}</h2>
              <p className="text-xs text-slate-500 uppercase tracking-wider truncate">{activeChat.type} Chat</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={initiateCall} className="h-10 w-10 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <Phone size={18} fill="currentColor" />
            </button>
            
            {activeChat.type === 'direct' && (
               <button onClick={handleClearChat} className="h-10 w-10 bg-slate-900 text-slate-400 border border-slate-800 rounded-full flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all">
                 <Trash2 size={18} />
               </button>
            )}
          </div>
        </div>

        {/* Messages View */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <MessageCircle size={48} className="mb-4 opacity-50" />
              <p>No messages here yet.</p>
              <p className="text-xs mt-1">Messages auto-delete after 7 days.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender_id === user.id;
              const showName = !isMe && (idx === 0 || messages[idx - 1].sender_id !== msg.sender_id);

              return (
                <div key={msg.id} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                  {showName && activeChat.type !== 'direct' && (
                    <span className="text-xs font-bold text-slate-400 mb-1 ml-1 flex items-center gap-1">
                      {msg.profiles?.full_name} 
                      {msg.profiles?.role === 'admin' && <span className="bg-purple-500/20 text-purple-400 px-1 rounded text-[8px] uppercase">Admin</span>}
                    </span>
                  )}
                  
                  <div className="flex items-center gap-2 max-w-[85%] md:max-w-[75%]">
                    {isMe && (
                       <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 transition-all shrink-0">
                          <Trash2 size={14} />
                       </button>
                    )}

                    <div className={`px-4 py-3 rounded-2xl w-full ${
                      isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                    }`}>
                      {msg.media_type === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={msg.content} alt="Attachment" className="max-w-full rounded-lg cursor-pointer max-h-64 object-cover" onClick={() => window.open(msg.content, '_blank')} />
                      ) : msg.media_type === 'audio' ? (
                        <audio controls src={msg.content} className="max-w-full h-10" />
                      ) : (
                        <p className="break-words leading-relaxed text-sm md:text-base">{msg.content}</p>
                      )}
                    </div>
                  </div>
                  
                  <span className={`text-[10px] text-slate-600 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-4 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 z-20 shrink-0">
          <form onSubmit={(e) => handleSendMessage(e)} className="flex items-end gap-2 bg-slate-900 border border-slate-800 p-1.5 md:p-2 rounded-2xl">
            
            <label className="p-2.5 md:p-3 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors shrink-0">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
              {isUploading ? <Loader2 size={22} className="animate-spin" /> : <ImageIcon size={22} />}
            </label>

            <button type="button" onClick={() => alert("Voice notes require HTTPS setup and the MediaRecorder API. Use image attachments for now!")} className="p-2.5 md:p-3 text-slate-400 hover:text-orange-400 hover:bg-slate-800 rounded-xl transition-colors shrink-0 hidden md:block">
              <Mic size={22} />
            </button>

            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none text-white focus:outline-none focus:ring-0 py-2.5 md:py-3 px-2 text-sm md:text-base placeholder:text-slate-600"
            />

            <button 
              type="submit" 
              disabled={!newMessage.trim() || isUploading}
              className="p-2.5 md:p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Send size={20} className="translate-x-0.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}