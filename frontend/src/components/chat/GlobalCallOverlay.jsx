import { AnimatePresence, motion } from "framer-motion";
import { Phone, Video as VideoIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import useWebRTC from "@/hooks/useWebRTC";
import socket from "@/utils/socket";
import { useEffect, useState } from "react";

export default function GlobalCallOverlay() {
  const { user } = useAuth();
  const [isEnding, setIsEnding] = useState(false);
  
  // Register globally
  useEffect(() => {
    if (user?._id) {
       socket.emit("register_user", user._id);
    }
  }, [user?._id]);

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
    rejectCall
  } = useWebRTC(socket, user?._id, null);

  useEffect(() => {
    // Reset ending indicator state if component resets/closes
    if (!isCalling && !receivingCall) setIsEnding(false);
  }, [isCalling, receivingCall]);

  const handleEndCall = () => {
    setIsEnding(true);
    endCall();
  };

  const handleRejectCall = () => {
    setIsEnding(true);
    rejectCall();
  };

  useEffect(() => {
    const handleInitCall = (e) => {
      const { otherUserId, type } = e.detail;
      // We manually override otherUserId in useWebRTC or pass it down dynamically
      // But useWebRTC takes otherUserId as a generic param, so we might need a small patch
      // For now, emit a local init trigger:
      initCall(type, otherUserId);
    };

    window.addEventListener("init_call", handleInitCall);
    return () => window.removeEventListener("init_call", handleInitCall);
  }, [initCall]);

  if (!isCalling && !receivingCall && !callAccepted) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="call-overlay"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6"
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
              <p className="text-slate-400 font-medium">{receivingCall && !callAccepted ? 'Incoming Call...' : 'Connected'}</p>
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
                  disabled={isEnding}
                  className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                >
                  <Phone className="w-8 h-8" />
                </Button>
                <Button
                  onClick={handleRejectCall}
                  disabled={isEnding}
                  className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20 disabled:opacity-50"
                >
                  <X className="w-8 h-8" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleEndCall}
                disabled={isEnding}
                className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20 disabled:opacity-50"
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
                <span className="text-white font-bold">Calling...</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
