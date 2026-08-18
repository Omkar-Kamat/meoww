import { useState, useEffect, useCallback, useRef } from "react";
import { socketClient } from "../../../shared/realtime/socketClient";
import type { MatchStatus, MatchedPayload } from "../types";

export const useMatchmaking = () => {
  const [status, setStatus] = useState<MatchStatus>("idle");
  const [matchData, setMatchData] = useState<MatchedPayload | null>(null);

  const statusRef = useRef(status);
  const isMountedRef = useRef(true);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const onQueued = () => {
      setStatus("queued");
    };

    const onMatched = (payload: MatchedPayload) => {
      setStatus("matched");
      setMatchData(payload);
    };

    const onPeerDisconnected = () => {
      setStatus("idle");
      setMatchData(null);
    };

    const onDisconnect = () => {
      setStatus("idle");
      setMatchData(null);
    };

    const onConnect = () => {
      const currentStatus = statusRef.current;
      if (currentStatus === "matched" || currentStatus === "queued") {
        const notice = document.createElement("div");
        notice.textContent = "Reconnecting — your call was interrupted";
        Object.assign(notice.style, {
          position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)",
          backgroundColor: "#333", color: "white", padding: "10px 20px",
          borderRadius: "4px", zIndex: "9999"
        });
        document.body.appendChild(notice);
        setTimeout(() => notice.remove(), 4000);
      }
      setStatus("idle");
      setMatchData(null);
    };

    socketClient.on("queued", onQueued);
    socketClient.on("matched", onMatched);
    socketClient.on("peer-disconnected", onPeerDisconnected);
    socketClient.on("disconnect", onDisconnect);
    socketClient.on("connect", onConnect);

    return () => {
      socketClient.off("queued", onQueued);
      socketClient.off("matched", onMatched);
      socketClient.off("peer-disconnected", onPeerDisconnected);
      socketClient.off("disconnect", onDisconnect);
      socketClient.off("connect", onConnect);
      
      const currentStatus = statusRef.current;
      if (currentStatus === "queued") {
        socketClient.emit("cancel-search");
      } else if (currentStatus === "matched" || currentStatus === "skipping") {
        socketClient.emit("leave-room");
        socketClient.emit("cancel-search");
      }
    };
  }, []);

  const search = useCallback(() => {
    socketClient.emit("search");
    setStatus("queued"); // Optimistic update
  }, []);

  const stopSearch = useCallback(() => {
    socketClient.emit("cancel-search");
    setStatus("idle");
  }, []);

  const skip = useCallback(() => {
    setStatus("skipping");
    socketClient.emit("leave-room", () => {
      if (!isMountedRef.current) return;
      // automatically search again
      socketClient.emit("search");
      setStatus("queued");
    });
    setMatchData(null);
  }, []);

  const leaveRoom = useCallback(() => {
    socketClient.emit("leave-room");
    setStatus("idle");
    setMatchData(null);
  }, []);

  return {
    status,
    matchData,
    search,
    stopSearch,
    skip,
    leaveRoom
  };
};
