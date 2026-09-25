import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getUserChatRooms, getContactsForCurrentUser } from "@/actions/chat";
import { ChatContainer } from "@/components/chat/chat-container";

export const dynamic = "force-dynamic";

export default async function SiswaChatPage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const [rooms, contacts] = await Promise.all([
    getUserChatRooms(),
    getContactsForCurrentUser(),
  ]);

  return (
    <div className="h-full">
      <ChatContainer
        currentUserId={session.id}
        currentUserName={session.name || "Siswa"}
        currentUserRole="siswa"
        initialRooms={rooms}
        contacts={contacts}
      />
    </div>
  );
}
