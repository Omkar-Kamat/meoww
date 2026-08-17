
interface CallControlBarProps {
  onMute: () => void;
  onVideo: () => void;
  onEnd: () => void;
  onSkip: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
}

export const CallControlBar = ({ onMute, onVideo, onEnd, onSkip, isMuted, isVideoOff }: CallControlBarProps) => {
  return (
    <div style={{ display: "flex", gap: "10px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "8px", justifyContent: "center" }}>
      <button 
        onClick={onMute} 
        style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: isMuted ? "#dc3545" : "#6c757d", color: "white", border: "none", borderRadius: "4px" }}
      >
        {isMuted ? "Unmute" : "Mute"}
      </button>
      <button 
        onClick={onVideo} 
        style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: isVideoOff ? "#dc3545" : "#6c757d", color: "white", border: "none", borderRadius: "4px" }}
      >
        {isVideoOff ? "Turn Video On" : "Turn Video Off"}
      </button>
      <button 
        onClick={onSkip} 
        style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: "#ffc107", color: "black", border: "none", borderRadius: "4px" }}
      >
        Skip
      </button>
      <button 
        onClick={onEnd} 
        style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px" }}
      >
        End Call
      </button>
    </div>
  );
};
