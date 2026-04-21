import { useRef, useState, useCallback } from "react";
import { socket } from "../socket/socket";
import api from "../api/axios";

export default function useWebRTC() {
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const timeoutRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const iceCandidateQueue = useRef([]);

  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState("new");
  const [stats, setStats] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // ── Cleanup peer connection only (keeps local stream alive) ──
  const cleanupPeer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    iceCandidateQueue.current = [];
    setRemoteStream(null);
    setConnectionState("new");
    setStats(null);
  }, []);

  // ── Full cleanup: peer + local stream (for page unmount) ──
  const cleanupAll = useCallback(() => {
    cleanupPeer();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setIsMuted(false);
    setIsVideoOff(false);
  }, [cleanupPeer]);

  const startStatsMonitoring = (peer) => {
    let lastBytes = 0;
    let lastTimestamp = 0;

    statsIntervalRef.current = setInterval(async () => {
      if (!peer || peer.connectionState === "closed") return;

      try {
        const report = await peer.getStats();

        report.forEach((stat) => {
          if (stat.type === "outbound-rtp" && stat.kind === "video") {
            if (lastTimestamp) {
              const bitrate =
                (8 * (stat.bytesSent - lastBytes)) /
                (stat.timestamp - lastTimestamp);

              const kbps = Math.floor(bitrate);

              let quality = "Poor";
              if (kbps > 1200) quality = "Excellent";
              else if (kbps > 600) quality = "Good";
              else if (kbps > 250) quality = "Fair";

              setStats({
                bitrate: kbps,
                packetsSent: stat.packetsSent,
                quality,
              });
            }

            lastBytes = stat.bytesSent;
            lastTimestamp = stat.timestamp;
          }
        });
      } catch {
        // peer may have been closed
      }
    }, 2000);
  };

  // ── Acquire camera + mic once (called on page mount) ──
  const initLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 30 },
      },
      audio: true,
    });

    localStreamRef.current = stream;
    return stream;
  }, []);

  // ── Create peer + attach existing local tracks ──
  const createPeerConnection = useCallback(async () => {
    let iceConfig;

    try {
      const { data } = await api.get("/api/auth/turn-credentials");
      iceConfig = { iceServers: data.iceServers };
    } catch {
      iceConfig = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      };
    }

    const peer = new RTCPeerConnection(iceConfig);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current);
      });

      const sender = peer.getSenders().find((s) => s.track?.kind === "video");

      if (sender) {
        const params = sender.getParameters();
        if (!params.encodings) params.encodings = [{}];
        params.encodings[0].maxBitrate = 500_000;
        await sender.setParameters(params);
      }
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate });
      }
    };

    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peer.onconnectionstatechange = () => {
      setConnectionState(peer.connectionState);

      if (peer.connectionState === "connected") {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        startStatsMonitoring(peer);
      }

      if (
        peer.connectionState === "failed" ||
        peer.connectionState === "disconnected" ||
        peer.connectionState === "closed"
      ) {
        cleanupPeer();
      }
    };

    peer.oniceconnectionstatechange = () => {
      if (peer.iceConnectionState === "failed") {
        peer.restartIce();
      }
    };

    timeoutRef.current = setTimeout(() => {
      if (peer.connectionState !== "connected") {
        console.warn("WebRTC connection timeout — cleaning up");
        cleanupPeer();
      }
    }, 15000);

    peerRef.current = peer;

    if (iceCandidateQueue.current.length > 0) {
      for (const candidate of iceCandidateQueue.current) {
        try {
          await peer.addIceCandidate(candidate);
        } catch (err) {
          console.error("ICE queue flush error:", err);
        }
      }
      iceCandidateQueue.current = [];
    }
  }, [cleanupPeer]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current
      .getTracks()
      .find((t) => t.kind === "audio");

    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  }, []);

  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return;

    const sender = peerRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");

    const currentTrack = localStreamRef.current
      .getTracks()
      .find((t) => t.kind === "video");

    // ───── TURN OFF CAMERA (HARDWARE OFF) ─────
    if (currentTrack && currentTrack.readyState === "live") {
      currentTrack.stop(); // 🔥 this turns OFF camera LED

      // remove from local stream
      localStreamRef.current.removeTrack(currentTrack);

      // keep connection alive but send nothing
      if (sender) {
        await sender.replaceTrack(null);
      }

      setIsVideoOff(true);
    }

    // ───── TURN ON CAMERA ─────
    else {
      let newStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 30 },
          },
        });
      } catch {
        return;
      }

      const newTrack = newStream.getVideoTracks()[0];

      // Stop any extra tracks on newStream so the camera LED doesn't
      // stay on for tracks we're not using (audio, duplicate video, etc.)
      newStream.getTracks().forEach((t) => {
        if (t !== newTrack) t.stop();
      });

      localStreamRef.current.addTrack(newTrack);

      if (sender) {
        await sender.replaceTrack(newTrack);
      }

      setIsVideoOff(false);
    }
  }, []);

  const createOffer = useCallback(async () => {
    if (!peerRef.current) return;
    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);
    socket.emit("offer", { offer });
  }, []);

  const handleOffer = useCallback(async (offer) => {
    if (!peerRef.current) return;
    await peerRef.current.setRemoteDescription(
      new RTCSessionDescription(offer),
    );
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);
    socket.emit("answer", { answer });
  }, []);

  const handleAnswer = useCallback(async (answer) => {
    if (!peerRef.current) return;
    await peerRef.current.setRemoteDescription(
      new RTCSessionDescription(answer),
    );
  }, []);

  const handleIceCandidate = useCallback(async (candidate) => {
    if (!peerRef.current) {
      iceCandidateQueue.current.push(new RTCIceCandidate(candidate));
      return;
    }

    try {
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("ICE candidate error:", err);
    }
  }, []);

  return {
    createPeerConnection,
    initLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanupPeer,
    cleanupAll,
    remoteStream,
    connectionState,
    stats,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoOff,
    localStreamRef,
  };
}
