import { useState, useCallback, useEffect } from "react";

export const useCallControls = (localStream: MediaStream | null) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (!localStream) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMuted(false);
    setIsVideoOff(false);
  }, [localStream]);

  const toggleMute = useCallback(() => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  }, [localStream]);

  return {
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
  };
};
