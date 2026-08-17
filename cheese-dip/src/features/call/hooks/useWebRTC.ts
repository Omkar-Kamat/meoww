import { useState, useEffect, useCallback, useRef } from "react";
import { socketClient } from "../../../shared/realtime/socketClient";
import { webrtcApi } from "../api/webrtcApi";
import type { UseWebRTCReturn } from "../types";
import { useConnectionStats } from "./useConnectionStats";

export const useWebRTC = (isInitiator: boolean, roomId: string | undefined): UseWebRTCReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const { stats, startStats, stopStats } = useConnectionStats();

  const cleanupPeer = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    stopStats();
    setIsConnecting(true);
  }, [stopStats]);

  const cleanupAll = useCallback(() => {
    cleanupPeer();
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
  }, [cleanupPeer, localStream]);

  // Request media and init connection
  useEffect(() => {
    if (!roomId) return;

    let mounted = true;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        setLocalStream(stream);

        const credentials = await webrtcApi.getTurnCredentials();
        const pc = new RTCPeerConnection({ iceServers: credentials.iceServers });
        pcRef.current = pc;
        startStats(pc);

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
            setIsConnecting(false);
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socketClient.emit("ice-candidate", { candidate: event.candidate });
          }
        };

        if (isInitiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketClient.emit("offer", { offer });
        }
      } catch (err) {
        console.error("Failed to init WebRTC", err);
      }
    };

    init();

    return () => {
      mounted = false;
      cleanupAll();
    };
  }, [roomId, isInitiator, cleanupAll, startStats]);

  // Socket event listeners
  useEffect(() => {
    if (!roomId) return;

    const handleOffer = async (payload: { offer: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketClient.emit("answer", { answer });
    };

    const handleAnswer = async (payload: { answer: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
    };

    const handleIceCandidate = async (payload: { candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (e) {
        console.error("Error adding received ice candidate", e);
      }
    };

    socketClient.on("offer", handleOffer);
    socketClient.on("answer", handleAnswer);
    socketClient.on("ice-candidate", handleIceCandidate);

    return () => {
      socketClient.off("offer", handleOffer);
      socketClient.off("answer", handleAnswer);
      socketClient.off("ice-candidate", handleIceCandidate);
    };
  }, [roomId]);

  return {
    localStream,
    remoteStream,
    stats,
    isConnecting,
    cleanupAll,
  };
};
