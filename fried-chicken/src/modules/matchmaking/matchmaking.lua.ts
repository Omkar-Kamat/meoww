export const POP_OR_ENQUEUE_SCRIPT = `
local queueKey = KEYS[1]
local userId = ARGV[1]

-- Never match a user against themselves if they're somehow still in the queue
redis.call('SREM', queueKey, userId)

local partnerId = redis.call('SPOP', queueKey)
if partnerId then
    return partnerId
else
    redis.call('SADD', queueKey, userId)
    return false
end
`;

export const CREATE_ROOM_SCRIPT = `
local roomKey = KEYS[1]
local userARoomKey = KEYS[2]
local userBRoomKey = KEYS[3]
local userA = ARGV[1]
local userB = ARGV[2]
local roomId = ARGV[3]
local ttl = tonumber(ARGV[4])

redis.call('HSET', roomKey, 'user1', userA, 'user2', userB)
redis.call('EXPIRE', roomKey, ttl)
redis.call('SET', userARoomKey, roomId, 'EX', ttl)
redis.call('SET', userBRoomKey, roomId, 'EX', ttl)

return roomId
`;