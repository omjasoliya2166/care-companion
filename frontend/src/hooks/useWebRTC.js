import { useState, useEffect, useRef, useCallback } from "react";

export default function useWebRTC(socket, userId, otherUserId) {
  const [isCalling, setIsCalling] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState(null);
  const [callerSignal, setCallerSignal] = useState(null);
  const [callType, setCallType] = useState(null); // 'audio' or 'video'
  const [activeOtherUserId, setActiveOtherUserId] = useState(otherUserId);

  const localVideo = useRef();
  const remoteVideo = useRef();
  const connectionRef = useRef();
  const streamRef = useRef();

  const handleIceCandidate = useCallback((event) => {
    if (event.candidate) {
      socket.emit("ice_candidate", { to: activeOtherUserId, candidate: event.candidate });
    }
  }, [socket, activeOtherUserId]);

  const handleTrack = useCallback((event) => {
    if (remoteVideo.current) {
      remoteVideo.current.srcObject = event.streams[0];
    }
  }, []);

  const initCall = async (type = 'video', dynamicOtherUserId = null) => {
    setCallType(type);
    setIsCalling(true);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === 'video',
      audio: true,
    });
    streamRef.current = stream;
    if (localVideo.current) localVideo.current.srcObject = stream;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun1.l.google.com:19302" }],
    });

    peer.onicecandidate = handleIceCandidate;
    peer.ontrack = handleTrack;
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    
    const targetId = dynamicOtherUserId || otherUserId;
    setActiveOtherUserId(targetId);
    
    socket.emit("call_user", {
      userToCall: targetId,
      signalData: offer,
      from: userId,
      name: "New Caller",
      callType: type
    });

    connectionRef.current = peer;
  };

  const answerCall = async () => {
    setCallAccepted(true);
    setReceivingCall(false);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: callType === 'video',
      audio: true,
    });
    streamRef.current = stream;
    if (localVideo.current) localVideo.current.srcObject = stream;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun1.l.google.com:19302" }],
    });

    peer.onicecandidate = handleIceCandidate;
    peer.ontrack = handleTrack;
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    await peer.setRemoteDescription(new RTCSessionDescription(callerSignal));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("answer_call", { signal: answer, to: caller });
    connectionRef.current = peer;
  };

  const endCall = () => {
    socket.emit("end_call", { to: activeOtherUserId || caller });
    cleanup();
  };

  const rejectCall = () => {
    socket.emit("reject_call", { to: activeOtherUserId || caller });
    cleanup();
  };

  const cleanup = () => {
    setCallAccepted(false);
    setIsCalling(false);
    setReceivingCall(false);
    setCaller(null);
    setCallerSignal(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
  };

  useEffect(() => {
    socket.on("incoming_call", ({ signal, from, name, callType }) => {
      setReceivingCall(true);
      setCaller(from);
      setActiveOtherUserId(from);
      setCallerSignal(signal);
      setCallType(callType || 'video');
    });

    socket.on("call_accepted", (signal) => {
      setCallAccepted(true);
      if (connectionRef.current) {
        connectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
      }
    });

    socket.on("ice_candidate", ({ candidate }) => {
      if (connectionRef.current) {
        connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("call_ended", () => {
      cleanup();
    });

    socket.on("call_rejected", () => {
      cleanup();
    });

    return () => {
      socket.off("incoming_call");
      socket.off("call_accepted");
      socket.off("ice_candidate");
      socket.off("call_ended");
      socket.off("call_rejected");
    };
  }, [socket]);

  return {
    localVideo,
    remoteVideo,
    isCalling,
    callAccepted,
    receivingCall,
    callType,
    initCall,
    answerCall,
    endCall,
    rejectCall,
  };
}
