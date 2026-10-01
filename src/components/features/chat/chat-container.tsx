"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCheck,
  ChevronDown,
  CircleSlash,
  Copy,
  Download,
  Edit3,
  File,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Mic,
  Paperclip,
  Search,
  Send,
  Smile,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CardDescription, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  sendMessageAction,
  editMessageAction,
  deleteMessageAction,
  getRoomMessages,
  getOrCreateChatRoom,
} from "@/actions/chat";
import { useSocket } from "@/hooks/use-socket";
import { toast } from "sonner";

interface ChatContact {
  id: string;
  name: string;
  image?: string | null;
  email: string;
  subtitle: string;
  badge?: string | null;
  category?: "guru" | "siswa";
}

interface ChatRoom {
  id: string;
  otherUser: {
    id: string;
    name: string;
    image?: string | null;
    email: string;
    role: string;
    kelas?: string | null;
    guru_bidang?: string | null;
  };
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface ChatContainerProps {
  currentUserId: string;
  currentUserName?: string;
  currentUserRole: "siswa" | "guru" | "admin";
  initialRooms: ChatRoom[];
  contacts: ChatContact[];
  initialActiveRoomId?: string | null;
  initialTargetUserId?: string | null;
}

interface UnifiedChatItem {
  contactId: string;
  name: string;
  image: string | null;
  email: string;
  subtitle: string;
  badge?: string | null;
  hasRoom: boolean;
  roomId?: string;
  room?: ChatRoom;
  contact?: ChatContact;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
  category?: "guru" | "siswa";
}

// Helpers for attachments and WhatsApp style dates
function getAttachmentDisplayName(url?: string | null, customName?: string | null) {
  if (customName) return customName;
  if (!url) return "Dokumen";
  try {
    if (url.startsWith("blob:")) return "Dokumen Lampiran";
    const raw = url.split("?")[0].split("/").pop() || "";
    const clean = raw.replace(/^chat-\d+-/, "");
    return decodeURIComponent(clean) || "Dokumen";
  } catch {
    return "Dokumen";
  }
}

function getAttachmentExtension(url?: string | null, customName?: string | null) {
  const target = customName || url;
  if (!target || target.startsWith("blob:")) return "";
  try {
    const filename = target.split("?")[0].split("/").pop() || "";
    if (!filename.includes(".")) return "";
    const parts = filename.split(".");
    const ext = parts.pop() || "";
    if (/^[a-zA-Z0-9]{1,5}$/.test(ext)) {
      return ext.toUpperCase();
    }
    return "";
  } catch {
    return "";
  }
}

function isEditable(createdAtStr?: string | null) {
  if (!createdAtStr) return false;
  try {
    const created = new Date(createdAtStr).getTime();
    if (isNaN(created)) return false;
    const diffHours = (Date.now() - created) / (1000 * 60 * 60);
    return diffHours <= 12;
  } catch {
    return false;
  }
}

function formatMessageTime(dateStr?: string | null) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function getMessageDateKey(dateStr?: string | null) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  } catch {
    return "";
  }
}

function formatMessageDateHeader(dateStr?: string | null) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Kemarin";
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatChatListTime(dateStr?: string | null) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return "Kemarin";

    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

export function ChatContainer({
  currentUserId,
  currentUserName = "Pengguna",
  currentUserRole,
  initialRooms,
  contacts,
  initialActiveRoomId,
  initialTargetUserId,
}: ChatContainerProps) {
  const searchParams = useSearchParams();
  const searchUserId = searchParams.get("guruId") || searchParams.get("userId") || searchParams.get("siswaId");
  const searchRoomId = searchParams.get("roomId");

  const effectiveTargetUserId = searchUserId || initialTargetUserId || null;
  const effectiveTargetRoomId = searchRoomId || initialActiveRoomId || null;

  // Resolve initial selected room or contact
  const initialSelection = useMemo(() => {
    if (effectiveTargetRoomId) {
      const match = initialRooms.find((r) => r.id === effectiveTargetRoomId);
      if (match) return { room: match, contact: match.otherUser };
    }
    if (effectiveTargetUserId) {
      const matchRoom = initialRooms.find(
        (r) => String(r.otherUser?.id) === String(effectiveTargetUserId)
      );
      if (matchRoom) return { room: matchRoom, contact: matchRoom.otherUser };

      const matchContact = contacts.find(
        (c) => String(c.id) === String(effectiveTargetUserId)
      );
      if (matchContact) {
        return {
          room: null,
          contact: {
            id: matchContact.id,
            name: matchContact.name,
            image: matchContact.image,
            email: matchContact.email,
            role: matchContact.category === "guru" ? "Guru" : "Siswa",
            kelas: matchContact.badge,
            guru_bidang: matchContact.subtitle,
          },
        };
      }
    }
    if (initialRooms.length > 0) {
      return { room: initialRooms[0], contact: initialRooms[0].otherUser };
    }
    return { room: null, contact: null };
  }, [initialRooms, contacts, effectiveTargetRoomId, effectiveTargetUserId]);

  // State: Chat rooms & active chat
  const [rooms, setRooms] = useState<ChatRoom[]>(initialRooms);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(
    initialSelection.room ? initialSelection.room.id : null
  );
  const [activeContact, setActiveContact] = useState<any>(
    initialSelection.contact
  );

  // Sync rooms state when initialRooms changes
  useEffect(() => {
    setRooms(initialRooms);
  }, [initialRooms]);

  // State: Messages & Input
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unread">("all");
  const [isSending, setIsSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Edit & Delete Message state
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);

  // In WhatsApp Mobile, users start on the Chats list tab UNLESS a specific chat was opened
  const [showMobileList, setShowMobileList] = useState(
    !(effectiveTargetRoomId || effectiveTargetUserId)
  );

  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Socket.IO hook for real-time messaging
  const {
    isConnected,
    onlineUsers,
    emitMessage,
    emitEditMessage,
    emitDeleteMessage,
    emitTyping,
    emitMarkRead,
  } = useSocket({
    userId: currentUserId,
    userName: currentUserName,
    activeRoomId,
    onNewMessage: (msg) => {
      if (msg.roomId === activeRoomId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setOtherUserTyping(null);
        emitMarkRead();
      }

      // Update rooms list
      setRooms((prev) => {
        const roomExists = prev.some((r) => r.id === msg.roomId);
        if (roomExists) {
          return prev.map((r) =>
            r.id === msg.roomId
              ? {
                ...r,
                lastMessage: msg.message || "Lampiran",
                lastMessageAt: msg.createdAt || new Date().toISOString(),
                unreadCount:
                  msg.roomId === activeRoomId ? 0 : r.unreadCount + 1,
              }
              : r
          );
        }
        return prev;
      });
    },
    onUserTyping: (data) => {
      if (data.roomId === activeRoomId && data.senderId !== currentUserId) {
        setOtherUserTyping(data.isTyping ? data.senderName : null);
      }
    },
    onMessagesRead: (data) => {
      if (data.roomId === activeRoomId) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    },
    onRoomNotification: (data) => {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === data.roomId
            ? {
              ...r,
              lastMessage: data.lastMessage,
              lastMessageAt: data.lastMessageAt,
            }
            : r
        )
      );
    },
    onMessageEdited: (data) => {
      if (data.roomId === activeRoomId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? {
                ...m,
                message: data.newMessage,
                isEdited: true,
                editedAt: data.editedAt,
              }
              : m
          )
        );
      }
      setRooms((prev) =>
        prev.map((r) =>
          r.id === data.roomId
            ? { ...r, lastMessage: data.newMessage }
            : r
        )
      );
    },
    onMessageDeleted: (data) => {
      if (data.roomId === activeRoomId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? {
                ...m,
                message: "Pesan ini telah dihapus",
                isDeleted: true,
                attachmentUrl: null,
                attachmentType: null,
              }
              : m
          )
        );
      }
      setRooms((prev) =>
        prev.map((r) =>
          r.id === data.roomId
            ? { ...r, lastMessage: "🚫 Pesan ini telah dihapus" }
            : r
        )
      );
    },
  });

  // Load messages when active room changes
  useEffect(() => {
    if (!activeRoomId) return;

    let isMounted = true;
    const fetchMsgs = async () => {
      try {
        const data = await getRoomMessages(activeRoomId);
        if (isMounted) {
          setMessages(data);
          emitMarkRead();
        }
      } catch (err) {
        console.error("Gagal memuat pesan:", err);
      }
    };

    fetchMsgs();

    return () => {
      isMounted = false;
    };
  }, [activeRoomId, emitMarkRead]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherUserTyping]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    emitTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 1500);
  };

  // Start chat with a contact from list
  const handleStartChatWithContact = async (contact: ChatContact) => {
    try {
      const res = await getOrCreateChatRoom(contact.id);
      if (res.success && res.room) {
        setActiveRoomId(res.room.id);
        setActiveContact({
          id: contact.id,
          name: contact.name,
          image: contact.image,
          email: contact.email,
          role: contact.category === "guru" ? "Guru" : "Siswa",
          kelas: contact.badge,
          guru_bidang: contact.subtitle,
        });

        // Add to rooms if not yet there
        setRooms((prev) => {
          if (prev.some((r) => r.id === res.room.id)) return prev;
          return [
            {
              id: res.room.id,
              otherUser: {
                id: contact.id,
                name: contact.name,
                image: contact.image,
                email: contact.email,
                role: contact.category === "guru" ? "Guru" : "Siswa",
                kelas: contact.badge,
                guru_bidang: contact.subtitle,
              },
              lastMessage: "Mulai percakapan baru",
              lastMessageAt: new Date().toISOString(),
              unreadCount: 0,
            },
            ...prev,
          ];
        });

        setShowMobileList(false);
      } else {
        toast.error(res.error || "Gagal membuka percakapan.");
      }
    } catch {
      toast.error("Terjadi kendala saat membuka obrolan.");
    }
  };

  // Otomatis arahkan ke room guru/siswa yang ditargetkan jika ada parameter URL atau prop
  useEffect(() => {
    if (!effectiveTargetUserId && !effectiveTargetRoomId) return;

    if (effectiveTargetRoomId) {
      const match = rooms.find((r) => r.id === effectiveTargetRoomId);
      if (match) {
        setActiveRoomId(match.id);
        setActiveContact(match.otherUser);
        setShowMobileList(false);
        return;
      }
    }

    if (effectiveTargetUserId) {
      const matchRoom = rooms.find(
        (r) => String(r.otherUser?.id) === String(effectiveTargetUserId)
      );
      if (matchRoom) {
        setActiveRoomId(matchRoom.id);
        setActiveContact(matchRoom.otherUser);
        setShowMobileList(false);
        return;
      }

      const matchContact = contacts.find(
        (c) => String(c.id) === String(effectiveTargetUserId)
      );
      if (matchContact) {
        handleStartChatWithContact(matchContact);
      } else {
        getOrCreateChatRoom(effectiveTargetUserId).then((res) => {
          if (res.success && res.room) {
            setActiveRoomId(res.room.id);
            setShowMobileList(false);
          }
        });
      }
    }
  }, [effectiveTargetUserId, effectiveTargetRoomId, rooms, contacts]);

  // Copy message text to clipboard
  const handleCopyMessage = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Pesan disalin ke papan klip");
  };

  // Download file or image attachment
  const handleDownloadFile = async (url?: string | null, defaultName?: string) => {
    if (!url) return;
    const toastId = toast.loading("Mengunduh file...");
    try {
      const fileName = defaultName || getAttachmentDisplayName(url);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengambil file.");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success(`Berhasil mengunduh ${fileName}`, { id: toastId });
    } catch {
      // Fallback: direct anchor download
      const a = document.createElement("a");
      a.href = url;
      a.download = defaultName || getAttachmentDisplayName(url);
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("File sedang diunduh...", { id: toastId });
    }
  };

  // Start editing a message
  const handleStartEdit = (m: any) => {
    if (!isEditable(m.createdAt)) {
      toast.error("Batas waktu pengeditan pesan (12 jam) telah berakhir.");
      return;
    }
    setEditingMessage({ id: m.id, text: m.message });
    setInputText(m.message);
    setSelectedFile(null);
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setInputText("");
  };

  // Confirm delete message
  const handleConfirmDelete = async () => {
    if (!messageToDelete || !activeRoomId) return;
    setIsDeletingMessage(true);
    try {
      const res = await deleteMessageAction(messageToDelete);
      if (res.success) {
        emitDeleteMessage({
          roomId: activeRoomId,
          messageId: messageToDelete,
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageToDelete
              ? {
                ...m,
                message: "Pesan ini telah dihapus",
                isDeleted: true,
                attachmentUrl: null,
                attachmentType: null,
              }
              : m
          )
        );

        setRooms((prev) =>
          prev.map((r) =>
            r.id === activeRoomId
              ? { ...r, lastMessage: "🚫 Pesan ini telah dihapus" }
              : r
          )
        );

        toast.success("Pesan berhasil dihapus.");
        setMessageToDelete(null);
      } else {
        toast.error(res.error || "Gagal menghapus pesan.");
      }
    } catch {
      toast.error("Terjadi kendala saat menghapus pesan.");
    } finally {
      setIsDeletingMessage(false);
    }
  };

  // Send message handler (also handles edit save)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeRoomId) return;

    // Handle Edit Mode submission
    if (editingMessage) {
      const currentText = inputText.trim();
      if (!currentText) {
        toast.error("Pesan tidak boleh kosong.");
        return;
      }
      setIsSending(true);
      try {
        const res = await editMessageAction(editingMessage.id, currentText);
        if (res.success && res.editedAt) {
          emitEditMessage({
            roomId: activeRoomId,
            messageId: editingMessage.id,
            newMessage: currentText,
            editedAt: res.editedAt,
          });

          setMessages((prev) =>
            prev.map((m) =>
              m.id === editingMessage.id
                ? {
                  ...m,
                  message: currentText,
                  isEdited: true,
                  editedAt: res.editedAt,
                }
                : m
            )
          );

          setRooms((prev) =>
            prev.map((r) =>
              r.id === activeRoomId
                ? { ...r, lastMessage: currentText }
                : r
            )
          );

          toast.success("Pesan berhasil diedit.");
          setEditingMessage(null);
          setInputText("");
        } else {
          toast.error(res.error || "Gagal mengedit pesan.");
        }
      } catch {
        toast.error("Terjadi kendala saat mengedit pesan.");
      } finally {
        setIsSending(false);
      }
      return;
    }

    if (!inputText.trim() && !selectedFile) return;

    const currentText = inputText.trim();
    const currentAttachment = selectedFile;
    const optimisticId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();

    setInputText("");
    setSelectedFile(null);
    setShowEmojiPicker(false);
    emitTyping(false);

    const isImage = currentAttachment
      ? [".jpg", ".jpeg", ".png", ".webp"].some((ext) =>
        currentAttachment.name.toLowerCase().endsWith(ext)
      )
      : false;

    // Optimistic message append
    const optimisticMsg = {
      id: optimisticId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderImage: null,
      isMe: true,
      message: currentText || "",
      attachmentUrl: currentAttachment
        ? URL.createObjectURL(currentAttachment)
        : null,
      attachmentType: isImage ? "image" : "file",
      attachmentName: currentAttachment?.name || null,
      isRead: false,
      createdAt: nowIso,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setIsSending(true);

    const formData = new FormData();
    formData.append("room_id", activeRoomId);
    formData.append("message", currentText);
    if (currentAttachment) {
      formData.append("attachment", currentAttachment);
    }

    try {
      const res = await sendMessageAction(formData);
      if (res.success && res.messageId) {
        const finalAttachmentUrl = res.attachmentUrl || optimisticMsg.attachmentUrl;
        const finalAttachmentType = res.attachmentType || optimisticMsg.attachmentType;

        emitMessage({
          id: res.messageId,
          roomId: activeRoomId,
          senderId: currentUserId,
          senderName: currentUserName,
          recipientId: activeContact?.id,
          message: currentText,
          attachmentUrl: finalAttachmentUrl,
          attachmentType: finalAttachmentType,
          attachmentName: currentAttachment?.name || null,
          isMe: false,
          isRead: false,
          createdAt: nowIso,
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? {
                ...m,
                id: res.messageId,
                attachmentUrl: finalAttachmentUrl,
                attachmentType: finalAttachmentType,
              }
              : m
          )
        );

        setRooms((prev) =>
          prev.map((r) =>
            r.id === activeRoomId
              ? {
                ...r,
                lastMessage:
                  currentText ||
                  (currentAttachment
                    ? isImage
                      ? "📷 Foto"
                      : "📎 Lampiran file"
                    : "Pesan baru"),
                lastMessageAt: nowIso,
              }
              : r
          )
        );
      } else {
        toast.error(res.error || "Gagal mengirim pesan.");
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi masalah jaringan.");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setIsSending(false);
    }
  };

  // Quick Emoji click
  const handleEmojiSelect = (emoji: string) => {
    setInputText((prev) => prev + (prev.length > 0 ? " " : "") + emoji);
  };

  // Gabungkan Rooms dan Kontak ke dalam SATU daftar tunggal terpadu
  const unifiedChatList = useMemo<UnifiedChatItem[]>(() => {
    const roomByUserId = new Map<string, ChatRoom>();
    rooms.forEach((r) => {
      roomByUserId.set(String(r.otherUser.id), r);
    });

    const items: UnifiedChatItem[] = [];
    const seenUserIds = new Set<string>();

    contacts.forEach((c) => {
      seenUserIds.add(String(c.id));
      const room = roomByUserId.get(String(c.id));

      if (room) {
        items.push({
          contactId: String(c.id),
          name: c.name,
          image: c.image || room.otherUser.image || null,
          email: c.email,
          subtitle: c.subtitle || room.otherUser.guru_bidang || "",
          badge: c.badge || (room.otherUser.kelas ? `Wali ${room.otherUser.kelas}` : undefined),
          hasRoom: true,
          roomId: room.id,
          room,
          lastMessage: room.lastMessage || "",
          lastMessageAt: room.lastMessageAt || null,
          unreadCount: room.unreadCount,
          category: c.category,
        });
      } else {
        items.push({
          contactId: String(c.id),
          name: c.name,
          image: c.image || null,
          email: c.email,
          subtitle: c.subtitle,
          badge: c.badge || undefined,
          hasRoom: false,
          contact: c,
          lastMessage: "",
          lastMessageAt: null,
          unreadCount: 0,
          category: c.category,
        });
      }
    });

    // Masukkan room jika ada peserta yang belum masuk di list contacts
    rooms.forEach((r) => {
      if (!seenUserIds.has(String(r.otherUser.id))) {
        seenUserIds.add(String(r.otherUser.id));
        items.push({
          contactId: String(r.otherUser.id),
          name: r.otherUser.name,
          image: r.otherUser.image || null,
          email: r.otherUser.email,
          subtitle: r.otherUser.guru_bidang || r.otherUser.kelas || "",
          badge: r.otherUser.kelas ? `Wali ${r.otherUser.kelas}` : undefined,
          hasRoom: true,
          roomId: r.id,
          room: r,
          lastMessage: r.lastMessage || "",
          lastMessageAt: r.lastMessageAt || null,
          unreadCount: r.unreadCount,
        });
      }
    });

    // Urutkan: Obrolan aktif terbaru di atas, sisanya urut alfabet
    items.sort((a, b) => {
      if (a.lastMessageAt && b.lastMessageAt) {
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      }
      if (a.lastMessageAt) return -1;
      if (b.lastMessageAt) return 1;
      return a.name.localeCompare(b.name, "id");
    });

    return items;
  }, [contacts, rooms]);

  // Filter daftar tunggal chat
  const filteredChatList = useMemo(() => {
    return unifiedChatList.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSub = item.subtitle.toLowerCase().includes(q);
        const matchesBadge = (item.badge || "").toLowerCase().includes(q);
        const matchesMsg = item.lastMessage.toLowerCase().includes(q);
        if (!matchesName && !matchesSub && !matchesBadge && !matchesMsg) return false;
      }

      if (filterType === "unread") return item.unreadCount > 0;
      return true;
    });
  }, [unifiedChatList, searchQuery, filterType]);

  const totalUnreadCount = useMemo(() => {
    return rooms.reduce((acc, r) => acc + (r.unreadCount || 0), 0);
  }, [rooms]);

  // Messages grouped by calendar day for WhatsApp date separator chips
  const groupedMessages = useMemo(() => {
    const groups: { dateKey: string; dateLabel: string; items: any[] }[] = [];
    messages.forEach((msg) => {
      const dateKey = getMessageDateKey(msg.createdAt);
      let group = groups.find((g) => g.dateKey === dateKey);
      if (!group) {
        group = {
          dateKey,
          dateLabel: formatMessageDateHeader(msg.createdAt),
          items: [],
        };
        groups.push(group);
      }
      group.items.push(msg);
    });
    return groups;
  }, [messages]);

  const isContactOnline = activeContact
    ? onlineUsers.has(String(activeContact.id))
    : false;

  const emojis = ["👍", "🌟", "🌸", "🙋‍♂️", "🏆", "🙏", "😊", "📚", "❤️", "🎯", "🎉", "💡", "🤲", "📖", "🕌", "✅"];

  return (
    <div className="relative flex h-full w-full border-0 rounded-none bg-card overflow-hidden shadow-none">
      {/* Hidden File Inputs for Attachment Types */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
          }
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
          }
        }}
      />

      {/* ================= LEFT PANEL - WHATSAPP CHATS LIST ================= */}
      <div
        className={`flex-col h-full bg-background border-r border-border/70 min-w-0 overflow-hidden w-full lg:w-[380px] xl:w-[420px] lg:shrink-0 transition-all duration-200 ${!showMobileList ? "hidden lg:flex" : "flex"
          }`}
      >
        {/* Chats Header */}
        <div className="h-12 sm:h-14 px-4 border-b border-border/70 flex items-center justify-between shrink-0 bg-background/90 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Chats
            </h1>
            {totalUnreadCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                {totalUnreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded-md bg-muted/50 border border-border/40">
              {currentUserRole === "siswa" ? "Santri" : "Ustadz"}
            </span>
          </div>
        </div>

        {/* Search Bar & WhatsApp Filter Chips */}
        <div className="px-3.5 py-2.5 border-b border-border/50 shrink-0 bg-background">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={
                currentUserRole === "siswa"
                  ? "Cari nama Ustadz, Ustadzah, mapel..."
                  : "Cari nama siswa, kelas, pesan..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs sm:text-sm rounded-xl bg-muted/40 border-border/60 focus-visible:ring-1 focus-visible:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${filterType === "all"
                  ? "bg-emerald-600 text-white shadow-2xs font-semibold"
                  : "bg-muted/70 hover:bg-muted text-muted-foreground"
                }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterType("unread")}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors shrink-0 cursor-pointer flex items-center gap-1 ${filterType === "unread"
                  ? "bg-emerald-600 text-white shadow-2xs font-semibold"
                  : "bg-muted/70 hover:bg-muted text-muted-foreground"
                }`}
            >
              Belum dibaca
              {totalUnreadCount > 0 && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
                  {totalUnreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Contact / Conversation List */}
        <ScrollArea className="flex-1 w-full overflow-hidden">
          <div className="divide-y divide-border/30 overflow-x-hidden">
            {/* Header label */}
            <div className="px-4 py-2 bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>
                {currentUserRole === "siswa" ? "Ustadz & Ustadzah" : "Daftar Siswa"}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground/80">
                {filteredChatList.length} orang
              </span>
            </div>

            {filteredChatList.map((item) => {
              const isSelected =
                (item.roomId && item.roomId === activeRoomId) ||
                (!item.roomId && activeContact && String(activeContact.id) === String(item.contactId));
              const isOnline = onlineUsers.has(String(item.contactId));

              const handleClick = () => {
                if (item.hasRoom && item.room) {
                  setActiveRoomId(item.room.id);
                  setActiveContact(item.room.otherUser);
                  setShowMobileList(false);
                } else if (item.contact) {
                  handleStartChatWithContact(item.contact);
                }
              };

              return (
                <button
                  key={item.contactId}
                  type="button"
                  onClick={handleClick}
                  className={`px-3.5 w-full py-3 active:bg-secondary/70 lg:hover:bg-secondary/60 transition-colors cursor-pointer text-left flex items-center gap-3.5 ${isSelected
                      ? "bg-secondary/80 border-l-4 border-emerald-600 dark:border-emerald-400"
                      : ""
                    }`}
                >
                  {/* Large Avatar with Online Dot */}
                  <div className="relative shrink-0">
                    <UserAvatar
                      src={item.image}
                      name={item.name}
                      subtitle={item.subtitle}
                      badge={item.badge}
                      email={item.email}
                      className="size-12 rounded-full object-cover border border-border/50 ring-2 ring-emerald-500/20 shadow-2xs"
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-background pointer-events-none" />
                    )}
                  </div>

                  {/* Info and Last Message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <CardTitle className="text-[14px] sm:text-[15px] font-semibold truncate text-foreground leading-tight">
                        {item.name}
                      </CardTitle>
                      {item.lastMessageAt ? (
                        <span className="text-[11px] text-muted-foreground shrink-0 font-medium">
                          {formatChatListTime(item.lastMessageAt)}
                        </span>
                      ) : item.badge ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shrink-0">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <CardDescription className="text-xs truncate flex-1 font-normal text-muted-foreground flex items-center gap-1">
                        {item.lastMessage ? (
                          <>
                            {item.room?.lastMessage && (
                              <CheckCheck className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                            )}
                            <span className="truncate text-foreground/80 dark:text-foreground/70">
                              {item.lastMessage}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/70 truncate">
                            {item.subtitle || "Mulai obrolan"}
                          </span>
                        )}
                      </CardDescription>

                      <div className="flex items-center gap-1 shrink-0">
                        {item.unreadCount > 0 && (
                          <span className="h-5 min-w-5 px-1.5 rounded-full bg-emerald-600 text-[10px] font-bold text-white flex items-center justify-center shadow-2xs">
                            {item.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredChatList.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Tidak ada obrolan atau kontak yang sesuai.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ================= RIGHT PANEL - WHATSAPP CHAT ROOM ================= */}
      <div
        className={`flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] min-w-0 overflow-hidden flex-1 relative transition-all duration-200 ${showMobileList ? "hidden lg:flex" : "flex"
          }`}
      >
        {activeRoomId && activeContact ? (
          <div className="flex flex-col justify-between h-full min-w-0 relative">
            {/* WhatsApp Header / App Bar */}
            <div className="h-12 sm:h-14 border-b border-border/40 flex items-center justify-between px-2.5 sm:px-4 shrink-0 bg-transparent relative z-20">
              <div className="flex items-center gap-1 sm:gap-2.5 min-w-0 z-10">
                {/* Back button on Mobile and Tablet (< lg) */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileList(true)}
                  className="lg:hidden h-9 w-9 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-foreground shrink-0 -ml-1 mr-0.5"
                  title="Kembali ke Daftar Obrolan"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                {/* Avatar with Online Dot */}
                <div
                  className="relative shrink-0 cursor-pointer"
                  onClick={() => setShowMobileList(true)}
                  title="Klik untuk kembali ke daftar obrolan"
                >
                  <UserAvatar
                    src={activeContact?.image}
                    name={activeContact?.name}
                    subtitle={activeContact?.guru_bidang || activeContact?.kelas || activeContact?.role || ""}
                    badge={activeContact?.role === "guru" ? "Guru / Wali" : "Siswa"}
                    email={activeContact?.email}
                    className="size-10 rounded-full object-cover border border-border/50 ring-2 ring-emerald-500/20 shadow-xs"
                  />
                  {isContactOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background pointer-events-none" />
                  )}
                </div>

                {/* Contact Name & Status */}
                <div className="space-y-0.5 min-w-0">
                  <h2 className="text-sm sm:text-base font-semibold truncate text-foreground leading-tight">
                    {activeContact?.name}
                  </h2>
                  <div className="text-xs truncate flex items-center gap-1.5">
                    {otherUserTyping ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium animate-pulse flex items-center gap-1">
                        sedang mengetik...
                      </span>
                    ) : isContactOnline ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Online
                      </span>
                    ) : (
                      <span className="text-muted-foreground truncate">
                        {activeContact?.guru_bidang || activeContact?.kelas || activeContact?.role || "Offline"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Messages Feed Area */}
            <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4 space-y-1.5 min-w-0 relative z-10">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground my-auto">
                  <div className="max-w-xs bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs px-3.5 py-2 rounded-xl text-center shadow-2xs mb-4">
                    🔒 Pesan terenkripsi secara aman. Percakapan ini hanya dapat dibaca oleh Anda dan {activeContact.name}.
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Mulai Percakapan Santun
                  </h4>
                  <p className="text-xs mt-1 max-w-sm text-muted-foreground leading-relaxed">
                    Kirim pesan atau pertanyaan seputar materi pelajaran langsung kepada{" "}
                    <strong className="text-foreground font-medium">{activeContact.name}</strong>.
                  </p>
                </div>
              ) : (
                groupedMessages.map((group) => (
                  <div key={group.dateKey} className="space-y-1.5">
                    {/* WhatsApp Date Chip */}
                    {group.dateLabel && (
                      <div className="flex justify-center my-3 select-none">
                        <span className="bg-white/90 dark:bg-[#182229]/90 backdrop-blur-xs text-[#54656f] dark:text-[#8696a0] text-[11px] font-semibold px-3 py-1 rounded-lg shadow-2xs border border-black/5 dark:border-white/5 uppercase tracking-wide">
                          {group.dateLabel}
                        </span>
                      </div>
                    )}

                    {group.items.map((m) => {
                      const hasImage = !!m.attachmentUrl && m.attachmentType === "image";
                      const rawMsg = (m.message || "").trim();
                      const isPlaceholder =
                        rawMsg === "Mengirim lampiran" ||
                        rawMsg === "Mengirim lampiran...";
                      const captionText = isPlaceholder ? "" : rawMsg;

                      // Dropdown action conditions
                      const canDownloadFile = !!m.attachmentUrl && !hasImage;
                      const canCopy = !!captionText;
                      const canEdit = m.isMe && !hasImage && isEditable(m.createdAt);
                      const canDelete = m.isMe;
                      const hasDropdownActions =
                        !m.isDeleted &&
                        (canDownloadFile || canCopy || canEdit || canDelete);

                      return (
                        <div
                          key={m.id}
                          className={`flex ${m.isMe ? "justify-end" : "justify-start"} mb-1 group/bubble`}
                        >
                          <div
                            className={`relative max-w-[85%] sm:max-w-[72%] rounded-2xl shadow-2xs leading-relaxed text-[13.5px] sm:text-sm break-words overflow-hidden ${hasImage && !captionText
                                ? "p-0 bg-card/70 dark:bg-[#1f2c34]/70 rounded-2xl border border-black/10 dark:border-white/15 shadow-xs"
                                : hasImage
                                  ? m.isMe
                                    ? "p-0 bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-xs border border-emerald-600/20 dark:border-emerald-500/20"
                                    : "p-0 bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-xs border border-black/10 dark:border-white/15"
                                  : m.isMe
                                    ? "px-3.5 py-2 bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-xs border border-emerald-600/10"
                                    : "px-3.5 py-2 bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-xs border border-black/5 dark:border-white/5"
                              }`}
                          >
                            {/* Message Action Dropdown (Salin, Edit, Hapus) */}
                            {hasDropdownActions && (
                              <div className={`absolute ${hasImage ? "top-2 right-2" : "top-1 right-1"} z-10`}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    type="button"
                                    className={`h-5 w-5 rounded-full inline-flex items-center justify-center transition-all cursor-pointer ${hasImage
                                        ? "bg-black/45 hover:bg-black/70 text-white backdrop-blur-xs opacity-80 hover:opacity-100 shadow-xs"
                                        : m.isMe
                                          ? "text-emerald-950/80 dark:text-emerald-50/90 hover:text-emerald-950 dark:hover:text-white opacity-80 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
                                          : "text-[#54656f]/80 dark:text-[#8696a0]/90 hover:text-foreground opacity-80 hover:opacity-100 hover:bg-muted"
                                      }`}
                                    title="Opsi Pesan"
                                  >
                                    <ChevronDown className="h-3.5 w-3.5 stroke-[2.3]" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align={m.isMe ? "end" : "start"} className="w-36 z-50">
                                    {canDownloadFile && (
                                      <DropdownMenuItem
                                        onClick={() => handleDownloadFile(m.attachmentUrl, getAttachmentDisplayName(m.attachmentUrl, m.attachmentName))}
                                        className="cursor-pointer text-xs flex items-center gap-2"
                                      >
                                        <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                        Unduh File
                                      </DropdownMenuItem>
                                    )}
                                    {canCopy && (
                                      <DropdownMenuItem
                                        onClick={() => handleCopyMessage(captionText)}
                                        className="cursor-pointer text-xs flex items-center gap-2"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                        Salin
                                      </DropdownMenuItem>
                                    )}
                                    {canEdit && (
                                      <DropdownMenuItem
                                        onClick={() => handleStartEdit(m)}
                                        className="cursor-pointer text-xs flex items-center gap-2"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                        Edit
                                      </DropdownMenuItem>
                                    )}
                                    {canDelete && (
                                      <>
                                        {(canDownloadFile || canCopy || canEdit) && (
                                          <DropdownMenuSeparator />
                                        )}
                                        <DropdownMenuItem
                                          onClick={() => setMessageToDelete(m.id)}
                                          className="cursor-pointer text-xs flex items-center gap-2 text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                          Hapus
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}

                            {/* Deleted Notice or Regular Message */}
                            {m.isDeleted ? (
                              <div className="flex items-center gap-1.5 italic text-muted-foreground text-xs py-2 px-3.5 select-none pr-3">
                                <CircleSlash className="h-3.5 w-3.5 opacity-70 shrink-0" />
                                <span>Pesan ini telah dihapus</span>
                              </div>
                            ) : hasImage ? (
                              <>
                                {/* Image Attachment (Flush Edge-to-Edge with subtle border) */}
                                <div className={`w-full overflow-hidden max-w-sm relative group/img ${captionText ? "border-b border-black/10 dark:border-white/10" : ""}`}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={m.attachmentUrl}
                                    alt="Lampiran Gambar"
                                    className={`max-h-80 w-full object-cover block ${captionText ? "rounded-t-2xl rounded-b-none" : "rounded-2xl"
                                      }`}
                                  />
                                  {/* Quick Download Button on Image */}
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(m.attachmentUrl, getAttachmentDisplayName(m.attachmentUrl))}
                                    className="absolute top-2 left-2 z-10 h-6 w-6 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-80 hover:opacity-100 shadow-xs cursor-pointer active:scale-95"
                                    title="Unduh Gambar"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                {captionText ? (
                                  <div className="px-3 pt-2 pb-1.5">
                                    <p className="whitespace-pre-wrap pr-2">{captionText}</p>
                                    <div
                                      className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${m.isMe
                                          ? "text-[#667781] dark:text-[#8696a0]"
                                          : "text-[#667781] dark:text-[#8696a0]"
                                        }`}
                                    >
                                      {m.isEdited && !m.isDeleted && (
                                        <span className="text-[9px] text-[#667781] dark:text-[#8696a0] italic mr-0.5" title="Pesan telah diedit">
                                          (diedit)
                                        </span>
                                      )}
                                      <span>{formatMessageTime(m.createdAt)}</span>
                                      {m.isMe && !m.isDeleted && (
                                        <span title={m.isRead ? "Dibaca" : "Terkirim"}>
                                          {m.isRead ? (
                                            <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                                          ) : (
                                            <CheckCheck className="h-3.5 w-3.5 text-[#8696a0]" />
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  /* Floating overlay timestamp when image has no caption */
                                  <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-xs text-white text-[10px] select-none shadow-xs pointer-events-none">
                                    {m.isEdited && !m.isDeleted && (
                                      <span className="text-[9px] text-white/80 italic mr-0.5">
                                        (diedit)
                                      </span>
                                    )}
                                    <span>{formatMessageTime(m.createdAt)}</span>
                                    {m.isMe && !m.isDeleted && (
                                      <span>
                                        {m.isRead ? (
                                          <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                                        ) : (
                                          <CheckCheck className="h-3.5 w-3.5 text-white/80" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                {/* File Attachment Card */}
                                {m.attachmentUrl && m.attachmentType === "file" && (
                                  <div
                                    onClick={() => handleDownloadFile(m.attachmentUrl, getAttachmentDisplayName(m.attachmentUrl, m.attachmentName))}
                                    className="flex items-center gap-3 p-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer mb-2 transition-colors group/file select-none border border-black/5 dark:border-white/5"
                                    title="Klik untuk mengunduh dokumen"
                                  >
                                    <div className="h-10 w-10 rounded-lg bg-emerald-500/15 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover/file:scale-105 transition-transform">
                                      <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="truncate flex-1 min-w-0">
                                      <p className="truncate font-semibold text-xs text-foreground">
                                        {getAttachmentDisplayName(m.attachmentUrl, m.attachmentName)}
                                      </p>
                                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                                        {getAttachmentExtension(m.attachmentUrl, m.attachmentName) ? (
                                          <>
                                            <span className="font-bold uppercase bg-black/10 dark:bg-white/15 px-1.5 py-0.2 rounded text-[9px] text-foreground/90">
                                              {getAttachmentExtension(m.attachmentUrl, m.attachmentName)}
                                            </span>
                                            <span>•</span>
                                          </>
                                        ) : null}
                                        <span>Klik untuk unduh</span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadFile(m.attachmentUrl, getAttachmentDisplayName(m.attachmentUrl, m.attachmentName));
                                      }}
                                      className="h-8 w-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover/file:scale-110 active:scale-95 transition-all cursor-pointer"
                                      title="Unduh File"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}

                                {/* Text Message Content */}
                                {m.message && (
                                  <p className="whitespace-pre-wrap pr-3">{m.message}</p>
                                )}

                                {/* Timestamp & Status Checkmarks inside text bubble */}
                                <div
                                  className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${m.isMe
                                      ? "text-[#667781] dark:text-[#8696a0]"
                                      : "text-[#667781] dark:text-[#8696a0]"
                                    }`}
                                >
                                  {m.isEdited && !m.isDeleted && (
                                    <span className="text-[9px] text-[#667781] dark:text-[#8696a0] italic mr-0.5" title="Pesan telah diedit">
                                      (diedit)
                                    </span>
                                  )}
                                  <span>{formatMessageTime(m.createdAt)}</span>
                                  {m.isMe && !m.isDeleted && (
                                    <span title={m.isRead ? "Dibaca" : "Terkirim"}>
                                      {m.isRead ? (
                                        <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                                      ) : (
                                        <CheckCheck className="h-3.5 w-3.5 text-[#8696a0]" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}

              {/* Real-time Typing Indicator */}
              {otherUserTyping && (
                <div className="flex justify-start mb-2">
                  <div className="bg-white dark:bg-[#202c33] rounded-2xl rounded-tl-xs px-3.5 py-2 shadow-2xs text-xs text-[#54656f] dark:text-[#8696a0] flex items-center gap-2 border border-black/5 dark:border-white/5">
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
                    </span>
                    <span>{otherUserTyping} sedang mengetik...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Emoji Picker Strip (when toggled via Smile button) */}
            {showEmojiPicker && (
              <div className="px-3 py-2 bg-background/95 dark:bg-[#1f2c34]/95 border-t border-border/60 flex items-center gap-2 overflow-x-auto shrink-0 relative z-20 shadow-xs">
                <span className="text-[11px] font-bold text-muted-foreground uppercase shrink-0">
                  Stiker:
                </span>
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-lg hover:scale-125 transition-transform p-1 rounded-lg hover:bg-card shrink-0 active:scale-95 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Attachment Pill Indicator */}
            {selectedFile && (
              <div className="mx-3 my-1.5 px-3 py-2 rounded-xl bg-card dark:bg-[#202c33] border border-emerald-500/30 flex items-center justify-between text-xs shrink-0 relative z-20 shadow-sm">
                <div className="flex items-center gap-2.5 truncate text-foreground font-medium">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Paperclip className="h-4 w-4" />
                  </div>
                  <div className="truncate">
                    <p className="truncate font-semibold">{selectedFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Siap dikirim
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Inline Edit Banner */}
            {editingMessage && (
              <div className="mx-2.5 sm:mx-3 mb-1 px-3 py-2 rounded-2xl bg-card dark:bg-[#202c33] border border-emerald-500/40 flex items-center justify-between text-xs shadow-xs relative z-20">
                <div className="flex items-center gap-2 truncate">
                  <div className="h-7 w-7 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Edit3 className="h-3.5 w-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px] leading-tight">
                      Mengedit Pesan
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate max-w-xs sm:max-w-md">
                      {editingMessage.text}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  title="Batalkan pengeditan"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* WhatsApp Mobile Chat Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-2 sm:p-2.5 flex items-end gap-1.5 sm:gap-2 bg-transparent shrink-0 relative z-20"
            >
              {/* WhatsApp Capsule Container */}
              <div className="flex-1 flex items-center bg-card dark:bg-[#202c33] rounded-3xl px-2 sm:px-3 py-1 shadow-sm border border-border/60 min-h-[46px] gap-0.5 sm:gap-1">
                {/* Emoji Trigger */}
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground shrink-0 hover:bg-muted/50"
                  title="Emoji & Stiker"
                >
                  <Smile className="h-5 w-5" />
                </Button>

                {/* Borderless Input Field */}
                <Input
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={editingMessage ? "Ubah pesan..." : "Ketik pesan..."}
                  className="flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm h-9 px-1 text-foreground placeholder:text-muted-foreground/70"
                />

                {/* Attachment Menu (Paperclip) */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    type="button"
                    className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground shrink-0 hover:bg-muted/50 inline-flex items-center justify-center cursor-pointer transition-colors"
                    title="Lampirkan Dokumen atau Gambar"
                  >
                    <Paperclip className="h-5 w-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="top" className="w-48 mb-2">
                    <DropdownMenuItem
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx";
                          fileInputRef.current.click();
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <File className="h-4 w-4 mr-2.5 text-indigo-500" />
                      Dokumen
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = "image/*";
                          fileInputRef.current.click();
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <ImageIcon className="h-4 w-4 mr-2.5 text-purple-500" />
                      Galeri Foto
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => cameraInputRef.current?.click()}
                      className="cursor-pointer"
                    >
                      <Camera className="h-4 w-4 mr-2.5 text-pink-500" />
                      Kamera
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Camera Quick Action Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground shrink-0 hover:bg-muted/50 hidden xs:flex"
                  title="Ambil Foto Kamera"
                >
                  <Camera className="h-5 w-5" />
                </Button>
              </div>

              {/* WhatsApp Floating Action Button (Mic / Send / Save Edit) */}
              <Button
                type="submit"
                disabled={isSending}
                onClick={(e) => {
                  if (!editingMessage && !inputText.trim() && !selectedFile) {
                    e.preventDefault();
                    toast.info("Pesan suara: Tekan dan tahan untuk merekam suara.");
                  }
                }}
                className="h-11 w-11 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shadow-md shrink-0 active:scale-95 transition-transform p-0 cursor-pointer disabled:opacity-50"
                title={
                  editingMessage
                    ? "Simpan Perubahan"
                    : inputText.trim() || selectedFile
                      ? "Kirim Pesan"
                      : "Pesan Suara"
                }
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : editingMessage ? (
                  <Check className="h-5 w-5" />
                ) : inputText.trim() || selectedFile ? (
                  <Send className="h-5 w-5 fill-current ml-0.5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            </form>
          </div>
        ) : (
          /* Desktop Empty Chat Selection State (WhatsApp Web Style) */
          <div className="h-full flex flex-col items-center justify-center p-8 text-center relative z-10">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 shadow-sm ring-8 ring-emerald-500/5">
              <MessageCircle className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Ruang Konsultasi Terpadu Al-Azhar
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
              {currentUserRole === "siswa"
                ? "Silakan pilih salah satu Ustadz/Ustadzah di sebelah kiri untuk berkonsultasi mengenai materi pelajaran, tugas, atau bimbingan santri."
                : "Silakan pilih salah satu siswa di sebelah kiri untuk memberikan bimbingan belajar, evaluasi, dan umpan balik tugas."}
            </p>
            <div className="mt-8 flex items-center gap-2 text-[11px] text-muted-foreground/70 bg-card/60 px-3 py-1.5 rounded-full border border-border/40">
              <span>🔒</span>
              <span>Pesan terenkripsi & tersimpan aman di server Al-Azhar Cairo</span>
            </div>
          </div>
        )}
      </div>

      {/* Delete Message Confirmation Dialog */}
      <AlertDialog
        open={!!messageToDelete}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
      >
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <Trash2 className="h-5 w-5 text-destructive" />
              Hapus Pesan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Pesan ini akan dihapus untuk semua orang dalam percakapan ini. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              disabled={isDeletingMessage}
              className="cursor-pointer"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeletingMessage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {isDeletingMessage ? "Menghapus..." : "Hapus untuk Semua"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
