import { useState } from "react";
import type { FormEvent } from "react";

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const MessageInput = ({ onSend, disabled = false }: MessageInputProps) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        style={{ flex: 1, padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
      />
      <button 
        type="submit" 
        disabled={disabled || !text.trim()} 
        style={{ padding: "10px 20px", backgroundColor: disabled || !text.trim() ? "#ccc" : "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: disabled || !text.trim() ? "not-allowed" : "pointer" }}
      >
        Send
      </button>
    </form>
  );
};
