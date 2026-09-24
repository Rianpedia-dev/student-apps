import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getUserChatRooms, getContactsForCurrentUser } from "@/actions/chat";
import { ChatContainer } from "@/components/chat/chat-container";

export const dynamic = "force-dynamic";

export default async function GuruChatPage() {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
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
        currentUserRole="guru"
        initialRooms={rooms}
        contacts={contacts}
      />
    </div>
  );
}
