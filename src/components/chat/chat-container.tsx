"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Brush,
  Camera,
  ChartBarIncreasing,
  CircleOff,
  CircleUserRound,
  File,
  Image as ImageIcon,
  ListFilter,
  MessageCircle,
  MessageSquareDashed,
  MessageSquareDot,
  Mic,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  SquarePen,
  Star,
  User,
  UserRound,
  Users,
  Video,
  Check,
  CheckCheck,
  ArrowLeft,
  X,
  Loader2,
  Sparkles,
  GraduationCap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/ui/user-avatar";
import { CardDescription, CardTitle } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  sendMessageAction,
  getRoomMessages,
  getOrCreateChatRoom,
} from "@/actions/chat";
import { useSocket } from "@/hooks/use-socket";
import { toast } from "sonner";
import { AlAzharCornerMosaic } from "@/components/ui/alazhar-patterns";

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
}

export function ChatContainer({
  currentUserId,
  currentUserName = "Pengguna",
  currentUserRole,
  initialRooms,
  contacts,
}: ChatContainerProps) {
  // State: Chat rooms & active chat
  const [rooms, setRooms] = useState<ChatRoom[]>(initialRooms);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(
    initialRooms.length > 0 ? initialRooms[0].id : null
  );
  const [activeContact, setActiveContact] = useState<any>(
    initialRooms.length > 0 ? initialRooms[0].otherUser : null
  );

  // State: Messages & Input
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "unread" | "wali" | "mapel"
  >("all");
  const [isSending, setIsSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Socket.IO hook for real-time messaging
  const { isConnected, onlineUsers, emitMessage, emitTyping, emitMarkRead } =
    useSocket({
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

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeRoomId) return;
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
      message: currentText || (currentAttachment ? "Mengirim lampiran..." : ""),
      attachmentUrl: currentAttachment
        ? URL.createObjectURL(currentAttachment)
        : null,
      attachmentType: isImage ? "image" : "file",
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
        emitMessage({
          id: res.messageId,
          roomId: activeRoomId,
          senderId: currentUserId,
          senderName: currentUserName,
          recipientId: activeContact?.id,
          message: currentText,
          attachmentUrl: optimisticMsg.attachmentUrl,
          attachmentType: optimisticMsg.attachmentType,
          isMe: false,
          isRead: false,
          createdAt: nowIso,
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId ? { ...m, id: res.messageId } : m
          )
        );

        setRooms((prev) =>
          prev.map((r) =>
            r.id === activeRoomId
              ? {
                  ...r,
                  lastMessage: currentText || "📎 Lampiran",
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
      if (filterType === "wali") {
        return (
          (item.badge || "").toLowerCase().includes("wali") ||
          item.subtitle.toLowerCase().includes("wali")
        );
      }
      if (filterType === "mapel") {
        return !(item.badge || "").toLowerCase().includes("wali");
      }
      return true;
    });
  }, [unifiedChatList, searchQuery, filterType]);

  const isContactOnline = activeContact
    ? onlineUsers.has(String(activeContact.id))
    : false;

  const emojis = ["👍", "🌟", "🌸", "🙋‍♂️", "🏆", "🙏", "😊", "📚", "❤️", "🎯", "🎉", "💡"];

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[580px] w-full border border-border/70 rounded-2xl bg-card overflow-hidden shadow-xs">
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

      {/* Main Content Area: Resizable Panels */}
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {/* ================= LEFT PANEL - CHAT LIST ================= */}
          <ResizablePanel
            defaultSize="320px"
            minSize="260px"
            maxSize="450px"
            className={`flex flex-col h-full bg-background border-r border-border/70 min-w-0 overflow-hidden ${
              !showMobileList ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Chats Header */}
            <div className="h-16 px-3 py-2 border-b border-border/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-foreground">Chats</p>
                {filterType !== "all" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 capitalize">
                    {filterType}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* New Chat Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="h-9 w-9 rounded-xl inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                    title={currentUserRole === "siswa" ? "Pilih Ustadz / Ustadzah" : "Pilih Siswa"}
                  >
                    <SquarePen className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Mulai Obrolan Baru</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {currentUserRole === "siswa" ? (
                      <DropdownMenuItem onClick={() => setFilterType("all")}>
                        <GraduationCap className="h-4 w-4 mr-2 text-emerald-600" />
                        <span>Pilih Ustadz / Ustadzah</span>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => setFilterType("all")}>
                        <User className="h-4 w-4 mr-2 text-blue-600" />
                        <span>Pilih Siswa Bimbingan</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Filter Chats Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={`h-9 w-9 rounded-xl inline-flex items-center justify-center cursor-pointer transition-colors ${
                      filterType !== "all"
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                    title="Filter Obrolan"
                  >
                    <ListFilter className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter Obrolan</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => setFilterType("all")}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        <span>Semua Percakapan</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterType("unread")}>
                        <MessageSquareDot className="h-4 w-4 mr-2 text-rose-500" />
                        <span>Belum Dibaca (Unread)</span>
                      </DropdownMenuItem>
                      {currentUserRole === "siswa" ? (
                        <>
                          <DropdownMenuItem onClick={() => setFilterType("wali")}>
                            <GraduationCap className="h-4 w-4 mr-2 text-amber-600" />
                            <span>Wali Kelas</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setFilterType("mapel")}>
                            <User className="h-4 w-4 mr-2 text-emerald-600" />
                            <span>Guru Mata Pelajaran</span>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem onClick={() => setFilterType("wali")}>
                          <Users className="h-4 w-4 mr-2 text-emerald-600" />
                          <span>Kelas Bimbingan</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative px-3 py-2.5 border-b border-border/50 shrink-0">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={
                  currentUserRole === "siswa"
                    ? "Cari nama Ustadz, Ustadzah, atau mata pelajaran..."
                    : "Cari nama siswa atau kelas..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs sm:text-sm rounded-xl bg-muted/40 border-border/60 focus-visible:ring-1 focus-visible:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Contact / Conversation List */}
            <ScrollArea className="flex-1 w-full overflow-hidden">
              <div className="divide-y divide-border/40 overflow-x-hidden">
                {/* Single Unified Contact / Conversation List */}
                <div>
                  <div className="px-3.5 py-2 bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>
                      {currentUserRole === "siswa"
                        ? "Ustadz & Ustadzah"
                        : "Daftar Siswa"}
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
                        className={`px-3.5 w-full py-3 hover:bg-secondary/70 transition-colors cursor-pointer text-left flex items-start gap-3 ${
                          isSelected
                            ? "bg-secondary border-l-4 border-emerald-600 dark:border-emerald-400"
                            : ""
                        }`}
                      >
                        <div className="relative shrink-0">
                          <UserAvatar
                            src={item.image}
                            name={item.name}
                            subtitle={item.subtitle}
                            badge={item.badge}
                            email={item.email}
                            className="size-11 rounded-full object-cover border border-border/50 ring-2 ring-emerald-500/20 shadow-xs"
                          />
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card pointer-events-none" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <CardTitle className="text-sm font-semibold truncate text-foreground">
                              {item.name}
                            </CardTitle>
                            {item.lastMessageAt ? (
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {new Date(item.lastMessageAt).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            ) : item.badge ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shrink-0">
                                {item.badge}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <CardDescription className="text-xs truncate flex-1 font-normal">
                              {item.lastMessage ? (
                                <span className="text-foreground/80 dark:text-foreground/70 font-medium">
                                  {item.lastMessage}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/80">
                                  {item.subtitle || "Mulai obrolan"}
                                </span>
                              )}
                            </CardDescription>

                            <div className="flex items-center gap-1 shrink-0">
                              {item.lastMessage && item.badge && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  {item.badge}
                                </span>
                              )}
                              {item.unreadCount > 0 && (
                                <span className="h-5 min-w-5 px-1.5 rounded-full bg-emerald-600 text-[10px] font-bold text-white flex items-center justify-center">
                                  {item.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {filteredChatList.length === 0 && (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Tidak ada obrolan atau kontak yang sesuai.
                  </div>
                )}
              </div>
            </ScrollArea>
          </ResizablePanel>

          {/* Resizable Divider Handle with Visual Grip */}
          <ResizableHandle withHandle />

          {/* ================= RIGHT PANEL - CHAT WINDOW ================= */}
          <ResizablePanel
            defaultSize="100%"
            minSize="340px"
            className={`flex flex-col h-full bg-card min-w-0 overflow-hidden ${
              showMobileList ? "hidden md:flex" : "flex"
            }`}
          >
            {activeRoomId && activeContact ? (
              <div className="flex flex-col justify-between h-full min-w-0">
                {/* Chat Header */}
                <div className="h-16 border-b border-border/70 flex items-center justify-between px-3 sm:px-4 shrink-0 bg-card/60 backdrop-blur-xs relative overflow-hidden">
                  <AlAzharCornerMosaic className="absolute top-0 right-0 w-32 h-16 pointer-events-none opacity-40 select-none" />

                  <div className="flex items-center gap-2.5 min-w-0 z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowMobileList(true)}
                      className="md:hidden h-9 w-9 rounded-xl mr-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div className="relative shrink-0">
                      <UserAvatar
                        src={activeContact?.image}
                        name={activeContact?.name}
                        subtitle={activeContact?.guru_bidang || activeContact?.kelas || activeContact?.role || ""}
                        badge={activeContact?.role === "guru" ? "Guru / Wali" : "Siswa"}
                        email={activeContact?.email}
                        className="size-11 sm:size-12 rounded-full object-cover border border-border/50 ring-2 ring-emerald-500/20 shadow-xs"
                      />
                      {isContactOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card pointer-events-none" />
                      )}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <CardTitle className="text-sm sm:text-base font-bold truncate text-foreground">
                        {activeContact?.name}
                      </CardTitle>
                      <CardDescription className="text-xs truncate flex items-center gap-1.5">
                        <span>{activeContact?.guru_bidang || activeContact?.kelas || activeContact?.role || "Contact Info"}</span>
                        <span>•</span>
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          isContactOnline ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isContactOnline ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                          {isContactOnline ? "Online" : "Offline"}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </div>

                {/* Messages Feed Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-muted/10 min-w-0">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                      <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                        <Sparkles className="h-7 w-7" />
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-foreground">
                        Mulai Percakapan Santun
                      </h4>
                      <p className="text-xs sm:text-sm mt-1 max-w-sm text-muted-foreground leading-relaxed">
                        Kirim pesan atau pertanyaan seputar materi pelajaran langsung kepada{" "}
                        <strong className="text-foreground">{activeContact.name}</strong>.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-md rounded-2xl p-3 text-sm shadow-xs leading-relaxed ${
                            m.isMe
                              ? "bg-emerald-600 text-white rounded-br-xs"
                              : "bg-card border border-border/80 text-foreground rounded-bl-xs shadow-2xs"
                          }`}
                        >
                          {/* Image Attachment Preview */}
                          {m.attachmentUrl && m.attachmentType === "image" && (
                            <div className="mb-2 rounded-xl overflow-hidden border border-black/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={m.attachmentUrl}
                                alt="Lampiran Gambar"
                                className="max-h-60 w-full object-cover"
                              />
                            </div>
                          )}

                          {/* File Attachment Link */}
                          {m.attachmentUrl && m.attachmentType === "file" && (
                            <a
                              href={m.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 p-2 rounded-xl bg-black/10 hover:bg-black/20 text-xs font-semibold mb-2 transition-colors"
                            >
                              <File className="h-4 w-4" />
                              <span className="truncate">Unduh Berkas / Dokumen</span>
                            </a>
                          )}

                          <p className="whitespace-pre-wrap">{m.message}</p>

                          <div
                            className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                              m.isMe ? "text-emerald-100" : "text-muted-foreground"
                            }`}
                          >
                            <span>
                              {m.createdAt
                                ? new Date(m.createdAt).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                            {m.isMe && (
                              <span title={m.isRead ? "Dibaca" : "Terkirim"}>
                                {m.isRead ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-cyan-200" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Real-time Typing Indicator */}
                  {otherUserTyping && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full w-fit animate-pulse">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce" />
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:300ms]" />
                      </span>
                      <span>{otherUserTyping} sedang mengetik...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>


                {/* Quick Emoji Picker Strip (when toggled via Smile button) */}
                {showEmojiPicker && (
                  <div className="px-3 py-2 bg-muted/40 border-t border-border/60 flex items-center gap-2 overflow-x-auto shrink-0 animate-in fade-in-0 duration-150">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase shrink-0">
                      Stiker:
                    </span>
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-lg hover:scale-125 transition-transform p-1 rounded-lg hover:bg-card shrink-0 active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Attachment Pill Indicator */}
                {selectedFile && (
                  <div className="px-4 py-1.5 bg-emerald-500/10 border-t border-emerald-500/20 flex items-center justify-between text-xs shrink-0">
                    <div className="flex items-center gap-2 truncate text-emerald-800 dark:text-emerald-300 font-semibold">
                      <Paperclip className="h-3.5 w-3.5" />
                      <span className="truncate">{selectedFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1 rounded-full hover:bg-emerald-500/20 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Chat Input Bar - Matching Requested Template */}
                <form
                  onSubmit={handleSendMessage}
                  className="flex h-14 items-center px-3 gap-1 border-t border-border/70 bg-card shrink-0"
                >
                  {/* Smile Emoji Trigger */}
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
                    title="Sisipkan Stiker & Emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>

                  {/* Paperclip Dropdown Attachment Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="h-9 w-9 rounded-xl inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors shrink-0"
                      title="Lampirkan Dokumen atau Gambar"
                    >
                      <Paperclip className="h-5 w-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top" className="w-52">
                      <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                        <ImageIcon className="h-4 w-4 mr-2 text-emerald-600" />
                        <span>Photos & Videos</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => cameraInputRef.current?.click()}>
                        <Camera className="h-4 w-4 mr-2 text-blue-600" />
                        <span>Camera</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                        <File className="h-4 w-4 mr-2 text-amber-600" />
                        <span>Document</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Kontak sekolah Al-Azhar tersedia di panel kiri.")}>
                        <UserRound className="h-4 w-4 mr-2 text-purple-600" />
                        <span>Contact</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Fitur polling akan segera hadir.")}>
                        <ChartBarIncreasing className="h-4 w-4 mr-2 text-teal-600" />
                        <span>Poll</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Fitur drawing sketsa pelajaran akan segera hadir.")}>
                        <Brush className="h-4 w-4 mr-2 text-rose-600" />
                        <span>Drawing</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Borderless Input Field */}
                  <Input
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="flex-grow border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm h-10 px-2"
                  />

                  {/* Send Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    type="submit"
                    disabled={isSending || (!inputText.trim() && !selectedFile)}
                    className="h-9 w-9 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 shrink-0 disabled:opacity-40"
                    title="Kirim Pesan"
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>

                  {/* Mic Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => toast.info("Pesan suara: Tekan dan tahan untuk merekam suara.")}
                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
                    title="Pesan Suara"
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            ) : (
              /* Empty Chat Selection State */
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-2xs">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Ruang Konsultasi Terpadu Al-Azhar
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm leading-relaxed">
                  {currentUserRole === "siswa"
                    ? "Silakan pilih salah satu Ustadz/Ustadzah di sebelah kiri untuk berkonsultasi mengenai materi pelajaran atau tugas Anda."
                    : "Silakan pilih salah satu siswa di sebelah kiri untuk memberikan bimbingan belajar dan umpan balik tugas."}
                </p>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
    </div>
  );
}
