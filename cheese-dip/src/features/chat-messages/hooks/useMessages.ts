import { useState, useEffect, useCallback } from "react";
import { socketClient } from "../../../shared/realtime/socketClient";
import type { ChatMessage } from "../types";
import { generateId } from "../../../shared/utils/id";

export const useMessages = (roomId: string | undefined) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prevRoomId, setPrevRoomId] = useState<string | undefined>(roomId);

  // We reset state during render to avoid an extra render cycle that a useEffect would cause.
  // This is React's recommended pattern for deriving state from props/arguments.
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
          id: generateId(),
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
    if (!roomId || !text.trim()) return false;
    socketClient.emit("send-message", { text });
    return true;
  }, [roomId]);

  return {
    messages,
    sendMessage,
    canSend: !!roomId,
  };
};
