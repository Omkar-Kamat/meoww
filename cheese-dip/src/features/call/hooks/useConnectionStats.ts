import { useState, useEffect, useCallback, useRef } from "react";
import type { ConnectionStats } from "../types";

export const useConnectionStats = (minBitrate: number = 20) => {
    const [stats, setStats] = useState<ConnectionStats>({ bitrate: 0, quality: "offline" });
    const intervalRef = useRef<number | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);

    const startStats = useCallback(
        (pc: RTCPeerConnection) => {
            pcRef.current = pc;
            if (intervalRef.current) clearInterval(intervalRef.current);

            let lastBytesSent = 0;
            let lastTimestamp = 0;
            let lastPacketsLost = 0;
            let tickCount = 0;

            intervalRef.current = window.setInterval(async () => {
                if (!pcRef.current || pcRef.current.signalingState === "closed") {
                    setStats({ bitrate: 0, quality: "offline" });
                    return;
                }

                const rawStats = await pcRef.current.getStats();
                let bytesSent = 0;
                const timestamp = Date.now();
                let packetsLost = 0;

                rawStats.forEach((report) => {
                    if (report.type === "outbound-rtp") {
                        bytesSent += report.bytesSent || 0;
                    }
                    if (report.type === "remote-inbound-rtp") {
                        packetsLost += report.packetsLost || 0;
                    }
                });

                if (lastTimestamp > 0) {
                    tickCount++;
                    const bytes = bytesSent - lastBytesSent;
                    const time = timestamp - lastTimestamp;
                    const newPacketsLost = packetsLost - lastPacketsLost;

                    if (time > 0) {
                        const bitrate = (bytes * 8) / time;
                        let quality: ConnectionStats["quality"] = "good";
                        const state = pcRef.current?.iceConnectionState;
                        if (
                            state === "disconnected" ||
                            state === "failed" ||
                            pcRef.current?.connectionState === "disconnected" ||
                            pcRef.current?.connectionState === "failed"
                        ) {
                            quality = "offline";
                        } else if (
                            tickCount >= 2 &&
                            (bitrate < minBitrate || newPacketsLost > 10)
                        ) {
                            quality = "poor";
                        }

                        setStats({ bitrate: Math.round(bitrate), quality });
                    }
                }

                lastBytesSent = bytesSent;
                lastTimestamp = timestamp;
                lastPacketsLost = packetsLost;
            }, 2000);
        },
        [minBitrate],
    );

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
