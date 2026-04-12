import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { 
  MessageSquare, User, Search, 
  Send, Image as ImageIcon, FileText, 
  Video, MoreVertical, Phone, Video as VideoIcon,
  ChevronLeft, Loader2, CheckCircle2,
  X, Maximize2, Download
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import socket from "@/utils/socket";

export default function ConsultationChats() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [acceptType, setAcceptType] = useState("*");
  const scrollRef = useRef();
  const fileInputRef = useRef(null);

  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ["my-consultation-chats", user?._id],
    queryFn: async () => {
      const response = await api.get("/chat/my-chats");
      return response.data || [];
    },
  });

  const { data: initialMessages } = useQuery({
    queryKey: ["chat-messages", selectedChat?._id],
    queryFn: async () => {
      const response = await api.get(`/chat/messages/${selectedChat._id}`);
      return response.data;
    },
    enabled: !!selectedChat?._id,
  });

  // Mark chat as read when opened
  useEffect(() => {
    if (!selectedChat?._id) return;
    const markRead = async () => {
      await api.put(`/chat/messages/${selectedChat._id}/read`);
      queryClient.invalidateQueries(["my-consultation-chats"]);
    };
    markRead();
  }, [selectedChat?._id, queryClient]);

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!selectedChat?._id) return;
    socket.emit("join_chat", selectedChat._id);
    const onMsg = (newMsg) => {
      if (newMsg.chatId === selectedChat._id) {
        setMessages((prev) => {
          if (prev.find(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        // Mark read instantly if active
        api.put(`/chat/messages/${selectedChat._id}/read`);
      } else {
        // Different chat got message, invalidate to update badge count
        queryClient.invalidateQueries(["my-consultation-chats"]);
      }
    };
    socket.on("receive_message", onMsg);
    return () => socket.off("receive_message", onMsg);
  }, [selectedChat?._id, queryClient]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSend = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !selectedChat) return;
    try {
      const res = await api.post("/chat/messages", { 
        chatId: selectedChat._id, 
        message: msgInput, 
        type: "text" 
      });
      // Append immediately to eliminate echo
      setMessages(prev => {
        if (prev.find(m => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
      socket.emit("send_message", { ...res.data, chatId: selectedChat._id });
      setMsgInput("");
    } catch (err) {
      toast({ title: "Message Failed", variant: "destructive" });
    }
  };

  const initGlobalCall = (type) => {
    const otherParticipant = getOtherParticipant(selectedChat);
    if (!otherParticipant) return;
    window.dispatchEvent(new CustomEvent("init_call", { 
      detail: { otherUserId: otherParticipant._id, type }
    }));
  };

  const triggerFileUpload = (type) => {
    switch(type) {
      case 'image': setAcceptType('image/*'); break;
      case 'video': setAcceptType('video/*'); break;
      case 'pdf': setAcceptType('application/pdf'); break;
      default: setAcceptType('*');
    }
    setShowAttachmentMenu(false);
    // Timeout to ensure state updates accept attribute before click
    setTimeout(() => {
      if (fileInputRef.current) fileInputRef.current.click();
    }, 0);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isVideo && !isPdf) {
      toast({ title: "Unsupported File", description: "Please upload a valid Image, Video, or PDF.", variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 50MB.", variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPreview({ name: file.name, type: isPdf ? 'pdf' : isVideo ? 'video' : 'image', loading: true });

    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.post("/chat/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Clear input value so same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";

      const res = await api.post("/chat/messages", {
        chatId: selectedChat._id,
        type: uploadRes.data.type,
        fileUrl: uploadRes.data.url,
        fileName: uploadRes.data.name,
      });

      setMessages((prev) => {
        if (prev.find(m => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
      socket.emit("send_message", { ...res.data, chatId: selectedChat._id });
      setPreview(null);
    } catch (err) {
      console.error(err);
      toast({ title: "Upload Failed", description: "Something went wrong during upload. Please try again.", variant: "destructive" });
      setPreview(null);
    }
  };

  const downloadFile = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredChats = chats?.filter(chat => {
    const other = chat.participants.find(p => p._id !== user?._id);
    return other?.fullName?.toLowerCase().includes(search.toLowerCase());
  });

  const getOtherParticipant = (chat) => chat?.participants.find(p => p._id !== user?._id);

  const totalUnread = chats?.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0) || 0;

  const MessageBubble = ({ m }) => {
    const isMe = m.senderId === user?._id;
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`flex ${isMe ? "justify-end" : "justify-start"} mb-6 relative group`}
      >
        <div className={`max-w-[85%] md:max-w-[70%] transition-colors duration-300 p-5 relative border ${
          isMe 
            ? "bg-primary text-white rounded-t-[2rem] rounded-bl-[2rem] shadow-lg shadow-primary/10 border-primary" 
            : "bg-white text-slate-800 rounded-t-[2rem] rounded-br-[2rem] border border-slate-100 shadow-sm"
        }`}>
          {m.type === "text" && <p className="text-sm font-medium leading-relaxed">{m.message}</p>}
          
          {m.type === "image" && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden cursor-zoom-in group/img border border-slate-200" onClick={() => setSelectedMedia(m)}>
                <img src={m.fileUrl} alt="sent" className="w-full max-h-80 object-cover hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="text-white w-8 h-8" />
                </div>
              </div>
              <Button variant="outline" size="sm" className={`w-full rounded-xl text-xs h-10 ${isMe ? "bg-white/10 text-white hover:bg-white/20 border-white/20" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`} onClick={() => downloadFile(m.fileUrl, m.fileName)}>
                <Download className="w-4 h-4 mr-2" /> Save Image
              </Button>
            </div>
          )}

          {m.type === "video" && (
            <div className="space-y-3 min-w-[280px]">
              <video controls className="w-full rounded-2xl bg-black shadow-lg">
                <source src={m.fileUrl} />
              </video>
              <Button variant="outline" size="sm" className={`w-full rounded-xl text-xs h-10 ${isMe ? "bg-white/10 text-white hover:bg-white/20 border-white/20" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`} onClick={() => downloadFile(m.fileUrl, m.fileName)}>
                <Download className="w-4 h-4 mr-2" /> Save Video
              </Button>
            </div>
          )}

          {m.type === "pdf" && (
            <div className={`flex flex-col gap-4 p-4 rounded-2xl border ${isMe ? "bg-white/10 border-white/20" : "bg-slate-50 border-slate-200"}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${isMe ? "text-white" : "text-slate-800"}`}>{m.fileName || "document.pdf"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="ghost" className={`rounded-xl h-10 text-xs font-bold gap-2 ${isMe ? "text-white hover:bg-white/10 border-white/20" : "text-slate-700 hover:bg-slate-200"}`} onClick={() => window.open(m.fileUrl, '_blank')}>
                  <Maximize2 className="w-4 h-4" /> Open (New Tab)
                </Button>
                <Button size="sm" className={`rounded-xl h-10 text-xs font-bold gap-2 ${isMe ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-white hover:bg-primary/90"}`} onClick={() => downloadFile(m.fileUrl, m.fileName)}>
                  <Download className="w-4 h-4" /> Save
                </Button>
              </div>
            </div>
          )}

          <span className={`text-[9px] font-black uppercase tracking-widest mt-2 block opacity-50 ${isMe ? "text-right text-white/80" : "text-left text-slate-400"}`}>
            {format(new Date(m.createdAt), 'hh:mm a')}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <DashboardLayout role={user?.role}>
      <div className="max-w-[1400px] mx-auto h-[calc(100vh-120px)] bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex">
        
        {/* Left Sidebar - Chat List */}
        <aside className={`w-full md:w-[320px] border-r border-slate-50 flex flex-col bg-slate-50/30 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 space-y-5">
             <div className="flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                     Messages 
                     {totalUnread > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{totalUnread}</span>}
                   </h2>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Clinical Discussions</p>
                </div>
             </div>
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Search..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 pl-12 rounded-2xl border-none bg-white shadow-sm focus:ring-primary/20 font-bold text-sm"
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-8 custom-scrollbar">
             {chatsLoading ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-300">
                  <Loader2 className="w-8 h-8 animate-spin" />
               </div>
             ) : filteredChats?.length === 0 ? (
               <div className="text-center py-20">
                  <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Active Channels</p>
               </div>
             ) : (
               filteredChats.map((chat) => {
                 const other = getOtherParticipant(chat);
                 const isActive = selectedChat?._id === chat._id;
                 const hasUnread = chat.unreadCount > 0;

                 return (
                   <motion.div 
                     key={chat._id}
                     onClick={() => setSelectedChat(chat)}
                     whileHover={{ x: 5 }}
                     className={`p-4 rounded-[1.5rem] cursor-pointer transition-all flex items-center gap-4 ${
                       isActive ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-transparent hover:bg-white text-slate-600'
                     }`}
                   >
                     <div className="relative">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                         isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-400'
                       }`}>
                         {other?.fullName?.charAt(0)}
                       </div>
                       <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-0.5">
                          <p className="font-black text-sm truncate">{other?.fullName}</p>
                          <span className={`text-[9px] font-bold uppercase opacity-50 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                            {chat.lastMessage ? format(new Date(chat.updatedAt), 'HH:mm') : ''}
                          </span>
                       </div>
                       <div className="flex items-center justify-between">
                         <p className={`text-xs truncate max-w-[140px] pr-2 ${hasUnread && !isActive ? 'font-bold text-slate-800' : isActive ? 'text-white/70' : 'text-slate-400'}`}>
                           {chat.lastMessage?.message || (chat.lastMessage?.type === 'image' ? 'Sent an image' : chat.lastMessage?.type === 'pdf' ? 'Sent a document' : 'Started session')}
                         </p>
                         {hasUnread && !isActive && (
                           <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 animate-pulse shadow-lg shadow-red-500/20">
                             {chat.unreadCount}
                           </span>
                         )}
                       </div>
                     </div>
                   </motion.div>
                 );
               })
             )}
          </div>
        </aside>

        {/* Right Section - Active Chat */}
        <main className={`flex-1 flex flex-col bg-white border-l border-slate-50 ${!selectedChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
          {!selectedChat ? (
            <div className="text-center space-y-6 max-w-sm px-10">
               <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                  <MessageSquare className="w-10 h-10 text-slate-200" />
               </div>
               <div>
                 <h3 className="text-2xl font-black text-slate-900">Secure Protocol</h3>
                 <p className="text-slate-400 text-sm font-medium mt-2 leading-relaxed">
                   Select a clinical interaction from the left sidebar to begin end-to-end encrypted synchronization.
                 </p>
               </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <header className="px-8 py-5 flex items-center justify-between border-b border-slate-50 bg-white/50 backdrop-blur-md">
                 <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={() => setSelectedChat(null)}>
                       <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-slate-900/10">
                       {getOtherParticipant(selectedChat)?.fullName?.charAt(0)}
                    </div>
                    <div>
                       <h4 className="font-black text-slate-900 tracking-tight leading-tight">{getOtherParticipant(selectedChat)?.fullName}</h4>
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Secure Session
                       </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => initGlobalCall('audio')}><Phone className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => initGlobalCall('video')}><VideoIcon className="w-5 h-5" /></Button>
                    <div className="h-6 w-px bg-slate-100 mx-2" />
                    <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => setSelectedChat(null)}><X className="w-5 h-5" /></Button>
                 </div>
              </header>

              {/* Chat Body */}
              <div className="flex-1 overflow-y-auto px-6 py-8 bg-slate-50/50 custom-scrollbar">
                 <AnimatePresence>
                   {messages.map((m, i) => <MessageBubble key={m._id || `msg-${i}`} m={m} />)}
                 </AnimatePresence>
                 <div ref={scrollRef} className="h-4" />
              </div>

              {/* Input Area */}
              <footer className="px-8 py-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                {preview && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-4 p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-dashed border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm border border-slate-100">
                          {preview.loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                           preview.type === 'pdf' ? <FileText className="w-5 h-5 text-red-500" /> : 
                           preview.type === 'video' ? <Video className="w-5 h-5 text-blue-500" /> : 
                           <ImageIcon className="w-5 h-5" />}
                       </div>
                       <div>
                          <p className="text-xs font-black text-slate-700 truncate max-w-[180px]">{preview.name}</p>
                          <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400">{preview.loading ? "Uploading..." : "Ready"}</p>
                       </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setPreview(null)} className="rounded-full w-8 h-8 hover:bg-white text-slate-400">
                       <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
                
                <form onSubmit={onSend} className="flex items-center gap-3">
                   <div className="relative flex gap-2">
                     <Input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept={acceptType} />
                     <Button type="button" variant="ghost" size="icon" onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} className={`h-12 w-12 rounded-[1.25rem] transition-all shadow-sm flex-shrink-0 border ${showAttachmentMenu ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-800'}`}>
                       <MoreVertical className="w-5 h-5" />
                     </Button>
                     
                     <AnimatePresence>
                       {showAttachmentMenu && (
                         <>
                           <div className="fixed inset-0 z-40" onClick={() => setShowAttachmentMenu(false)} />
                           <motion.div 
                             initial={{ opacity: 0, y: 10, scale: 0.95 }}
                             animate={{ opacity: 1, y: 0, scale: 1 }}
                             exit={{ opacity: 0, y: 10, scale: 0.95 }}
                             className="absolute bottom-full left-0 mb-4 z-50 min-w-[200px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 overflow-hidden"
                           >
                             <div className="flex flex-col gap-1">
                               <button type="button" onClick={() => triggerFileUpload('image')} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-2xl transition-colors text-left group">
                                 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                   <ImageIcon className="w-5 h-5" />
                                 </div>
                                 <span className="font-bold text-sm text-slate-700">Send Image</span>
                               </button>
                               <button type="button" onClick={() => triggerFileUpload('video')} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-2xl transition-colors text-left group">
                                 <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                   <Video className="w-5 h-5" />
                                 </div>
                                 <span className="font-bold text-sm text-slate-700">Send Video</span>
                               </button>
                               <button type="button" onClick={() => triggerFileUpload('pdf')} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-2xl transition-colors text-left group">
                                 <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                                   <FileText className="w-5 h-5" />
                                 </div>
                                 <span className="font-bold text-sm text-slate-700">Send PDF</span>
                               </button>
                             </div>
                           </motion.div>
                         </>
                       )}
                     </AnimatePresence>
                   </div>
                   <Input 
                    placeholder="Type clinical synchronization..." 
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    className="h-12 flex-1 rounded-[1.25rem] border border-slate-100 bg-white font-bold px-6 shadow-sm focus-visible:ring-primary/20 text-sm"
                   />
                   <Button type="submit" disabled={!msgInput.trim() && !preview} className="h-12 w-12 rounded-[1.25rem] bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all flex-shrink-0">
                      <Send className="w-5 h-5" />
                   </Button>
                </form>
              </footer>
            </>
          )}
        </main>
      </div>

      <AnimatePresence>
        {selectedMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6"
          >
            <button className="absolute top-10 right-10 text-white/30 hover:text-white transition-all" onClick={() => setSelectedMedia(null)}>
              <X className="w-12 h-12" />
            </button>
            <div className="max-w-5xl w-full flex flex-col items-center justify-center">
              <img src={selectedMedia.fileUrl} className="max-h-[80vh] w-auto rounded-[2rem] shadow-2xl border-8 border-white/10" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
