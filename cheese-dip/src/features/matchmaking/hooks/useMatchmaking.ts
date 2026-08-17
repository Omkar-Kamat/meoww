import { useState, useEffect, useCallback } from "react";
import { socketClient } from "../../../shared/realtime/socketClient";
import type { MatchStatus, MatchedPayload } from "../types";

export const useMatchmaking = () => {
  const [status, setStatus] = useState<MatchStatus>("idle");
  const [matchData, setMatchData] = useState<MatchedPayload | null>(null);

  useEffect(() => {
    // Ensure socket is connected if we are using this hook
    if (!socketClient.connected) {
      socketClient.connect();
    }

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

    socketClient.on("queued", onQueued);
    socketClient.on("matched", onMatched);
    socketClient.on("peer-disconnected", onPeerDisconnected);

    return () => {
      socketClient.off("queued", onQueued);
      socketClient.off("matched", onMatched);
      socketClient.off("peer-disconnected", onPeerDisconnected);
      socketClient.disconnect();
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
    socketClient.emit("leave-room");
    setStatus("idle");
    setMatchData(null);
    // automatically search again
    socketClient.emit("search");
    setStatus("queued");
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
