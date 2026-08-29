export interface ChatMessage {
    id: string;
    text: string;
    fromSelf: boolean;
    timestamp: number;
}
