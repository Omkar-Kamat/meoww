import { useState, useEffect, useCallback } from "react";
import { socketClient } from "../../../shared/realtime/socketClient";
import type { ChatMessage } from "../types";

export const useMessages = (roomId: string | undefined) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prevRoomId, setPrevRoomId] = useState<string | undefined>(roomId);

  if (roomId !== prevRoomId) {
    setPrevRoomId(roomId);
    setMessages([]);
  }

  useEffect(() => {
    if (!roomId) return;

    const handleReceiveMessage = (payload: { text: string; fromSelf: boolean }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          text: payload.text,
          fromSelf: payload.fromSelf,
          timestamp: Date.now(),
        },
      ]);
    };

    socketClient.on("receive-message", handleReceiveMessage);

    return () => {
      socketClient.off("receive-message", handleReceiveMessage);
    };
  }, [roomId]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    socketClient.emit("send-message", { text });
  }, []);

  return {
    messages,
    sendMessage,
  };
};
