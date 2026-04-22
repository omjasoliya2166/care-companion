import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, Image as ImageIcon, FileText, Video, 
  Download, Maximize2, X, MoreVertical, User, 
  Trash2, AlertCircle, Phone, Video as VideoIcon,
  ChevronDown, File, Check, Loader2, MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import useWebRTC from "@/hooks/useWebRTC";
import BackButton from "@/components/ui/BackButton";

const socket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000", {
  transports: ["websocket"],
  autoConnect: true
});

const downloadFile = async (url, name) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = name || "download";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed:", error);
    // Fallback to opening in new window if fetch fails
    window.open(url, "_blank");
  }
};

const MessageBubble = ({ m, isMe, alignRight, sender, otherParticipant, userRole, onSelectMedia, onDownload }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${alignRight ? "justify-end" : "justify-start"} mb-6 relative group`}
    >
      <div className={`max-w-[85%] md:max-w-[70%] transition-colors duration-300 ${
        alignRight 
          ? "bg-primary text-primary-foreground rounded-t-[2rem] rounded-bl-[2rem] shadow-lg shadow-primary/10" 
          : "bg-card text-foreground rounded-t-[2rem] rounded-br-[2rem] border border-border shadow-sm"
      } p-5 relative`}>
         <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-2 opacity-80 ${alignRight ? "text-right" : "text-left"}`}>
           {userRole === 'admin' ? `${sender?.fullName || 'Participant'} (${sender?.role || 'Unknown'})` : isMe ? "Sent by You" : `${otherParticipant?.fullName || "Recipient"}`}
         </p>
         
         {m.type === "text" && <p className="text-sm md:text-base font-medium leading-relaxed">{m.message}</p>}
         
         {m.type === "image" && (
           <div className="space-y-3">
             <div className="relative rounded-2xl overflow-hidden cursor-zoom-in group/img border border-border/50" onClick={() => onSelectMedia(m)}>
               <img src={m.fileUrl} alt="sent" className="w-full max-h-80 object-cover hover:scale-105 transition-transform duration-500" />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="text-white w-8 h-8" />
               </div>
             </div>
              <Button variant="outline" size="sm" className={`w-full rounded-xl border-border/20 text-xs h-10 ${alignRight ? "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20" : "bg-muted text-foreground hover:bg-muted/80"}`} onClick={() => onDownload(m.fileUrl, m.fileName)}>
                <Download className="w-4 h-4 mr-2" /> Download Image
              </Button>
           </div>
         )}

         {m.type === "video" && (
           <div className="space-y-3 min-w-[300px]">
             <video controls className="w-full rounded-2xl bg-black shadow-2xl">
               <source src={m.fileUrl} />
             </video>
              <Button variant="outline" size="sm" className={`w-full rounded-xl border-border/20 text-xs h-10 ${alignRight ? "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20" : "bg-muted text-foreground hover:bg-muted/80"}`} onClick={() => onDownload(m.fileUrl, m.fileName)}>
                <Download className="w-4 h-4 mr-2" /> Download Video
              </Button>
           </div>
         )}

          {m.type === "pdf" && (
            <div className={`flex flex-col gap-4 p-4 rounded-2xl border ${alignRight ? "bg-white/10 border-white/20" : "bg-muted/30 border-border shadow-inner"}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 shadow-sm border border-red-500/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                   <p className={`font-bold text-sm truncate ${alignRight ? "text-white" : "text-foreground"}`}>{m.fileName || "document.pdf"}</p>
                   <p className={`text-[10px] uppercase font-black tracking-widest ${alignRight ? "text-white/60" : "text-muted-foreground"}`}>PDF Archive</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className={`rounded-xl h-11 text-xs font-bold gap-2 transition-all ${alignRight ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-white border-border text-foreground hover:bg-muted shadow-sm"}`} 
                  onClick={() => window.open(m.fileUrl, '_blank')}
                >
                  <Maximize2 className="w-4 h-4" /> View Full File
                </Button>
                <Button 
                  size="sm" 
                  className={`rounded-xl h-11 text-xs font-bold gap-2 shadow-lg transition-all ${alignRight ? "bg-white text-primary hover:bg-slate-100" : "bg-primary text-white hover:bg-primary/90"}`} 
                  onClick={() => onDownload(m.fileUrl, m.fileName)}
                >
                  <Download className="w-4 h-4" /> Download
                </Button>
              </div>
            </div>
          )}
         <span className={`text-[9px] font-black uppercase opacity-80 mt-3 block ${alignRight ? "text-right" : "text-left"}`}>
           {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </span>
      </div>
    </motion.div>
  );
};

export default function ChatPage() {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [preview, setPreview] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const scrollRef = useRef();

  const { data: chat, isLoading: chatLoading } = useQuery({
    queryKey: ["chat", appointmentId],
    queryFn: async () => {
      const response = await api.get(`/chat/${appointmentId}`);
      return response.data;
    },
  });

  // Find other participant
  const otherParticipant = chat?.participants?.find(p => p._id !== user._id);
  
  const {
    localVideo,
    remoteVideo,
    isCalling,
    callAccepted,
    receivingCall,
    callType,
    initCall,
    answerCall,
    endCall,
  } = useWebRTC(socket, user?._id, otherParticipant?._id);

  const { data: initialMessages } = useQuery({
    queryKey: ["messages", chat?._id],
    queryFn: async () => {
      const response = await api.get(`/chat/messages/${chat._id}`);
      return response.data;
    },
    enabled: !!chat?._id,
  });

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!chat?._id) return;

    socket.emit("register_user", user._id);
    socket.emit("join_chat", chat._id);

    const onMessage = (newMsg) => {
      setMessages((prev) => {
        if (prev.find(m => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
    };

    socket.on("receive_message", onMessage);
    return () => {
      socket.off("receive_message", onMessage);
    };
  }, [chat?._id, user._id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMsgMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/chat/messages", payload);
      return res.data;
    },
    onSuccess: (newMsg) => {
      // Avoid duplications if socket already handled it or state was updated optimistically
      setMessages((prev) => {
        if (prev.find(m => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      socket.emit("send_message", { ...newMsg, chatId: chat._id });
      setMsg("");
      setPreview(null);
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isVideo && !isPdf) {
      toast({ title: "Unsupported File", description: "Only Images, PDFs and videos are allowed.", variant: "destructive" });
      return;
    }

    setPreview({ name: file.name, type: isPdf ? 'pdf' : isVideo ? 'video' : 'image', loading: true });

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/chat/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      sendMsgMutation.mutate({
        chatId: chat._id,
        type: res.data.type,
        fileUrl: res.data.url,
        fileName: res.data.name,
      });
    } catch (err) {
      toast({ title: "Upload Failed", description: "Could not send file.", variant: "destructive" });
      setPreview(null);
    }
  };

  const onSend = (e) => {
    e.preventDefault();
    if (!msg.trim() || !chat?._id) return;
    sendMsgMutation.mutate({ chatId: chat._id, message: msg, type: "text" });
  };






  return (
    <DashboardLayout role={user?.role}>
      <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col transition-all duration-300">
        {/* Chat Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card border border-border rounded-t-[3rem] p-6 shadow-xl flex items-center justify-between transition-all duration-300"
        >
          <div className="flex items-center gap-5">
            <BackButton label="" variant="dark" className="bg-muted hover:bg-muted/80 h-12 w-12 flex items-center justify-center p-0 rounded-2xl" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl">
                 {user?.role === 'admin' ? "A" : otherParticipant?.fullName?.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-card shadow-sm" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground leading-tight tracking-tight">
                {user?.role === 'admin' 
                  ? `${chat?.participants?.find(p => p.role === 'doctor')?.fullName || 'Doctor'} & ${chat?.participants?.find(p => p.role === 'patient')?.fullName || 'Patient'}`
                  : otherParticipant?.fullName || "Syncing..."}
              </h2>
              <p className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2 mt-1 tracking-widest">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {user?.role === 'admin' ? 'Monitoring Session' : 'Secure Healthline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {user?.role !== 'admin' ? (
                <>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="rounded-2xl h-12 w-12 hover:bg-muted text-muted-foreground transition-all"
                     onClick={() => initCall('audio')}
                   >
                      <Phone className="w-5 h-5" />
                   </Button>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="rounded-2xl h-12 w-12 hover:bg-muted text-muted-foreground transition-all"
                     onClick={() => initCall('video')}
                   >
                      <VideoIcon className="w-5 h-5" />
                   </Button>
                   
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-muted text-muted-foreground transition-all">
                            <MoreVertical className="w-5 h-5" />
                         </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64 p-2 rounded-3xl shadow-2xl border border-border bg-card mt-2 mr-2">
                         <DropdownMenuItem className="rounded-2xl h-12 px-4 gap-3 cursor-pointer font-bold">
                            <User className="w-4 h-4 text-muted-foreground" /> Member Profile
                         </DropdownMenuItem>
                         <DropdownMenuItem className="rounded-2xl h-12 px-4 gap-3 cursor-pointer font-bold">
                            <Download className="w-4 h-4 text-muted-foreground" /> Media Archive
                         </DropdownMenuItem>
                         <DropdownMenuSeparator className="my-2" />
                         <DropdownMenuItem className="rounded-2xl h-12 px-4 gap-3 cursor-pointer text-destructive hover:bg-destructive/10 font-black uppercase text-[10px] tracking-widest">
                            <Trash2 className="w-4 h-4" /> Clear Discussion
                         </DropdownMenuItem>
                      </DropdownMenuContent>
                   </DropdownMenu>
                </>
             ) : (
                <Button 
                   variant="ghost" 
                   size="icon" 
                   className="rounded-2xl h-12 w-12 hover:bg-muted text-muted-foreground transition-all"
                   onClick={() => navigate('/admin/chats')}
                >
                   <X className="w-5 h-5" />
                </Button>
             )}
          </div>
        </motion.header>

        {/* Chat Body */}
        <div className="flex-1 bg-muted/20 border-x border-border overflow-y-auto p-6 md:p-10 custom-scrollbar transition-colors duration-300">
          <AnimatePresence>
            {messages.length === 0 ? (
              <div key="empty-state" className="h-full flex flex-col items-center justify-center text-center px-10">
                <div className="w-24 h-24 bg-card rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-6 border border-border">
                   <MessageSquare className="w-10 h-10 text-muted-foreground/20" />
                </div>
                <h3 className="text-xl font-black text-foreground tracking-tight">Clinical Gateway Ready</h3>
                <p className="text-muted-foreground text-sm mt-3 font-medium max-w-xs leading-relaxed italic">
                  Private communication initialized. All interactions are securely logged in clinical history.
                </p>
              </div>
            ) : (
              messages.map((m, i) => {
                const isMe = m.senderId === user?._id;
                const sender = chat?.participants?.find(p => p._id === m.senderId);
                const alignRight = user?.role === 'admin' ? (sender?.role === 'doctor') : isMe;
                return (
                  <MessageBubble 
                    key={m._id || `msg-${i}`} 
                    m={m} 
                    isMe={isMe}
                    alignRight={alignRight}
                    sender={sender}
                    otherParticipant={otherParticipant}
                    userRole={user?.role}
                    onSelectMedia={setSelectedMedia}
                    onDownload={downloadFile}
                  />
                );
              })
            )}
          </AnimatePresence>
          <div ref={scrollRef} className="h-2 w-full invisible" />
        </div>

        {/* Input Footer */}
        {user?.role !== 'admin' && (
          <footer className="bg-card border border-border rounded-b-[3rem] p-6 shadow-2xl transition-colors duration-300">
            {preview && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-6 p-4 bg-muted/50 rounded-2xl flex items-center justify-between border border-dashed border-border"
              >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center text-primary shadow-sm border border-border">
                      {preview.loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                       preview.type === 'pdf' ? <FileText className="w-6 h-6 text-red-500" /> : 
                       preview.type === 'video' ? <Video className="w-6 h-6 text-blue-500" /> : 
                       <ImageIcon className="w-6 h-6" />}
                   </div>
                   <div>
                      <p className="text-sm font-black text-foreground truncate max-w-[200px]">{preview.name}</p>
                      <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                        {preview.loading ? "Enciphering Payload..." : "Ready for Transmission"}
                      </p>
                   </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setPreview(null)} className="rounded-full">
                   <X className="w-5 h-5 text-muted-foreground" />
                </Button>
              </motion.div>
            )}

            <form onSubmit={onSend} className="flex items-center gap-4">
              <div className="flex gap-2">
                <label className="cursor-pointer group">
                  <Input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*,application/pdf" />
                  <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20">
                     <ImageIcon className="w-6 h-6" />
                  </div>
                </label>
              </div>
              <div className="flex-1 relative">
                <Input 
                  value={msg} 
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Synchronize clinical notes..." 
                  className="h-14 rounded-2xl border-border bg-muted/30 pl-6 pr-4 font-bold text-foreground focus:ring-primary/20 focus:bg-card transition-all"
                />
              </div>
              <Button type="submit" size="icon" className="w-14 h-14 rounded-[1.25rem] bg-primary text-white shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-60" disabled={!msg.trim() && !preview}>
                 <Send className="w-6 h-6" />
              </Button>
            </form>
          </footer>
        )}

        <AnimatePresence>
          {selectedMedia && (
            <motion.div 
              key="media-lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6"
            >
              <button className="absolute top-10 right-10 text-white/30 hover:text-white transition-all transform hover:rotate-90 duration-500" onClick={() => setSelectedMedia(null)}>
                <X className="w-14 h-14" />
              </button>
              
              <div className="max-w-7xl w-full h-full flex flex-col items-center justify-center gap-10">
                 <motion.div
                  initial={{ scale: 0.9, y: 30 }}
                  animate={{ scale: 1, y: 0 }}
                  className="relative group"
                 >
                    <img 
                      src={selectedMedia.fileUrl} 
                      className="max-h-[75vh] w-auto rounded-[3.5rem] shadow-2xl border-[12px] border-white/5"
                    />
                 </motion.div>
                 <div className="flex flex-col md:flex-row items-center gap-8 bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/10">
                    <div className="text-center md:text-left">
                       <p className="text-white font-black text-3xl tracking-tighter uppercase">{selectedMedia.fileName || "clinical_attachment.jpg"}</p>
                       <p className="text-white/40 text-xs font-black mt-2 tracking-[0.3em] uppercase">Secured Archive Disclosure</p>
                    </div>
                     <Button 
                       onClick={() => downloadFile(selectedMedia.fileUrl, selectedMedia.fileName)}
                       className="h-16 px-12 rounded-3xl bg-foreground text-background dark:bg-slate-800 dark:text-foreground hover:bg-primary hover:text-white transition-all duration-500 font-extrabold gap-4 shadow-2xl text-lg"
                     >
                       <Download className="w-6 h-6" /> LOCAL SAVE
                     </Button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(isCalling || receivingCall || callAccepted) && (
            <motion.div
              key="call-overlay"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6"
            >
              <div className="relative w-full max-w-4xl aspect-video bg-black rounded-[3rem] overflow-hidden shadow-2xl border border-white/10">
                {/* Remote Video/Audio */}
                {callType === 'video' ? (
                  <video
                    ref={remoteVideo}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-800 to-slate-900">
                    <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                      <Phone className="w-16 h-16 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black text-white">Audio Call in Progress</h2>
                    <p className="text-slate-400 font-medium">Connecting with {otherParticipant?.fullName}...</p>
                    <audio ref={remoteVideo} autoPlay />
                  </div>
                )}

                {/* Local Video Thumbnail */}
                {callType === 'video' && (
                  <div className="absolute bottom-6 right-6 w-48 aspect-video bg-slate-800 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
                    <video
                      ref={localVideo}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  </div>
                )}

                {/* Call Controls */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
                  {receivingCall && !callAccepted ? (
                    <>
                      <Button
                        onClick={answerCall}
                        className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                      >
                        <Phone className="w-8 h-8" />
                      </Button>
                      <Button
                        onClick={endCall}
                        className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20"
                      >
                        <X className="w-8 h-8" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={endCall}
                      className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20"
                    >
                      <X className="w-8 h-8" />
                    </Button>
                  )}
                </div>

                {/* Status Overlay */}
                {!callAccepted && isCalling && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/10 flex items-center gap-4">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                      <span className="text-white font-bold">Calling {otherParticipant?.fullName}...</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
