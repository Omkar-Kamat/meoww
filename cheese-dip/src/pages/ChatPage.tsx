import { useAuthSession } from "../features/auth";
import { useMatchmaking } from "../features/matchmaking";
import { useWebRTC, useCallControls, VideoTile, CallControlBar } from "../features/call";
import { useMessages, MessageList, MessageInput } from "../features/chat-messages";
import { trustSafetyApi } from "../features/trust-safety";
import { useNavigate } from "react-router-dom";

export const ChatPage = () => {
  const { logout } = useAuthSession();
  const navigate = useNavigate();
  const { status, matchData, search, stopSearch, skip, leaveRoom } = useMatchmaking();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Only init WebRTC if matched
  const isMatched = status === "matched" && matchData !== null;
  const webrtc = useWebRTC(matchData?.isInitiator || false, matchData?.roomId);
  const controls = useCallControls(webrtc.localStream);
  
  // Chat messages logic
  const { messages, sendMessage } = useMessages(isMatched ? matchData?.roomId : undefined);

  const handleReport = async () => {
    const reason = window.prompt("Why are you reporting this user?");
    if (!reason || !matchData?.peerId || !matchData?.roomId) return;
    try {
      await trustSafetyApi.report({
        reportedUserId: matchData.peerId,
        roomId: matchData.roomId,
        reason
      });
      alert("Report submitted.");
    } catch {
      alert("Failed to submit report.");
    }
  };

  const handleBlock = async () => {
    if (!matchData?.peerId) return;
    if (!window.confirm("Are you sure you want to block this user?")) return;
    try {
      await trustSafetyApi.block({
        blockedUserId: matchData.peerId
      });
      alert("User blocked.");
      skip();
    } catch {
      alert("Failed to block user.");
    }
  };

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", height: "100vh", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Chat Dashboard</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => navigate("/settings")} style={{ padding: "8px 16px", cursor: "pointer", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px" }}>
            Settings
          </button>
          <button onClick={handleLogout} style={{ padding: "8px 16px", cursor: "pointer", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px" }}>
            Logout
          </button>
        </div>
      </div>
      
      <div style={{ display: "flex", flex: 1, gap: "20px" }}>
        {/* Left side: Video & Call Controls */}
        <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ flex: 1, border: "1px dashed #ccc", display: "flex", gap: "10px", padding: "10px", borderRadius: "8px" }}>
            {isMatched ? (
              <>
                <div style={{ flex: 1 }}>
                  <VideoTile stream={webrtc.localStream} label="You" isLocal />
                </div>
                <div style={{ flex: 1 }}>
                  <VideoTile stream={webrtc.remoteStream} label="Peer" />
                </div>
              </>
            ) : (
              <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "15px" }}>
                <p>Status: <strong>{status}</strong></p>
                {status === "idle" && (
                  <button onClick={search} style={{ padding: "10px 20px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                    Start Matchmaking
                  </button>
                )}
                {status === "queued" && (
                  <button onClick={stopSearch} style={{ padding: "10px 20px", backgroundColor: "#ffc107", color: "black", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                    Cancel Search
                  </button>
                )}
              </div>
            )}
          </div>
          
          {isMatched && (
            <CallControlBar 
              onMute={controls.toggleMute}
              onVideo={controls.toggleVideo}
              onSkip={skip}
              onEnd={leaveRoom}
              onReport={handleReport}
              onBlock={handleBlock}
              isMuted={controls.isMuted}
              isVideoOff={controls.isVideoOff}
            />
          )}

          {isMatched && (
            <div style={{ padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "8px", fontSize: "12px" }}>
              <p>Room ID: {matchData?.roomId} | Quality: {webrtc.stats.quality} | Bitrate: {webrtc.stats.bitrate} kbps | {webrtc.isConnecting ? "Connecting..." : "Connected"}</p>
            </div>
          )}
        </div>

        {/* Right side: Text Chat */}
        <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: "8px", padding: "15px", display: "flex", flexDirection: "column" }}>
          <h3>Text Chat</h3>
          <MessageList messages={messages} />
          <MessageInput onSend={sendMessage} disabled={!isMatched} />
        </div>
      </div>
    </div>
  );
};
