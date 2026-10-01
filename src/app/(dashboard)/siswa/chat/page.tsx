import { redirect } from "next/navigation";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getUserChatRooms, getContactsForCurrentUser, getOrCreateChatRoom } from "@/actions/chat";
import { ChatContainer } from "@/components/features/chat/chat-container";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    guruId?: string;
    userId?: string;
    roomId?: string;
  }>;
}

export default async function SiswaChatPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const { guruId, userId, roomId } = await searchParams;
  const targetGuruId = guruId || userId || null;

  let initialRoomId: string | null = roomId || null;

  // Jika siswa membuka chat dengan target guru tertentu, buat atau dapatkan room-nya langsung
  if (targetGuruId) {
    try {
      const res = await getOrCreateChatRoom(targetGuruId);
      if (res.success && res.room) {
        initialRoomId = res.room.id;
      }
    } catch (err) {
      console.error("Gagal mendapatkan atau membuat room chat guru:", err);
    }
  }

  const [rooms, contacts] = await Promise.all([
    getUserChatRooms(),
    getContactsForCurrentUser(),
  ]);

  return (
    <div className="h-full w-full">
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
            Memuat obrolan...
          </div>
        }
      >
        <ChatContainer
          currentUserId={session.id}
          currentUserName={session.name || "Siswa"}
          currentUserRole="siswa"
          initialRooms={rooms}
          contacts={contacts}
          initialActiveRoomId={initialRoomId}
          initialTargetUserId={targetGuruId}
        />
      </Suspense>
    </div>
  );
}
