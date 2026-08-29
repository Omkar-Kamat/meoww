import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types";

interface MessageListProps {
    messages: ChatMessage[];
}

export const MessageList = ({ messages }: MessageListProps) => {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div
            style={{
                flex: 1,
                overflowY: "auto",
                padding: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
            }}
        >
            {messages.length === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        color: "#6c757d",
                        marginTop: "auto",
                        marginBottom: "auto",
                    }}
                >
                    No messages yet. Say hi!
                </div>
            )}
            {messages.map((msg) => (
                <div
                    key={msg.id}
                    style={{
                        display: "flex",
                        justifyContent: msg.fromSelf ? "flex-end" : "flex-start",
                    }}
                >
                    <div
                        style={{
                            maxWidth: "70%",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            backgroundColor: msg.fromSelf ? "#007bff" : "#e9ecef",
                            color: msg.fromSelf ? "white" : "black",
                        }}
                    >
                        {msg.text}
                    </div>
                </div>
            ))}
            <div ref={endRef} />
        </div>
    );
};
