/**
 * Real-time WebSocket Server using Socket.IO for Student Apps
 * Al-Azhar Cairo Palembang
 */

const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.SOCKET_PORT || process.env.PORT || 3001;

// Create HTTP Server with simple health check
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        uptime: process.uptime(),
        activeSockets: io.engine.clientsCount,
        onlineUsersCount: onlineUsers.size,
      })
    );
    return;
  }

  res.writeHead(404);
  res.end();
});

// Setup Socket.IO with permissive CORS for development and deployment
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Track online users: userId -> Set of socketId
const onlineUsers = new Map();

function addOnlineUser(userId, socketId) {
  if (!userId) return;
  const strId = String(userId);
  if (!onlineUsers.has(strId)) {
    onlineUsers.set(strId, new Set());
  }
  onlineUsers.get(strId).add(socketId);
  io.emit("user_status_changed", { userId: strId, isOnline: true });
}

function removeOnlineUser(socketId) {
  for (const [userId, socketSet] of onlineUsers.entries()) {
    if (socketSet.has(socketId)) {
      socketSet.delete(socketId);
      if (socketSet.size === 0) {
        onlineUsers.delete(userId);
        io.emit("user_status_changed", { userId, isOnline: false });
      }
      break;
    }
  }
}

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  const userName = socket.handshake.query.userName || "Pengguna";

  if (userId) {
    addOnlineUser(userId, socket.id);
    // Join personal notification channel
    socket.join(`user_${userId}`);
  }

  // Join a specific chat room
  socket.on("join_room", ({ roomId }) => {
    if (!roomId) return;
    const roomKey = `room_${roomId}`;
    socket.join(roomKey);
  });

  // Leave room
  socket.on("leave_room", ({ roomId }) => {
    if (!roomId) return;
    socket.leave(`room_${roomId}`);
  });

  // Real-time message broadcast
  socket.on("send_message", (data) => {
    if (!data || !data.roomId) return;
    const roomKey = `room_${data.roomId}`;

    // Broadcast to everyone in the room (including sender or sender can use local state)
    socket.to(roomKey).emit("new_message", data);

    // If recipientId is known, notify recipient's personal channel to update unread badge / sidebar
    if (data.recipientId) {
      socket.to(`user_${data.recipientId}`).emit("room_notification", {
        roomId: data.roomId,
        lastMessage: data.message || "Lampiran",
        lastMessageAt: data.createdAt || new Date().toISOString(),
        senderName: data.senderName,
      });
    }
  });

  // Typing indicator
  socket.on("typing", ({ roomId, senderId, senderName, isTyping }) => {
    if (!roomId) return;
    socket.to(`room_${roomId}`).emit("user_typing", {
      roomId,
      senderId,
      senderName,
      isTyping: !!isTyping,
    });
  });

  // Read receipts
  socket.on("mark_read", ({ roomId, readerId }) => {
    if (!roomId) return;
    socket.to(`room_${roomId}`).emit("messages_read", {
      roomId,
      readerId,
    });
  });

  // Check online status of specific user IDs
  socket.on("check_online_users", (userIds, callback) => {
    if (typeof callback !== "function") return;
    if (!Array.isArray(userIds)) {
      return callback([]);
    }
    const onlineList = userIds.filter((id) => onlineUsers.has(String(id)));
    callback(onlineList);
  });

  // Disconnect handler
  socket.on("disconnect", () => {
    removeOnlineUser(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`[Socket.IO] Real-time server running on http://localhost:${PORT}`);
});
