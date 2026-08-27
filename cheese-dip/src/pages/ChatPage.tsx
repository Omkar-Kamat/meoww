import { useState, useEffect } from "react";
import { useAuthSession } from "../features/auth";
import { useMatchmaking } from "../features/matchmaking";
import { useWebRTC, useCallControls, VideoTile, CallControlBar } from "../features/call";
import { useMessages, MessageList, MessageInput } from "../features/chat-messages";
import { trustSafetyApi } from "../features/trust-safety";
import { useNavigate } from "react-router-dom";
import { Modal } from "../shared/components/Modal";
import { Flex, Box, Heading, Text, Button, Card, Select, TextArea } from "@radix-ui/themes";

export const ChatPage = () => {
  const { logout } = useAuthSession();
  const navigate = useNavigate();
  const { status, matchData, search, stopSearch, skip, leaveRoom, reconnectNotice } = useMatchmaking();

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ peerId: string; roomId: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportError, setReportError] = useState("");
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  
  const [globalStream, setGlobalStream] = useState<MediaStream | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let streamRef: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef = stream;
        setGlobalStream(stream);
      })
      .catch(err => {
        if (mounted) setStreamError(err.message);
      });
    return () => {
      mounted = false;
      if (streamRef) {
        streamRef.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Only init WebRTC if matched
  const isMatched = status === "matched" && matchData !== null;
  const webrtc = useWebRTC(matchData?.isInitiator || false, matchData?.roomId, globalStream);
  const controls = useCallControls(webrtc.localStream);
  
  // Chat messages logic
  const { messages, sendMessage } = useMessages(isMatched ? matchData?.roomId : undefined);

  const handleReport = async () => {
    setReportError("");
    if (!reportReason) {
      setReportError("Please select a reason");
      return;
    }
    if (!reportTarget) return;
    try {
      await trustSafetyApi.report({
        reportedUserId: reportTarget.peerId,
        roomId: reportTarget.roomId,
        reason: `${reportReason}${reportDetails ? ': ' + reportDetails : ''}`.substring(0, 1000)
      });
      setIsReportOpen(false);
      setReportTarget(null);
      setReportReason("");
      setReportDetails("");
    } catch (err) {
      console.error("Failed to submit report", err);
    }
  };

  const handleBlock = async () => {
    if (!matchData?.peerId) return;
    try {
      await trustSafetyApi.block({
        blockedUserId: matchData.peerId
      });
      setIsBlockOpen(false);
      skip();
    } catch (err) {
      console.error("Failed to block user", err);
    }
  };

  return (
    <Flex direction="column" className="page-container" style={{ padding: "1.5rem", height: "100vh" }}>
      <Flex justify="between" align="center" mb="4">
        <Heading size="6" m="0">Chat Dashboard</Heading>
        <Flex gap="3">
          <Button variant="soft" color="gray" onClick={() => navigate("/settings")}>
            Settings
          </Button>
          <Button variant="solid" color="tomato" onClick={handleLogout}>
            Logout
          </Button>
        </Flex>
      </Flex>
      
      <Flex flexGrow="1" gap="4" style={{ minHeight: 0 }}>
        {/* Left side: Video & Call Controls */}
        <Flex direction="column" gap="4" style={{ flex: 2 }}>
          <Card className="glass-panel" style={{ flex: 1, display: "flex", gap: "10px", minHeight: 0, padding: "10px" }}>
            {isMatched ? (
              webrtc.error ? (
                <Flex direction="column" align="center" justify="center" gap="3" style={{ position: "relative", width: "100%", height: "100%" }}>
                  {webrtc.localStream && (
                    <Box style={{ position: "absolute", top: "10px", right: "10px", width: "150px", borderRadius: "8px", overflow: "hidden", zIndex: 2 }}>
                      <VideoTile stream={webrtc.localStream} label="You" isLocal />
                    </Box>
                  )}
                  <Text color="tomato" align="center" style={{ zIndex: 1 }}>{webrtc.error || streamError}</Text>
                  <Button onClick={webrtc.retry} style={{ zIndex: 1 }}>
                    Retry Connection
                  </Button>
                </Flex>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <VideoTile stream={webrtc.localStream} label="You" isLocal />
                  </div>
                  <div style={{ flex: 1 }}>
                    <VideoTile stream={webrtc.remoteStream} label="Peer" />
                  </div>
                </>
              )
            ) : (
              <Flex direction="column" align="center" justify="center" gap="3" style={{ width: "100%", height: "100%", position: "relative" }}>
                {globalStream && (
                  <Box style={{ position: "absolute", top: "10px", right: "10px", width: "150px", borderRadius: "8px", overflow: "hidden", zIndex: 2 }}>
                    <VideoTile stream={globalStream} label="You" isLocal />
                  </Box>
                )}
                <Text>Status: <Text weight="bold">{status}</Text></Text>
                {status === "idle" && (
                  <Button onClick={search} size="3" variant="solid" color="ruby">
                    Start Matchmaking
                  </Button>
                )}
                {status === "queued" && (
                  <Button onClick={stopSearch} size="3" variant="soft" color="gray">
                    Cancel Search
                  </Button>
                )}
              </Flex>
            )}
          </Card>
          
          {isMatched && (
            <CallControlBar 
              onMute={controls.toggleMute}
              onVideo={controls.toggleVideo}
              onSkip={skip}
              onEnd={leaveRoom}
              onReport={() => {
                if (matchData?.peerId && matchData?.roomId) {
                  setReportTarget({ peerId: matchData.peerId, roomId: matchData.roomId });
                  setIsReportOpen(true);
                }
              }}
              onBlock={() => setIsBlockOpen(true)}
              isMuted={controls.isMuted}
              isVideoOff={controls.isVideoOff}
            />
          )}

          {isMatched && (
            <div style={{ padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "8px", fontSize: "12px" }}>
              <p>Room ID: {matchData?.roomId} | Quality: {webrtc.stats.quality} | Bitrate: {webrtc.stats.bitrate} kbps | {webrtc.isConnecting ? "Connecting..." : "Connected"}</p>
            </div>
          )}
        </Flex>

        {/* Right side: Text Chat */}
        <Card className="glass-panel" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: "15px" }}>
          <Heading size="4" mb="3">Text Chat</Heading>
          <MessageList messages={messages} />
          <MessageInput key={matchData?.roomId ?? "idle"} onSend={sendMessage} disabled={!isMatched} />
        </Card>
      </Flex>

      <Modal isOpen={isReportOpen} onClose={() => { setIsReportOpen(false); setReportTarget(null); }} title="Report User">
        <Flex direction="column" gap="3">
          <Text color="gray">Why are you reporting this user?</Text>
          <Select.Root 
            value={reportReason} 
            onValueChange={setReportReason}
          >
            <Select.Trigger placeholder="Select a reason..." style={{ width: "100%" }} />
            <Select.Content>
              <Select.Item value="harassment">Harassment or Abuse</Select.Item>
              <Select.Item value="inappropriate">Inappropriate Content</Select.Item>
              <Select.Item value="spam">Spam</Select.Item>
              <Select.Item value="other">Other</Select.Item>
            </Select.Content>
          </Select.Root>
          <TextArea 
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            placeholder="Optional details (max 1000 chars)"
            maxLength={1000}
            size="3"
            style={{ minHeight: "80px", resize: "vertical" }}
          />
          {reportError && (
            <Text color="tomato" size="2">{reportError}</Text>
          )}
          <Flex justify="end" gap="3" mt="2">
            <Button variant="soft" color="gray" onClick={() => { setIsReportOpen(false); setReportTarget(null); }}>Cancel</Button>
            <Button variant="solid" color="ruby" onClick={handleReport}>Submit Report</Button>
          </Flex>
        </Flex>
      </Modal>

      <Modal isOpen={isBlockOpen} onClose={() => setIsBlockOpen(false)} title="Block User">
        <Flex direction="column" gap="4">
          <Text color="gray">Are you sure you want to block this user? You will be skipped to the next match.</Text>
          <Flex justify="end" gap="3">
            <Button variant="soft" color="gray" onClick={() => setIsBlockOpen(false)}>Cancel</Button>
            <Button variant="solid" color="tomato" onClick={handleBlock}>Block User</Button>
          </Flex>
        </Flex>
      </Modal>

      {reconnectNotice && (
        <div style={{
          position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)",
          backgroundColor: "#333", color: "white", padding: "10px 20px",
          borderRadius: "4px", zIndex: 9999
        }}>
          {reconnectNotice}
        </div>
      )}
    </Flex>
  );
};
