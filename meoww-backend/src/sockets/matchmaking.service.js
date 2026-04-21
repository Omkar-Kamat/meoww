import { v4 as uuidv4 } from "uuid";
import redisClient from "../config/redis.js";

// io is set once when the socket server initialises.
// All emits go through io.to(socketId) so the Redis adapter
// can route them cross-process — no local socket references needed.
let io;
export const init = (ioInstance) => { io = ioInstance; };

// ── Redis key helpers ─────────────────────────────────────────────────────────
const QUEUE_KEY         = "mm:queue";
const roomKey       = (id) => `mm:room:${id}`;
const userRoomKey   = (id) => `mm:userroom:${id}`;
const userSocketKey = (id) => `mm:usersocket:${id}`;

// ── Internal helpers ──────────────────────────────────────────────────────────

async function getPeerId(roomId, userId) {
    const room = await redisClient.hGetAll(roomKey(roomId));
    if (!room?.user1) return null;
    return room.user1 === userId ? room.user2 : room.user1;
}

async function leaveRoom(userId) {
    const roomId = await redisClient.get(userRoomKey(userId));
    if (!roomId) return;

    const peerId = await getPeerId(roomId, userId);

    if (peerId) {
        const peerSocketId = await redisClient.get(userSocketKey(peerId));
        if (peerSocketId) {
            io.to(peerSocketId).emit("peer-disconnected");
        }
        await redisClient.del(userRoomKey(peerId));
    }

    await redisClient.del(roomKey(roomId));
    await redisClient.del(userRoomKey(userId));
}

function removeFromQueue(userId) {
    return redisClient.sRem(QUEUE_KEY, userId);
}

async function fullCleanup(userId) {
    await removeFromQueue(userId);
    await leaveRoom(userId);
    await redisClient.del(userSocketKey(userId));
}

// ── Exported handlers ─────────────────────────────────────────────────────────

export const handleSearch = async (socket) => {
    const userId = socket.userId;

    // Refresh socket ID on every search — covers the reconnect case where
    // the user has a new socket ID but the old key is still in Redis.
    await redisClient.set(userSocketKey(userId), socket.id);

    const [alreadyQueued, alreadyInRoom] = await Promise.all([
        redisClient.sIsMember(QUEUE_KEY, userId),
        redisClient.get(userRoomKey(userId)),
    ]);
    if (alreadyQueued || alreadyInRoom) return;

    const queueSize = await redisClient.sCard(QUEUE_KEY);
    if (queueSize === 0) {
        await redisClient.sAdd(QUEUE_KEY, userId);
        socket.emit("queued", { position: await redisClient.sCard(QUEUE_KEY) });
        return;
    }

    // Atomically pop a waiting user — avoids the race between sCard and sPop
    const partnerId = await redisClient.sPop(QUEUE_KEY);

    if (!partnerId || partnerId === userId) {
        await redisClient.sAdd(QUEUE_KEY, userId);
        socket.emit("queued", { position: await redisClient.sCard(QUEUE_KEY) });
        return;
    }

    const partnerSocketId = await redisClient.get(userSocketKey(partnerId));

    if (!partnerSocketId) {
        // Partner has no registered socket — discard and requeue self
        await redisClient.sAdd(QUEUE_KEY, userId);
        socket.emit("queued", { position: await redisClient.sCard(QUEUE_KEY) });
        return;
    }

    // fetchSockets() works cross-process via the Redis adapter.
    // Returns empty array if the socket no longer exists on any process.
    const liveSockets = await io.in(partnerSocketId).fetchSockets();
    if (liveSockets.length === 0) {
        // Stale socket ID — clean up partner's key and requeue self
        await redisClient.del(userSocketKey(partnerId));
        await redisClient.sAdd(QUEUE_KEY, userId);
        socket.emit("queued", { position: await redisClient.sCard(QUEUE_KEY) });
        return;
    }

    // Both sockets live — create room
    const roomId    = uuidv4();
    const initiator = Math.random() > 0.5 ? userId : partnerId;

    await Promise.all([
        redisClient.hSet(roomKey(roomId), { user1: userId, user2: partnerId }),
        redisClient.set(userRoomKey(userId),    roomId),
        redisClient.set(userRoomKey(partnerId), roomId),
        // Auto-expire stale keys after 24 h
        redisClient.expire(roomKey(roomId),          86400),
        redisClient.expire(userRoomKey(userId),      86400),
        redisClient.expire(userRoomKey(partnerId),   86400),
    ]);

    io.to(socket.id).emit("matched",      { roomId, isInitiator: userId    === initiator });
    io.to(partnerSocketId).emit("matched", { roomId, isInitiator: partnerId === initiator });
};

export const handleOffer = async (socket, { offer }) => {
    const roomId = await redisClient.get(userRoomKey(socket.userId));
    if (!roomId) return;
    const peerId = await getPeerId(roomId, socket.userId);
    if (!peerId) return;
    const peerSocketId = await redisClient.get(userSocketKey(peerId));
    if (peerSocketId) io.to(peerSocketId).emit("offer", { offer });
};

export const handleAnswer = async (socket, { answer }) => {
    const roomId = await redisClient.get(userRoomKey(socket.userId));
    if (!roomId) return;
    const peerId = await getPeerId(roomId, socket.userId);
    if (!peerId) return;
    const peerSocketId = await redisClient.get(userSocketKey(peerId));
    if (peerSocketId) io.to(peerSocketId).emit("answer", { answer });
};

export const handleIceCandidate = async (socket, { candidate }) => {
    const roomId = await redisClient.get(userRoomKey(socket.userId));
    if (!roomId) return;
    const peerId = await getPeerId(roomId, socket.userId);
    if (!peerId) return;
    const peerSocketId = await redisClient.get(userSocketKey(peerId));
    if (peerSocketId) io.to(peerSocketId).emit("ice-candidate", { candidate });
};

export const handleSkip = async (socket) => {
    await removeFromQueue(socket.userId);
    await leaveRoom(socket.userId);
};

export const handleStopSearch = (socket) => {
    return removeFromQueue(socket.userId);
};

export const handleMessage = async (socket, data) => {
    if (!data || typeof data.text !== "string") return;
    const text = data.text.trim();
    if (text.length === 0 || text.length > 500) return;

    const roomId = await redisClient.get(userRoomKey(socket.userId));
    if (!roomId) return;
    const peerId = await getPeerId(roomId, socket.userId);
    if (!peerId) return;

    const peerSocketId = await redisClient.get(userSocketKey(peerId));
    if (peerSocketId) {
        io.to(peerSocketId).emit("receive-message", { text, fromSelf: false });
        socket.emit("receive-message",               { text, fromSelf: true  });
    }
};

export const handleDisconnect = (socket) => {
    return fullCleanup(socket.userId);
};