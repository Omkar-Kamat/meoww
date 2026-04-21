import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  LogOut,
  Search,
  Square,
  PhoneOff,
  SkipForward,
  Palette,
  Send,
} from "lucide-react";
import { socket } from "../socket/socket";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import useWebRTC from "../rtc/useWebRTC";
import { useTheme } from "../theme/useTheme";
import { themes } from "../theme/themes";
import {
  fadeInOut,
  slideInRight,
  dropdownMotion,
  STATUS_COLORS,
} from "../ui.config";
import api from "../api/axios";
import ErrorBoundary from "../components/ErrorBoundary";

const S = {
  /* Layout */
  page: "h-dvh flex flex-col overflow-hidden bg-[#080808] relative",
  nav: "flex items-center justify-between px-6 h-[60px] shrink-0 relative z-10 bg-[rgba(8,8,8,0.70)] backdrop-blur-xl border-b border-white/[0.07]",
  brand:
    "font-bold text-[1rem] text-white tracking-[-0.02em] cursor-pointer transition-opacity hover:opacity-70",
  username: "text-[0.75rem] text-white/40",
  statusPill:
    "flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-[0.7rem]",
  statusDot: "size-1.5 rounded-full bg-current",
  navControls: "flex items-center gap-2",
  iconBtn:
    "w-9 h-9 rounded-full border border-white/[0.09] bg-white/[0.04] backdrop-blur-sm flex items-center justify-center cursor-pointer text-white/50 transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]",
  iconActive:
    "!bg-[rgba(0,229,255,0.10)] !border-[var(--accent)] !text-[var(--accent)]",
  iconDanger:
    "hover:!border-red-500/50 hover:!text-red-400 hover:!bg-red-500/[0.08]",

  /* Banners */
  bannerBase:
    "flex items-center justify-center gap-2 px-4 py-2 text-[0.8rem] font-medium shrink-0",
  bannerWarn:
    "bg-[rgba(255,180,0,0.10)] border-b border-[rgba(255,180,0,0.20)] text-[rgba(255,200,50,0.9)]",
  bannerErr:
    "bg-[rgba(255,70,70,0.08)] border-b border-[rgba(255,70,70,0.15)] text-[rgba(255,100,100,0.9)]",

  /* Main */
  main: "flex-1 flex overflow-hidden relative",
  videoGrid:
    "flex-1 grid grid-cols-2 gap-3 p-4 overflow-hidden relative max-sm:grid-cols-1",
  videoCard:
    "relative rounded-2xl overflow-hidden bg-[#0d0d0d] border border-white/[0.07] min-h-0",
  videoLabel:
    "absolute bottom-3 left-3 text-[0.7rem] tracking-widest uppercase text-white/60 bg-black/50 border border-white/[0.08] px-2.5 py-1 rounded-full backdrop-blur-sm",
  overlay:
    "absolute inset-0 flex flex-col items-center justify-center gap-3.5 bg-[rgba(8,8,8,0.75)] backdrop-blur-sm z-[5] rounded-2xl",
  spinner:
    "size-9 rounded-full border-[3px] border-white/10 border-t-[var(--accent)] spin",
  statsB:
    "absolute bottom-12 right-7 bg-[rgba(8,8,8,0.8)] border border-white/[0.08] rounded-xl px-3.5 py-2 text-[0.72rem] text-white/60 backdrop-blur-sm z-[4] leading-relaxed",

  /* Sidebar */
  sidebar:
    "w-[300px] flex flex-col border-l border-white/[0.07] bg-white/[0.02] backdrop-blur-xl shrink-0",
  sidebarHead:
    "px-[18px] py-3.5 border-b border-white/[0.07] text-[0.85rem] font-bold tracking-[-0.01em] text-white shrink-0",
  msgs: "flex-1 overflow-y-auto p-3.5 flex flex-col gap-2 [scrollbar-width:thin]",
  bubbleSelf:
    "max-w-[82%] px-3.5 py-2 rounded-[14px_14px_4px_14px] text-[0.82rem] leading-relaxed break-words ml-auto text-black",
  bubbleOther:
    "max-w-[82%] px-3.5 py-2 rounded-[14px_14px_14px_4px] text-[0.82rem] leading-relaxed break-words mr-auto bg-white/[0.07] border border-white/[0.08] text-white",
  chatForm: "p-3 border-t border-white/[0.07] flex gap-2 shrink-0",
  chatInput:
    "flex-1 px-3.5 py-2 rounded-full bg-white/[0.05] border border-white/[0.09] text-white text-[0.82rem] outline-none transition-colors placeholder:text-white/30 focus:border-[var(--accent)]",
  sendBtn:
    "size-9 rounded-full flex items-center justify-center cursor-pointer shrink-0 text-black border-none transition-shadow hover:shadow-[0_0_16px_var(--accent)]",

  /* Control bar */
  ctrlBar:
    "flex items-center justify-center gap-2.5 px-6 py-3.5 border-t border-white/[0.07] bg-[rgba(8,8,8,0.70)] backdrop-blur-xl shrink-0",
  ctrlGroup: "flex flex-col items-center gap-1",
  ctrlLabel: "text-[0.62rem] uppercase tracking-wider text-white/40",
  ctrlBtn:
    "w-12 h-12 rounded-2xl border border-white/[0.09] bg-white/[0.04] flex items-center justify-center cursor-pointer text-white/70 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed",
  ctrlDanger:
    "!bg-red-500/[0.10] !border-red-500/25 !text-red-400 hover:!bg-red-500/20",

  /* Theme dropdown */
  themeDrop:
    "absolute top-11 right-0 flex gap-2 p-2.5 bg-[rgba(8,8,8,0.9)] border border-white/[0.09] backdrop-blur-xl rounded-2xl z-50",
  themeSwatch:
    "w-[22px] h-[22px] rounded-full cursor-pointer transition-transform hover:scale-110",
};

function CtrlBtn({ icon, label, onClick, disabled, danger }) {
  return (
    <motion.div
      className={S.ctrlGroup}
      whileHover={!disabled ? { y: -2 } : {}}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <button
        className={`${S.ctrlBtn} ${danger ? S.ctrlDanger : ""}`}
        onClick={onClick}
        disabled={disabled}
      >
        {icon}
      </button>
      <span
        className={S.ctrlLabel}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {label}
      </span>
    </motion.div>
  );
}

export default function ChatPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const show = useToastStore((s) => s.show);
  const { themeKey, setThemeKey } = useTheme();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatEndRef = useRef(null);
  const themeDropRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [peer, setPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const {
    createPeerConnection,
    initLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanupPeer,
    cleanupAll,
    remoteStream,
    connectionState,
    stats,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoOff,
    localStreamRef,
  } = useWebRTC();

  const rtcRef = useRef({});
  useEffect(() => {
    rtcRef.current = {
      createPeerConnection,
      initLocalStream,
      createOffer,
      handleOffer,
      handleAnswer,
      handleIceCandidate,
      cleanupPeer,
      cleanupAll,
    };
  }, [
    createPeerConnection,
    initLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanupPeer,
    cleanupAll,
  ]);

  useEffect(() => {
    const h = (e) => {
      if (themeDropRef.current && !themeDropRef.current.contains(e.target))
        setThemeOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        const stream = await initLocalStream();
        if (!cancelled && localVideoRef.current)
          localVideoRef.current.srcObject = stream;
        if (!cancelled) setMediaReady(true);
      } catch (err) {
        if (!cancelled) {
          setMediaError(err.message || "Camera/mic access denied");
          show("Camera or microphone access denied", "error");
        }
      }
    };
    start();
    return () => {
      cancelled = true;
    };
  }, [initLocalStream, show]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream)
      remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);
  useEffect(() => {
    if (!isVideoOff && localVideoRef.current && localStreamRef.current)
      localVideoRef.current.srcObject = localStreamRef.current;
  }, [isVideoOff, localStreamRef]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const refreshAndReconnect = useCallback(async () => {
    try {
      await api.post("/api/auth/refresh");
      setTimeout(() => socket.connect(), 100);
    } catch {
      show("Session expired. Please log in again.", "error");
      logout();
    }
  }, [show, logout]);

  useEffect(() => {
    socket.connect();
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    const onQueued = () => setStatus("queued");
    const onMatched = async ({ isInitiator, name, username }) => {
      try {
        setStatus("matched");
        setMessages([]);
        setPeer(name || username ? { name, username } : null);
        await rtcRef.current.createPeerConnection();
        if (isInitiator) await rtcRef.current.createOffer();
      } catch (err) {
        show(err.message || "Connection failed", "error");
        rtcRef.current.cleanupPeer();
        setStatus("idle");
      }
    };
    const onOffer = ({ offer }) => rtcRef.current.handleOffer(offer);
    const onAnswer = ({ answer }) => rtcRef.current.handleAnswer(answer);
    const onIceCandidate = ({ candidate }) =>
      rtcRef.current.handleIceCandidate(candidate);
    const onPeerDisconnected = () => {
      rtcRef.current.cleanupPeer();
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      setStatus("idle");
      setMessages([]);
      setPeer(null);
    };
    const onReceiveMessage = ({ text, fromSelf }) =>
      setMessages((p) => [
        ...p,
        { id: `${Date.now()}-${Math.random()}`, text, fromSelf },
      ]);
    const onSessionTerminated = () => {
      rtcRef.current.cleanupAll();
      show("You connected from another tab.", "error");
      logout();
    };
    const onTokenExpiringSoon = () => refreshAndReconnect();
    const onTokenExpired = () => {
      show("Session expired. Please log in again.", "error");
      rtcRef.current.cleanupAll();
      logout();
    };
    const onConnectError = async (err) => {
      const code = err.data?.code;
      if (code === "TOKEN_EXPIRED") await refreshAndReconnect();
      else if (["TOKEN_INVALID", "NO_TOKEN", "NO_COOKIE"].includes(code)) {
        show("Authentication failed.", "error");
        logout();
      } else show("Connection failed. Please try again.", "error");
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("queued", onQueued);
    socket.on("matched", onMatched);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("peer-disconnected", onPeerDisconnected);
    socket.on("receive-message", onReceiveMessage);
    socket.on("session-terminated", onSessionTerminated);
    socket.on("token-expiring-soon", onTokenExpiringSoon);
    socket.on("token-expired", onTokenExpired);
    socket.on("connect_error", onConnectError);
    return () => {
      socket.emit("stop-search");
      rtcRef.current.cleanupAll();
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("queued", onQueued);
      socket.off("matched", onMatched);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIceCandidate);
      socket.off("peer-disconnected", onPeerDisconnected);
      socket.off("receive-message", onReceiveMessage);
      socket.off("session-terminated", onSessionTerminated);
      socket.off("token-expiring-soon", onTokenExpiringSoon);
      socket.off("token-expired", onTokenExpired);
      socket.off("connect_error", onConnectError);
      socket.disconnect();
    };
  }, [show, logout, refreshAndReconnect]);

  const handleSearch = () => {
    if (!mediaReady) {
      show("Camera not ready yet", "error");
      return;
    }
    setStatus("queued");
    socket.emit("search");
  };
  const handleSendMessage = (e) => {
    e.preventDefault();
    const t = chatInput.trim();
    if (!t) return;
    socket.emit("send-message", { text: t });
    setChatInput("");
  };
  const handleSkip = () => {
    cleanupPeer();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    socket.emit("skip");
    setMessages([]);
    setPeer(null);
    setStatus("queued");
  };
  const handleEndCall = () => {
    cleanupPeer();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    socket.emit("skip");
    setStatus("idle");
    setMessages([]);
    setPeer(null);
  };
  const handleStopSearch = () => {
    socket.emit("stop-search");
    setStatus("idle");
  };

  const isConnecting = status === "matched" && connectionState !== "connected";
  const isConnected = status === "matched" && connectionState === "connected";
  const statusColor =
    STATUS_COLORS[isConnecting ? "queued" : status] ?? STATUS_COLORS.idle;

  return (
    <div className={S.page}>
      {/* Nav */}
      <header className={S.nav}>
        <div className="flex items-center gap-2.5">
          <span
            className={S.brand}
            style={{ fontFamily: "'Syne', sans-serif" }}
            onClick={() => navigate("/")}
          >
            Meoww
          </span>
          {user?.username && (
            <span
              className={S.username}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              · {user.username}
            </span>
          )}
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
          <div
            className={S.statusPill}
            style={{ color: statusColor, fontFamily: "'DM Sans', sans-serif" }}
          >
            <span
              className={`${S.statusDot} ${status !== "idle" ? "blink" : ""}`}
            />
            {status === "idle"
              ? "Idle"
              : status === "queued"
                ? "Searching…"
                : isConnecting
                  ? "Connecting…"
                  : "Connected"}
          </div>
        </div>

        <div className={S.navControls}>
          <button
            className={`${S.iconBtn} ${isMuted ? S.iconActive : ""}`}
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
          <button
            className={`${S.iconBtn} ${isVideoOff ? S.iconActive : ""}`}
            onClick={toggleVideo}
            title={isVideoOff ? "Camera on" : "Camera off"}
          >
            {isVideoOff ? <VideoOff size={15} /> : <Video size={15} />}
          </button>

          <div ref={themeDropRef} className="relative">
            <button
              className={S.iconBtn}
              onClick={() => setThemeOpen((p) => !p)}
            >
              <Palette size={15} />
            </button>
            <AnimatePresence>
              {themeOpen && (
                <motion.div className={S.themeDrop} {...dropdownMotion}>
                  {Object.keys(themes).map((key) => (
                    <button
                      key={key}
                      className={S.themeSwatch}
                      onClick={() => {
                        setThemeKey(key);
                        setThemeOpen(false);
                      }}
                      style={{
                        background: themes[key].colors.primary,
                        border: `2px solid ${themeKey === key ? "#fff" : "transparent"}`,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            className={`${S.iconBtn} ${S.iconDanger}`}
            onClick={logout}
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Banners */}
      <AnimatePresence>
        {!socketConnected && (
          <motion.div
            {...fadeInOut}
            className={`${S.bannerBase} ${S.bannerWarn}`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <span className={`${S.statusDot} blink`} />
            Connection lost — reconnecting…
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {mediaError && (
          <motion.div
            {...fadeInOut}
            className={`${S.bannerBase} ${S.bannerErr}`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            ⚠ {mediaError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <ErrorBoundary
        fallback={
          <div
            className="flex-1 flex flex-col items-center justify-center gap-2 text-white/50"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <p className="font-medium">Video area crashed</p>
            <p className="text-sm">Try ending the call and searching again.</p>
          </div>
        }
      >
        <div className={S.main}>
          <div className={S.videoGrid}>
            {/* Connecting overlay */}
            <AnimatePresence>
              {isConnecting && (
                <motion.div
                  {...fadeInOut}
                  className="absolute inset-4 flex items-center justify-center bg-[rgba(8,8,8,0.6)] backdrop-blur-sm z-10 rounded-2xl"
                >
                  <div className={S.spinner} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Local — always mounted */}
            <div className={S.videoCard}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover block"
              />
              <div
                className={S.videoLabel}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                You
              </div>
            </div>

            {/* Remote — always mounted, overlays on top */}
            <div className={S.videoCard}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover block"
              />
              <div
                className={S.videoLabel}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {peer?.name
                  ? `${peer.name}${peer.username ? ` · @${peer.username}` : ""}`
                  : "Stranger"}
              </div>

              {status === "idle" && (
                <div className={S.overlay}>
                  <div className="size-12 rounded-2xl bg-[rgba(0,229,255,0.08)] border border-[rgba(0,229,255,0.2)] flex items-center justify-center">
                    <Search size={20} style={{ color: "var(--accent)" }} />
                  </div>
                  <p
                    className="font-bold text-[0.95rem] text-white"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    Ready to connect
                  </p>
                  <p
                    className="text-[0.78rem] text-white/40"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Hit Search to find someone
                  </p>
                </div>
              )}

              {status === "queued" && (
                <div className={S.overlay}>
                  <div className={S.spinner} />
                  <span
                    className="text-[0.8rem] text-white/50"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Finding someone…
                  </span>
                </div>
              )}
            </div>

            {stats && isConnected && (
              <div
                className={S.statsB}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <div style={{ color: "var(--accent)", fontWeight: 500 }}>
                  {stats.quality}
                </div>
                <div>{stats.bitrate} kbps</div>
              </div>
            )}
          </div>

          {/* Chat sidebar */}
          <AnimatePresence>
            {isConnected && (
              <motion.div className={S.sidebar} {...slideInRight}>
                <div
                  className={S.sidebarHead}
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Chat
                </div>
                <div className={S.msgs}>
                  {messages.length === 0 && (
                    <p
                      className="text-[0.78rem] text-white/25 text-center mt-5"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Say hi 👋
                    </p>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={msg.fromSelf ? S.bubbleSelf : S.bubbleOther}
                      style={{
                        background: msg.fromSelf ? "var(--accent)" : undefined,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {msg.text}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form className={S.chatForm} onSubmit={handleSendMessage}>
                  <input
                    className={S.chatInput}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message…"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <button
                    type="submit"
                    className={S.sendBtn}
                    style={{ background: "var(--accent)" }}
                  >
                    <Send size={14} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ErrorBoundary>

      {/* Control bar */}
      <div className={S.ctrlBar}>
        <CtrlBtn
          icon={<Search size={18} />}
          label="Search"
          onClick={handleSearch}
          disabled={!mediaReady || status !== "idle"}
        />
        <CtrlBtn
          icon={<Square size={18} />}
          label="Stop"
          onClick={handleStopSearch}
          disabled={status !== "queued"}
        />
        <CtrlBtn
          icon={<PhoneOff size={18} />}
          label="End"
          onClick={handleEndCall}
          disabled={status !== "matched"}
          danger
        />
        <CtrlBtn
          icon={<SkipForward size={18} />}
          label="Skip"
          onClick={handleSkip}
          disabled={status !== "matched"}
          danger
        />
      </div>
    </div>
  );
}
