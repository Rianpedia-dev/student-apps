"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketProps {
  userId: string;
  userName: string;
  activeRoomId?: string | null;
  onNewMessage?: (message: any) => void;
  onUserTyping?: (data: { roomId: string; senderId: string; senderName: string; isTyping: boolean }) => void;
  onMessagesRead?: (data: { roomId: string; readerId: string }) => void;
  onRoomNotification?: (data: { roomId: string; lastMessage: string; lastMessageAt: string; senderName: string }) => void;
  onMessageEdited?: (data: { roomId: string; messageId: string; newMessage: string; editedAt: string }) => void;
  onMessageDeleted?: (data: { roomId: string; messageId: string }) => void;
}

/**
 * Menentukan URL dasar server Socket.IO.
 * - Prioritas: NEXT_PUBLIC_SOCKET_URL (diset eksplisit di .env).
 * - Dev (localhost): otomatis ke port 3001 pada host yang sama.
 * - Production: pakai origin aplikasi yang sama (window.location.origin),
 *   dengan asumsi reverse-proxy meneruskan path /socket.io ke service socket.
 *   Ini menghindari masalah "mixed content" HTTPS dan port terbuka.
 */
function resolveSocketUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (fromEnv) return fromEnv;

  if (typeof window === "undefined") return "";

  const { protocol, hostname, origin } = window.location;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  if (isLocal) return `${protocol}//${hostname}:3001`;
  return origin;
}

/**
 * Umur capability token adalah 15 menit (lihat /api/socket-token).
 * Segarkan lebih awal agar tidak kedaluwarsa di tengah sesi chat.
 */
const TOKEN_REFRESH_MS = 12 * 60 * 1000;

export function useSocket({
  userId,
  userName,
  activeRoomId,
  onNewMessage,
  onUserTyping,
  onMessagesRead,
  onRoomNotification,
  onMessageEdited,
  onMessageDeleted,
}: UseSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Simpan callback terkini di ref agar listener tidak sering re-bind.
  const onNewMessageRef = useRef(onNewMessage);
  const onUserTypingRef = useRef(onUserTyping);
  const onMessagesReadRef = useRef(onMessagesRead);
  const onRoomNotificationRef = useRef(onRoomNotification);
  const onMessageEditedRef = useRef(onMessageEdited);
  const onMessageDeletedRef = useRef(onMessageDeleted);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onUserTypingRef.current = onUserTyping;
    onMessagesReadRef.current = onMessagesRead;
    onRoomNotificationRef.current = onRoomNotification;
    onMessageEditedRef.current = onMessageEdited;
    onMessageDeletedRef.current = onMessageDeleted;
  });

  // Ambil capability token dari aplikasi (dibuat berdasarkan sesi httpOnly).
  const fetchSocketToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/socket-token", { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      tokenRef.current = data.token || null;
      return tokenRef.current;
    } catch {
      return null;
    }
  }, []);

  /**
   * Kirim token terbaru ke koneksi yang sedang hidup agar server menyusun ulang
   * daftar ruang yang boleh diikuti. Tanpa ini, `socket.data.roomPeers` di server
   * tetap berisi daftar lama dari handshake, sehingga ruang chat yang baru dibuat
   * tidak bisa diikuti sampai halaman dimuat ulang.
   */
  const syncRoomsOnLiveSocket = useCallback((token: string) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;
    socket.emit("sync_rooms", { token }, (res: any) => {
      if (res && res.ok === false) {
        console.warn("[Socket] sync_rooms ditolak:", res.error);
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    let refreshTimer: ReturnType<typeof setInterval> | null = null;
    let tokenRetryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      // Token wajib untuk handshake yang terautentikasi.
      const token = await fetchSocketToken();
      if (cancelled) return;
      if (!token) {
        // Belum dapat token (mis. sesi belum terbaca). Coba lagi beberapa kali
        // agar real-time tidak mati permanen sampai halaman dimuat ulang.
        console.warn(
          "[Socket] Belum memperoleh token sesi; real-time ditunda, akan dicoba lagi."
        );
        tokenRetryTimer = setTimeout(() => {
          if (!cancelled) connect();
        }, 5000);
        return;
      }

      const socketUrl = resolveSocketUrl();

      const socket: Socket = io(socketUrl || undefined, {
        // Bentuk function: tiap (re)connection membaca token terkini dari ref,
        // sehingga token lama/kedaluwarsa tidak dipakai ulang oleh auto-reconnect.
        auth: (cb: (data: object) => void) => cb({ token: tokenRef.current || "" }),
        query: { userName },
        // Urutan transport menentukan koneksi AWAL: engine.io selalu mencoba
        // elemen pertama lebih dulu. Menaruh "websocket" di depan membuat
        // koneksi langsung mati ("websocket error") saat WS ditolak — mis. server
        // belum berjalan atau diblokir proxy — karena tidak ada fallback ke
        // polling. Pola bawaan (polling lalu upgrade ke WS) tetap berakhir di
        // WebSocket, hanya dengan satu permintaan tambahan saat awal.
        transports: ["polling", "websocket"],
        // Bila polling gagal (server mati), coba transport berikutnya alih-alih
        // langsung membatalkan koneksi.
        tryAllTransports: true,
        // Pulih otomatis tanpa batas. Dulu reconnectionAttempts: 10 sehingga
        // setelah server socket sempat mati, real-time mati permanen sampai
        // halaman dimuat ulang. Backoff + jitter mencegah stampede saat pulih.
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 15000,
        randomizationFactor: 0.5,
        timeout: 10000,
        // withCredentials sengaja TIDAK dipakai: autentikasi berjalan lewat
        // capability token, bukan cookie. Server socket juga tidak mengirim
        // header Access-Control-Allow-Credentials, sehingga permintaan XHR
        // lintas origin (localhost:3000 -> localhost:3001) justru akan
        // diblokir browser bila flag ini dinyalakan.
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setIsConnected(true);
        // Minta snapshot daftar user online agar titik hijau akurat sejak awal.
        socket.emit("request_online_users", (ids: string[]) => {
          if (Array.isArray(ids)) {
            setOnlineUsers(new Set(ids.map((id) => String(id))));
          }
        });

        // Ruang yang dibuat selama koneksi terputus tidak tercatat di token saat
        // handshake, jadi segarkan izin ruang begitu tersambung ulang.
        void (async () => {
          const fresh = await fetchSocketToken();
          if (!cancelled && fresh) syncRoomsOnLiveSocket(fresh);
        })();
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      socket.on("connect_error", (err) => {
        setIsConnected(false);
        const msg = err?.message || "";
        if (/UNAUTHORIZED|handshake/i.test(msg)) {
          // Token ditolak/kedaluwarsa. Ambil yang baru; fungsi `auth` di atas akan
          // memakainya pada percobaan ulang berikutnya.
          console.error("[Socket] Token ditolak, memperbarui capability token.");
          fetchSocketToken();
        } else {
          // Kegagalan transport (umumnya server real-time belum berjalan) bukan
          // kesalahan aplikasi, jadi cukup peringatan agar tidak memicu error overlay.
          console.warn(
            `[Socket] Gagal terhubung ke ${socketUrl} (${msg}). ` +
              `Pastikan server real-time berjalan: npm run socket`
          );
        }
      });

      socket.on("new_message", (data) => onNewMessageRef.current?.(data));
      socket.on("user_typing", (data) => onUserTypingRef.current?.(data));
      socket.on("messages_read", (data) => onMessagesReadRef.current?.(data));
      socket.on("room_notification", (data) => onRoomNotificationRef.current?.(data));
      socket.on("message_edited", (data) => onMessageEditedRef.current?.(data));
      socket.on("message_deleted", (data) => onMessageDeletedRef.current?.(data));

      socket.on(
        "user_status_changed",
        ({ userId: changedId, isOnline }: { userId: string; isOnline: boolean }) => {
          setOnlineUsers((prev) => {
            const next = new Set(prev);
            if (isOnline) next.add(String(changedId));
            else next.delete(String(changedId));
            return next;
          });
        }
      );

      // Segarkan token berkala sebelum kedaluwarsa, lalu sinkronkan daftar ruang
      // ke koneksi yang sedang hidup.
      refreshTimer = setInterval(async () => {
        const fresh = await fetchSocketToken();
        if (fresh && !cancelled) syncRoomsOnLiveSocket(fresh);
      }, TOKEN_REFRESH_MS);
    };

    connect();

    return () => {
      cancelled = true;
      if (refreshTimer) clearInterval(refreshTimer);
      if (tokenRetryTimer) clearTimeout(tokenRetryTimer);
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
    // userId userName stabil dalam sesi; token di-refresh terpisah saat perlu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userName]);

  // Bergabung/keluar ruang saat activeRoomId berubah (memakai token terkini).
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected || !activeRoomId) return;

    socket.emit("join_room", { roomId: activeRoomId }, (res: any) => {
      if (res && res.ok === false) {
        console.warn("[Socket] join_room ditolak:", res.error);
      }
    });

    return () => {
      socket.emit("leave_room", { roomId: activeRoomId });
    };
  }, [activeRoomId, isConnected]);

  /**
   * Perbarui capability token. Panggil setelah ruang baru dibuat agar socket
   * memiliki izin join ke ruang tersebut (daftar rooms dikandung token).
   * Token baru juga dikirim ke koneksi hidup lewat sync_rooms sehingga tidak
   * perlu memuat ulang halaman untuk ruang yang baru saja dibuat.
   */
  const refreshSocketToken = useCallback(async () => {
    const token = await fetchSocketToken();
    if (token) syncRoomsOnLiveSocket(token);
  }, [fetchSocketToken, syncRoomsOnLiveSocket]);

  const emitMessage = useCallback((data: any) => {
    socketRef.current?.emit("send_message", data);
  }, []);

  const emitEditMessage = useCallback(
    (data: { roomId: string; messageId: string; newMessage: string; editedAt?: string }) => {
      socketRef.current?.emit("edit_message", data);
    },
    []
  );

  const emitDeleteMessage = useCallback((data: { roomId: string; messageId: string }) => {
    socketRef.current?.emit("delete_message", data);
  }, []);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (socketRef.current && activeRoomId) {
        socketRef.current.emit("typing", { roomId: activeRoomId, isTyping });
      }
    },
    [activeRoomId]
  );

  const emitMarkRead = useCallback(() => {
    if (socketRef.current && activeRoomId) {
      socketRef.current.emit("mark_read", { roomId: activeRoomId });
    }
  }, [activeRoomId]);

  return {
    isConnected,
    onlineUsers,
    emitMessage,
    emitEditMessage,
    emitDeleteMessage,
    emitTyping,
    emitMarkRead,
    refreshSocketToken,
  };
}
