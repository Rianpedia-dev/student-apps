"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Paperclip, 
  Search, 
  MessageSquare, 
  User as UserIcon, 
  CheckCheck, 
  Check, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Clock, 
  Sparkles,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendMessageAction, getRoomMessages, getOrCreateChatRoom } from "@/actions/chat";
import { toast } from "sonner";
import { AlAzharCornerMosaic } from "@/components/ui/alazhar-patterns";

interface ChatContainerProps {
  currentUserId: string;
  currentUserRole: "siswa" | "guru" | "admin";
  initialRooms: Array<{
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
  }>;
  contacts: Array<{
    id: string;
    name: string;
    image?: string | null;
    email: string;
    subtitle: string;
    badge?: string | null;
  }>;
}

export function ChatContainer({
  currentUserId,
  currentUserRole,
  initialRooms,
  contacts,
}: ChatContainerProps) {
  const [rooms, setRooms] = useState(initialRooms);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(
    initialRooms.length > 0 ? initialRooms[0].id : null
  );
  const [activeContact, setActiveContact] = useState<any>(
    initialRooms.length > 0 ? initialRooms[0].otherUser : null
  );

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load messages whenever activeRoomId changes
  useEffect(() => {
    if (!activeRoomId) return;

    let isMounted = true;
    const fetchMsgs = async () => {
      try {
        const data = await getRoomMessages(activeRoomId);
        if (isMounted) {
          setMessages(data);
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      } catch (err) {
        console.error("Gagal load pesan:", err);
      }
    };

    fetchMsgs();

    // Polling interval 4 detik untuk update pesan baru
    const interval = setInterval(fetchMsgs, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeRoomId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start chat with a contact
  const handleStartChatWithContact = async (contact: any) => {
    const res = await getOrCreateChatRoom(contact.id);
    if (res.success && res.room) {
      setActiveRoomId(res.room.id);
      setActiveContact({
        id: contact.id,
        name: contact.name,
        image: contact.image,
        email: contact.email,
        role: currentUserRole === "siswa" ? "Guru" : "Siswa",
        kelas: contact.badge,
        guru_bidang: contact.subtitle,
      });
      setShowMobileList(false);
    } else {
      toast.error(res.error || "Gagal memulai percakapan.");
    }
  };

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoomId) return;
    if (!inputText.trim() && !selectedFile) return;

    setIsSending(true);
    const formData = new FormData();
    formData.append("room_id", activeRoomId);
    formData.append("message", inputText);
    if (selectedFile) {
      formData.append("attachment", selectedFile);
    }

    try {
      const res = await sendMessageAction(formData);
      if (res.success) {
        setInputText("");
        setSelectedFile(null);
        // Instant append to local state
        const updated = await getRoomMessages(activeRoomId);
        setMessages(updated);
      } else {
        toast.error(res.error || "Gagal mengirim pesan.");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan pengiriman.");
    } finally {
      setIsSending(false);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.badge || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickGreetings = currentUserRole === "siswa" ? [
    "Assalamu'alaikum Ustadz/Ustadzah 🙏",
    "Mau bertanya tentang materi tadi...",
    "Apakah ada tugas yang belum saya kumpulkan?",
    "Terima kasih atas koreksinya Ustadz/Ustadzah ⭐",
  ] : [
    "Wa'alaikumussalam Ananda sholeh/sholehah 😊",
    "Bagus sekali, terus tingkatkan belajarmu ya.",
    "Jangan lupa periksa kembali catatan tugasmu ya.",
    "Ada bagian materi yang belum dipahami?",
  ];

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex h-[calc(100vh-8.5rem)] min-h-[500px]">
      {/* LEFT SIDEBAR: CONTACT LIST & ROOMS */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-muted/20 shrink-0 ${
        !showMobileList ? "hidden md:flex" : "flex"
      }`}>
        {/* Search Header */}
        <div className="p-3.5 border-b border-border bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentUserRole === "siswa" ? "Cari ustadz/ustadzah..." : "Cari nama siswa atau kelas..."}
              className="w-full text-xs rounded-xl border border-input bg-muted/40 pl-9 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Contact / Conversation Tabs */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {/* Active Conversations */}
          {rooms.length > 0 && !searchQuery && (
            <div>
              <div className="px-3 py-2 bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Percakapan Terakhir
              </div>
              {rooms.map((r) => {
                const isActive = r.id === activeRoomId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setActiveRoomId(r.id);
                      setActiveContact(r.otherUser);
                      setShowMobileList(false);
                    }}
                    className={`w-full p-3 text-left flex items-start gap-3 transition-colors ${
                      isActive ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs ring-1 ring-border">
                        {r.otherUser.name ? r.otherUser.name.substring(0, 2).toUpperCase() : <UserIcon className="h-4 w-4" />}
                      </div>
                      {r.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                          {r.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-foreground truncate">{r.otherUser.name}</p>
                        {r.lastMessageAt && (
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                            {new Date(r.lastMessageAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {r.lastMessage || "Mulai percakapan baru"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Directory of Contacts */}
          <div>
            <div className="px-3 py-2 bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>{currentUserRole === "siswa" ? "Daftar Guru Pengampu" : "Daftar Siswa Kelas"}</span>
              <span className="text-[10px] font-normal lowercase">({filteredContacts.length})</span>
            </div>
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Tidak ada kontak ditemukan.
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleStartChatWithContact(contact)}
                  className="w-full p-3 text-left flex items-center gap-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-muted text-muted-foreground font-bold flex items-center justify-center text-xs ring-1 ring-border shrink-0">
                    {contact.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{contact.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{contact.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                    {contact.badge}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: ACTIVE CHAT ROOM & MESSAGES */}
      <div className={`flex-1 flex flex-col bg-background ${
        showMobileList ? "hidden md:flex" : "flex"
      }`}>
        {activeRoomId && activeContact ? (
          <>
            {/* Chat Room Top Bar */}
            <div className="relative h-16 border-b border-border bg-card px-4 flex items-center justify-between shrink-0 overflow-hidden">
              {/* Al-Azhar Triangular Prism Mosaic Accent */}
              <AlAzharCornerMosaic className="absolute top-0 right-0 w-36 sm:w-44 h-16 pointer-events-none opacity-60 select-none" />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileList(true)}
                  className="md:hidden h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="h-10 w-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs ring-1 ring-border shrink-0">
                  {activeContact.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground leading-tight">{activeContact.name}</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {activeContact.guru_bidang || activeContact.kelas || activeContact.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-muted-foreground hidden sm:inline">Aktif di Student Apps</span>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Mulai Percakapan</h4>
                  <p className="text-xs mt-1 max-w-sm">
                    Kirim pesan atau pertanyaan seputar materi pelajaran langsung kepada {activeContact.name}.
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                        m.isMe
                          ? "bg-primary text-primary-foreground rounded-br-xs"
                          : "bg-card border border-border text-foreground rounded-bl-xs"
                      }`}
                    >
                      {/* Optional Image Attachment */}
                      {m.attachmentUrl && m.attachmentType === "image" && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-black/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.attachmentUrl}
                            alt="Lampiran"
                            className="max-h-60 w-full object-cover"
                          />
                        </div>
                      )}

                      {/* Optional File Attachment */}
                      {m.attachmentUrl && m.attachmentType === "file" && (
                        <a
                          href={m.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/20 text-xs font-semibold mb-2 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="truncate">Unduh Lampiran File</span>
                        </a>
                      )}

                      <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>

                      <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                        m.isMe ? "text-primary-foreground/75" : "text-muted-foreground"
                      }`}>
                        <span>
                          {m.createdAt ? new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                        {m.isMe && (
                          <span>
                            {m.isRead ? <CheckCheck className="h-3 w-3 text-emerald-300" /> : <Check className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Greeting Chips */}
            <div className="px-4 py-2 bg-card border-t border-border flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {quickGreetings.map((greet, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputText(greet)}
                  className="text-[11px] whitespace-nowrap px-3 py-1 rounded-full bg-muted/60 hover:bg-muted text-foreground/80 hover:text-foreground border border-border/60 transition-colors shrink-0"
                >
                  {greet}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-card border-t border-border flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                title="Lampirkan Gambar / File"
                className={`h-10 w-10 p-0 rounded-xl ${selectedFile ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
              >
                <Paperclip className="h-5 w-5" />
              </Button>

              {selectedFile && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs shrink-0 max-w-[150px] truncate">
                  <span className="truncate">{selectedFile.name}</span>
                  <button type="button" onClick={() => setSelectedFile(null)}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 text-xs rounded-xl border border-input bg-muted/40 px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              />

              <Button
                type="submit"
                disabled={isSending || (!inputText.trim() && !selectedFile)}
                className="h-10 px-4 rounded-xl font-bold text-xs gap-1.5 shadow-sm"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Kirim</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">Saluran Komunikasi Student Apps</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Pilih salah satu kontak di sebelah kiri untuk memulai obrolan langsung dan konsultasi pelajaran.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
