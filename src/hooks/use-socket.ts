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
}

export function useSocket({
  userId,
  userName,
  activeRoomId,
  onNewMessage,
  onUserTyping,
  onMessagesRead,
  onRoomNotification,
}: UseSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Store latest callbacks in refs so socket listeners don't rebind frequently
  const onNewMessageRef = useRef(onNewMessage);
  const onUserTypingRef = useRef(onUserTyping);
  const onMessagesReadRef = useRef(onMessagesRead);
  const onRoomNotificationRef = useRef(onRoomNotification);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onUserTypingRef.current = onUserTyping;
    onMessagesReadRef.current = onMessagesRead;
    onRoomNotificationRef.current = onRoomNotification;
  });

  useEffect(() => {
    if (!userId) return;

    // Determine socket server URL
    let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl && typeof window !== "undefined") {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      socketUrl = `${protocol}//${hostname}:3001`;
    }

    const socket: Socket = io(socketUrl || "http://localhost:3001", {
      query: {
        userId,
        userName,
      },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("new_message", (data) => {
      if (onNewMessageRef.current) {
        onNewMessageRef.current(data);
      }
    });

    socket.on("user_typing", (data) => {
      if (onUserTypingRef.current) {
        onUserTypingRef.current(data);
      }
    });

    socket.on("messages_read", (data) => {
      if (onMessagesReadRef.current) {
        onMessagesReadRef.current(data);
      }
    });

    socket.on("room_notification", (data) => {
      if (onRoomNotificationRef.current) {
        onRoomNotificationRef.current(data);
      }
    });

    socket.on("user_status_changed", ({ userId: changedId, isOnline }: { userId: string; isOnline: boolean }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(changedId);
        } else {
          next.delete(changedId);
        }
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, userName]);

  // Handle joining room when activeRoomId changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeRoomId) return;

    socket.emit("join_room", { roomId: activeRoomId });

    return () => {
      socket.emit("leave_room", { roomId: activeRoomId });
    };
  }, [activeRoomId, isConnected]);

  const emitMessage = useCallback((data: any) => {
    if (socketRef.current) {
      socketRef.current.emit("send_message", data);
    }
  }, []);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (socketRef.current && activeRoomId) {
        socketRef.current.emit("typing", {
          roomId: activeRoomId,
          senderId: userId,
          senderName: userName,
          isTyping,
        });
      }
    },
    [activeRoomId, userId, userName]
  );

  const emitMarkRead = useCallback(() => {
    if (socketRef.current && activeRoomId) {
      socketRef.current.emit("mark_read", {
        roomId: activeRoomId,
        readerId: userId,
      });
    }
  }, [activeRoomId, userId]);

  return {
    isConnected,
    onlineUsers,
    emitMessage,
    emitTyping,
    emitMarkRead,
  };
}
