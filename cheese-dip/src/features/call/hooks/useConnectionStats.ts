import { useState, useEffect, useCallback, useRef } from "react";
import type { ConnectionStats } from "../types";

export const useConnectionStats = () => {
  const [stats, setStats] = useState<ConnectionStats>({ bitrate: 0, quality: "offline" });
  const intervalRef = useRef<number | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const startStats = useCallback((pc: RTCPeerConnection) => {
    pcRef.current = pc;
    if (intervalRef.current) clearInterval(intervalRef.current);

    let lastBytesSent = 0;
    let lastTimestamp = 0;

    intervalRef.current = window.setInterval(async () => {
      if (!pcRef.current || pcRef.current.signalingState === "closed") {
        setStats({ bitrate: 0, quality: "offline" });
        return;
      }

      const rawStats = await pcRef.current.getStats();
      let bytesSent = 0;
      let timestamp = 0;

      rawStats.forEach((report) => {
        if (report.type === "outbound-rtp" && report.kind === "video") {
          bytesSent = report.bytesSent;
          timestamp = report.timestamp;
        }
      });

      if (bytesSent > 0 && lastBytesSent > 0) {
        const bytes = bytesSent - lastBytesSent;
        const time = timestamp - lastTimestamp;
        const bitrate = (bytes * 8) / time; // kbps roughly
        
        let quality: ConnectionStats["quality"] = "good";
        if (bitrate < 100) quality = "poor";
        if (bitrate === 0) quality = "offline";

        setStats({ bitrate: Math.round(bitrate), quality });
      }

      lastBytesSent = bytesSent;
      lastTimestamp = timestamp;
    }, 2000);
  }, []);

  const stopStats = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStats({ bitrate: 0, quality: "offline" });
  }, []);

  useEffect(() => {
    return () => stopStats();
  }, [stopStats]);

  return { stats, startStats, stopStats };
};
