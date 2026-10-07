"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider, useSidebar } from "@/components/providers/sidebar-provider";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { cn } from "@/lib/utils";
import { KelasOnlineProvider } from "@/components/features/kelas-online/kelas-online-context";
import { PersistentVideoHost } from "@/components/features/kelas-online/persistent-video-host";

interface DashboardShellProps {
  role: "admin" | "guru" | "siswa";
  userName: string;
  userEmail: string;
  kelas?: string | null;
  status?: string | null;
  userImage?: string | null;
  children: React.ReactNode;
}

function DashboardLayoutContent({
  role,
  userName,
  userEmail,
  kelas,
  status,
  userImage,
  children,
}: DashboardShellProps) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  const isChatPage = pathname?.endsWith("/chat") || pathname?.includes("/chat/");

  return (
    <div
      className={cn(
        "flex min-h-screen bg-transparent text-foreground relative",
        isChatPage && "h-dvh max-h-dvh overflow-hidden"
      )}
    >
      {/* Desktop & Tablet Sidebar */}
      <div
        className={cn(
          "hidden md:block shrink-0 transition-all duration-300 ease-in-out",
          isCollapsed ? "md:w-20" : "md:w-[228px]"
        )}
      >
        <div
          className={cn(
            "fixed inset-y-0 z-40 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-20" : "w-[228px]"
          )}
        >
          <Sidebar
            role={role}
            userName={userName}
            userEmail={userEmail}
            kelas={kelas}
            status={status}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex flex-1 flex-col min-w-0 transition-all duration-300 ease-in-out",
          isChatPage && "h-dvh max-h-dvh overflow-hidden"
        )}
      >
        <Navbar
          role={role}
          userName={userName}
          userEmail={userEmail}
          kelas={kelas}
          status={status}
          userImage={userImage}
        />
        <main
          className={cn(
            isChatPage
              ? "flex-1 p-0 w-full min-w-0 h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] overflow-hidden flex flex-col"
              : "flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 pb-8 w-full max-w-7xl mx-auto min-w-0"
          )}
        >
          {children}
        </main>
        {!isChatPage && <Footer />}
      </div>
    </div>
  );
}

export function DashboardShell(props: DashboardShellProps) {
  return (
    <SidebarProvider>
      <KelasOnlineProvider>
        <DashboardLayoutContent {...props} />
        <PersistentVideoHost />
      </KelasOnlineProvider>
    </SidebarProvider>
  );
}
