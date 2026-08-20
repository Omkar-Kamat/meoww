import { useState, useEffect, useCallback, useRef } from "react";
import { socketClient } from "../../../shared/realtime/socketClient";
import type { MatchStatus, MatchedPayload } from "../types";

export const useMatchmaking = () => {
  const [status, setStatus] = useState<MatchStatus>("idle");
  const [matchData, setMatchData] = useState<MatchedPayload | null>(null);
  const [reconnectNotice, setReconnectNotice] = useState("");

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

  const wasInterruptedRef = useRef(false);

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
      wasInterruptedRef.current = statusRef.current === "matched" || statusRef.current === "queued";
    };

    const onConnect = () => {
      if (wasInterruptedRef.current) {
        setReconnectNotice("Reconnecting — your call was interrupted");
        wasInterruptedRef.current = false;
        setTimeout(() => {
          if (isMountedRef.current) {
             setReconnectNotice("");
          }
        }, 4000);
      } else {
        setStatus("idle");
        setMatchData(null);
      }
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
      setTimeout(() => {
        if (!isMountedRef.current) return;
        socketClient.emit("search");
        setStatus("queued");
      }, 300);
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
    leaveRoom,
    reconnectNotice
  };
};
