import { useState, useCallback, useEffect } from "react";

export const useCallControls = (localStream: MediaStream | null) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [prevStreamId, setPrevStreamId] = useState<string | null>(null);

    if (localStream && localStream.id !== prevStreamId) {
        const audioTrack = localStream.getAudioTracks()[0];
        const videoTrack = localStream.getVideoTracks()[0];
        setIsMuted(audioTrack ? !audioTrack.enabled : false);
        setIsVideoOff(videoTrack ? !videoTrack.enabled : false);
        setPrevStreamId(localStream.id);
    }

    useEffect(() => {
        if (!localStream) return;
        if (prevStreamId !== localStream.id) return;

        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !isMuted;
        }

        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !isVideoOff;
        }
    }, [localStream, isMuted, isVideoOff, prevStreamId]);

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
