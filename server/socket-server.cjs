/**
 * Real-time WebSocket Server using Socket.IO for Student Apps
 * Al-Azhar Cairo Palembang
 *
 * KEAMANAN:
 * - Klien WAJIB menyertakan "capability token" (JWT HS256) yang diterbitkan dari
 *   endpoint /api/socket-token aplikasi Next.js. Token diverifikasi di sini
 *   memakai AUTH_SECRET yang sama — tanpa perlu koneksi ke database.
 * - Identitas pengirim (userId) SELALU diambil dari token yang terverifikasi,
 *   bukan dari data yang dikirim klien (mencegah pemalsuan senderId).
 * - join_room hanya diizinkan untuk ruang yang benar-benar milik pengguna
 *   (tercantum dalam token), dan lawan bicara (recipient) diturunkan dari token.
 */

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");

/**
 * Muat berkas .env secara manual (tanpa dependensi tambahan).
 *
 * Penting: proses ini berdiri sendiri, bukan bagian dari Next.js, sehingga TIDAK
 * ikut memuat .env secara otomatis. Tanpa loader ini, AUTH_SECRET jatuh ke nilai
 * fallback sementara aplikasi Next.js menandatangani capability token memakai
 * AUTH_SECRET dari .env — signature tidak cocok dan SEMUA handshake ditolak.
 *
 * Nilai yang sudah ada di environment (diset PM2, shell, atau CI) tidak ditimpa.
 * Lokasi .env dihitung dari __dirname agar tidak bergantung pada working directory.
 */
(function loadEnvFile() {
  let raw;
  try {
    raw = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
  } catch {
    return; // .env tidak tersedia: jalankan dengan environment yang sudah ada
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && !(key in process.env)) process.env[key] = value;
  }
})();

const PORT = process.env.SOCKET_PORT || process.env.PORT || 3001;

// Secret harus identik dengan src/lib/auth.ts & src/app/api/socket-token/route.ts
const AUTH_SECRET =
  process.env.AUTH_SECRET || "alazharsdsecretkey2026modernrebuild_at_least_32_chars_long!!";

// CORS: batasi via env SOCKET_CORS_ORIGIN (pisahkan koma). Default "*" agar dev mudah,
// namun untuk production disarankan diset ke domain aplikasi.
const ALLOWED_ORIGINS = (process.env.SOCKET_CORS_ORIGIN || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const ALLOW_ALL_ORIGIN = ALLOWED_ORIGINS.includes("*");

/** Dekode segmen base64url JWT menjadi string UTF-8. */
function b64urlDecode(str) {
  return Buffer.from(str, "base64url").toString("utf8");
}

/**
 * Verifikasi JWT HS256 manual memakai Node crypto (tanpa dependensi eksternal).
 * Mengembalikan payload bila valid & belum kedaluwarsa, selain itu null.
 */
function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [b64h, b64p, b64s] = parts;
  let header;
  let payload;
  try {
    header = JSON.parse(b64urlDecode(b64h));
    payload = JSON.parse(b64urlDecode(b64p));
  } catch {
    return null;
  }

  if (!header || header.alg !== "HS256") return null;

  const expectedSig = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(`${b64h}.${b64p}`)
    .digest();

  let givenSig;
  try {
    givenSig = Buffer.from(b64s, "base64url");
  } catch {
    return null;
  }

  if (givenSig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(givenSig, expectedSig)) return null;

  // Tolak token scope sesi biasa; hanya terima token khusus socket.
  if (payload.scope !== "socket") return null;

  // Cek kedaluwarsa (exp dalam detik, toleransi 30 dtk untuk skew jam).
  if (payload.exp && Date.now() / 1000 > payload.exp + 30) return null;

  return payload;
}

// Track online users: userId(String) -> Set of socketId
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
        activeSockets: typeof io !== "undefined" ? io.engine.clientsCount : 0,
        onlineUsersCount: onlineUsers.size,
      })
    );
    return;
  }

  res.writeHead(404);
  res.end();
});

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      if (ALLOW_ALL_ORIGIN || !origin || ALLOWED_ORIGINS.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("Origin tidak diizinkan oleh CORS socket"));
    },
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware: tolak koneksi tanpa token valid.
io.use((socket, next) => {
  const token =
    (socket.handshake.auth && socket.handshake.auth.token) ||
    (socket.handshake.query && socket.handshake.query.token);

  const payload = verifyToken(token);
  if (!payload || !payload.sub) {
    return next(new Error("UNAUTHORIZED_SOCKET_HANDSHAKE"));
  }

  socket.data.userId = String(payload.sub);
  socket.data.name = payload.name || "Pengguna";
  // Peta roomId -> otherUserId dari token (otoritatif, tidak bisa dipalsukan klien).
  socket.data.roomPeers = {};
  if (Array.isArray(payload.rooms)) {
    for (const item of payload.rooms) {
      if (item && item.r) socket.data.roomPeers[String(item.r)] = item.o ? String(item.o) : null;
    }
  }
  // Set ruang yang sudah diikuti socket ini (server-managed).
  socket.data.joined = new Set();

  return next();
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;

  // Channel notifikasi personal — hanya bisa dibuat oleh token milik user itu sendiri.
  socket.join(`user_${userId}`);
  addOnlineUser(userId, socket.id);

  // Bergabung ke ruang chat — validasi keanggotaan dari token.
  socket.on("join_room", ({ roomId }, callback) => {
    const ack = typeof callback === "function" ? callback : () => {};
    if (!roomId) return ack({ ok: false, error: "roomId tidak valid" });

    const key = String(roomId);
    // Klien hanya boleh masuk ruang yang terdaftar di capability token-nya.
    if (!Object.prototype.hasOwnProperty.call(socket.data.roomPeers, key)) {
      return ack({ ok: false, error: "Anda bukan peserta ruang ini" });
    }

    socket.join(`room_${key}`);
    socket.data.joined.add(key);
    return ack({ ok: true });
  });

  socket.on("leave_room", ({ roomId }) => {
    if (!roomId) return;
    const key = String(roomId);
    socket.leave(`room_${key}`);
    socket.data.joined.delete(key);
  });

  /**
   * Sinkronkan ulang daftar ruang dari token terbaru TANPA memutus koneksi.
   * `socket.data.roomPeers` ditetapkan saat handshake, sehingga ruang chat yang
   * dibuat setelah koneksi terbentuk tidak akan bisa diikuti sampai klien mengirim
   * token barunya ke sini.
   */
  socket.on("sync_rooms", (data, callback) => {
    const ack = typeof callback === "function" ? callback : () => {};
    const token = data && data.token;

    const payload = verifyToken(token);
    if (!payload || !payload.sub) {
      return ack({ ok: false, error: "TOKEN_TIDAK_VALID" });
    }

    // Izin hanya untuk diri sendiri: token milik user lain tidak bisa dipakai
    // menyuntikkan ruang orang lain ke koneksi ini.
    if (String(payload.sub) !== socket.data.userId) {
      return ack({ ok: false, error: "IDENTITAS_TIDAK_COCOK" });
    }

    const nextPeers = {};
    if (Array.isArray(payload.rooms)) {
      for (const item of payload.rooms) {
        if (item && item.r) nextPeers[String(item.r)] = item.o ? String(item.o) : null;
      }
    }
    socket.data.roomPeers = nextPeers;

    // Ruang yang sedang diikuti tapi tidak lagi ada di token baru: keluarkan.
    for (const key of Array.from(socket.data.joined)) {
      if (!Object.prototype.hasOwnProperty.call(nextPeers, key)) {
        socket.leave(`room_${key}`);
        socket.data.joined.delete(key);
      }
    }

    return ack({ ok: true, roomCount: Object.keys(nextPeers).length });
  });

  // Broadcast pesan real-time. Identitas & penerima ditentukan server (anti-spoof).
  socket.on("send_message", (data) => {
    if (!data || !data.roomId) return;
    const key = String(data.roomId);
    if (!socket.data.joined.has(key)) return; // tolak bila belum sah bergabung

    const roomKey = `room_${key}`;
    const recipientId = socket.data.roomPeers[key] || null;

    // Kunci fields yang tidak boleh dipalsukan klien.
    const payload = {
      ...data,
      roomId: key,
      senderId: socket.data.userId,
      senderName: socket.data.name,
      recipientId,
    };

    // Kirim ke anggota lain di ruang (pengirim memakai optimistic UI).
    socket.to(roomKey).emit("new_message", payload);

    // Beri tahu channel personal penerima untuk badge/preview.
    if (recipientId) {
      io.to(`user_${recipientId}`).emit("room_notification", {
        roomId: key,
        lastMessage: payload.message || "Lampiran",
        lastMessageAt: payload.createdAt || new Date().toISOString(),
        senderName: socket.data.name,
      });
    }
  });

  // Indikator mengetik.
  socket.on("typing", ({ roomId, isTyping }) => {
    if (!roomId) return;
    const key = String(roomId);
    if (!socket.data.joined.has(key)) return;
    socket.to(`room_${key}`).emit("user_typing", {
      roomId: key,
      senderId: socket.data.userId,
      senderName: socket.data.name,
      isTyping: !!isTyping,
    });
  });

  // Tanda sudah dibaca.
  socket.on("mark_read", ({ roomId }) => {
    if (!roomId) return;
    const key = String(roomId);
    if (!socket.data.joined.has(key)) return;
    socket.to(`room_${key}`).emit("messages_read", {
      roomId: key,
      readerId: socket.data.userId,
    });
  });

  // Edit pesan.
  socket.on("edit_message", ({ roomId, messageId, newMessage, editedAt }) => {
    if (!roomId || !messageId) return;
    const key = String(roomId);
    if (!socket.data.joined.has(key)) return;
    socket.to(`room_${key}`).emit("message_edited", {
      roomId: key,
      messageId,
      newMessage,
      editedAt: editedAt || new Date().toISOString(),
    });
  });

  // Hapus pesan.
  socket.on("delete_message", ({ roomId, messageId }) => {
    if (!roomId || !messageId) return;
    const key = String(roomId);
    if (!socket.data.joined.has(key)) return;
    socket.to(`room_${key}`).emit("message_deleted", {
      roomId: key,
      messageId,
    });
  });

  // Snapshot daftar user yang sedang online (untuk akurasi presence saat load awal).
  socket.on("request_online_users", (callback) => {
    if (typeof callback !== "function") return;
    callback(Array.from(onlineUsers.keys()));
  });

  // Cek status online untuk daftar id tertentu.
  socket.on("check_online_users", (userIds, callback) => {
    if (typeof callback !== "function") return;
    if (!Array.isArray(userIds)) return callback([]);
    callback(userIds.filter((id) => onlineUsers.has(String(id))));
  });

  socket.on("disconnect", () => {
    removeOnlineUser(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`[Socket.IO] Real-time server running on http://localhost:${PORT}`);
});
