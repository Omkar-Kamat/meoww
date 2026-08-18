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

  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingSignalsRef = useRef<Array<() => Promise<void>>>([]);

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
    pendingSignalsRef.current = [];
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    setRemoteStream(null);
  }, [cleanupPeer]);

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
        localStreamRef.current = stream;

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

        const pending = pendingSignalsRef.current.splice(0);
        for (const run of pending) await run();

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

    const candidateQueue: RTCIceCandidateInit[] = [];

    const handleOffer = async (payload: { offer: RTCSessionDescriptionInit; roomId?: string }) => {
      if (payload.roomId && payload.roomId !== roomId) return;
      const run = async () => {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));

        while (candidateQueue.length > 0) {
          const candidate = candidateQueue.shift();
          if (candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error("Error adding queued ice candidate", e);
            }
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketClient.emit("answer", { answer });
      };

      if (!pcRef.current) {
        pendingSignalsRef.current.push(run);
        return;
      }
      await run();
    };

    const handleAnswer = async (payload: { answer: RTCSessionDescriptionInit; roomId?: string }) => {
      if (payload.roomId && payload.roomId !== roomId) return;
      const run = async () => {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));

        while (candidateQueue.length > 0) {
          const candidate = candidateQueue.shift();
          if (candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error("Error adding queued ice candidate", e);
            }
          }
        }
      };

      if (!pcRef.current) {
        pendingSignalsRef.current.push(run);
        return;
      }
      await run();
    };

    const handleIceCandidate = async (payload: { candidate: RTCIceCandidateInit; roomId?: string }) => {
      if (payload.roomId && payload.roomId !== roomId) return;
      const run = async () => {
        const pc = pcRef.current;
        if (!pc) return;
        if (!pc.remoteDescription) {
          candidateQueue.push(payload.candidate);
          return;
        }
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.error("Error adding received ice candidate", e);
        }
      };

      if (!pcRef.current) {
        pendingSignalsRef.current.push(run);
        return;
      }
      await run();
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
