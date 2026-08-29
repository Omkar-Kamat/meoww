import { useState } from "react";
import type { FormEvent } from "react";
import { TextField, Button, Flex } from "@radix-ui/themes";

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
        <form onSubmit={handleSubmit} style={{ marginTop: "12px" }}>
            <Flex gap="2" align="center">
                <TextField.Root
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                    disabled={disabled}
                    maxLength={500}
                    size="3"
                    variant="surface"
                    style={{ flex: 1, backgroundColor: "var(--gray-2)", borderRadius: "8px" }}
                />
                <Button
                    type="submit"
                    disabled={disabled || !text.trim()}
                    size="3"
                    variant="solid"
                    color="ruby"
                    radius="medium"
                    style={{ cursor: disabled || !text.trim() ? "not-allowed" : "pointer" }}
                >
                    Send
                </Button>
            </Flex>
        </form>
    );
};
