"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Users,
  User,
  GraduationCap,
  LogOut,
  CalendarClock,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/providers/sidebar-provider";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ClipboardListIcon } from "@/components/icons/clipboard-list-icon";
import { LayoutDashboardIcon } from "@/components/icons/layout-dashboard-icon";
import { ContactIcon } from "@/components/icons/contact-icon";
import { CalendarDaysIcon } from "@/components/icons/calendar-days-icon";
import { VideoIcon } from "@/components/icons/video-icon";
import { BookOpenCheckIcon } from "@/components/icons/book-open-check-icon";
import { ChatIcon } from "@/components/icons/chat-icon";
import { AlertLoopIcon } from "@/components/icons/alert-loop-icon";
import { BuildingLibraryIcon } from "@/components/icons/building-library-icon";
import { TrophyIcon } from "@/components/icons/trophy-icon";
import { MegaphoneIcon } from "@/components/icons/megaphone-icon";
import { AlAzharCornerMosaic, AlAzharMosaicStrip } from "@/components/shared/alazhar-patterns";

const ANIMATED_ICONS = new Set<unknown>([
  ClipboardListIcon,
  LayoutDashboardIcon,
  ContactIcon,
  CalendarDaysIcon,
  VideoIcon,
  BookOpenCheckIcon,
  ChatIcon,
  AlertLoopIcon,
  BuildingLibraryIcon,
  TrophyIcon,
  MegaphoneIcon,
]);

interface MenuItemType {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  iconColor?: string;
}

function SidebarNavItem({
  item,
  isActive,
  collapsed,
  onNavigate,
}: {
  item: MenuItemType;
  isActive: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;
  const isAnimatedIcon = ANIMATED_ICONS.has(item.icon);

  if (collapsed) {
    return (
      <Tooltip key={item.href}>
        <TooltipTrigger
          render={
            <Link
              href={item.href}
              onClick={onNavigate}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 relative group",
                isActive
                  ? "bg-white/80 dark:bg-white/[0.12] backdrop-blur-xl text-foreground font-semibold border border-white/60 dark:border-white/20 shadow-md ring-1 ring-amber-500/40"
                  : "text-foreground dark:text-slate-200 hover:bg-white/50 dark:hover:bg-white/[0.05] hover:text-foreground dark:hover:text-white"
              )}
              aria-label={item.label}
            >
              <span className="menu-icon-wrapper">
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    item.iconColor || "text-foreground"
                  )}
                  {...(isAnimatedIcon ? { isHovered, isAnimated: true } : {})}
                />
              </span>
            </Link>
          }
        />
        <TooltipContent
          side="right"
          sideOffset={14}
          className="z-50 rounded-[var(--radius)] bg-popover px-3 py-1.5 text-xs font-semibold text-popover-foreground border border-border shadow-xl"
        >
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "flex items-center gap-2.5 py-2 px-3 mx-2 text-[13px] font-medium transition-all duration-200 group rounded-xl",
        isActive
          ? "bg-white/80 dark:bg-white/[0.10] backdrop-blur-xl text-foreground dark:text-white font-bold border border-white/70 dark:border-white/15 shadow-sm border-l-4 border-l-amber-500"
          : "text-foreground font-semibold dark:text-slate-200 hover:bg-white/50 dark:hover:bg-white/[0.06] hover:text-foreground dark:hover:text-white border border-transparent"
      )}
    >
      <span className="menu-icon-wrapper shrink-0">
        <Icon
          className={cn(
            "h-4.5 w-4.5 shrink-0 transition-colors",
            item.iconColor || "text-foreground"
          )}
          {...(isAnimatedIcon ? { isHovered, isAnimated: true } : {})}
        />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

interface SidebarProps {
  role: "admin" | "guru" | "siswa";
  userName?: string;
  userEmail?: string;
  kelas?: string | null;
  status?: string | null;
  jenjang?: "SD" | "SMP" | "ALL" | null;
  userImage?: string | null;
  onNavigate?: () => void;
  forceExpanded?: boolean;
  className?: string;
  isMobileDrawer?: boolean;
}

export function Sidebar({
  role,
  userName,
  userEmail,
  kelas,
  status,
  jenjang,
  userImage,
  onNavigate,
  forceExpanded = false,
  className,
  isMobileDrawer = false,
}: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const collapsed = forceExpanded ? false : isCollapsed;

  // Status "4" adalah Guru & Wali Kelas. Jika status "2", Guru Mapel (tanpa perwalian).
  const isWaliKelas = status === "4" || (role === "guru" && Boolean(kelas && status !== "2"));

  const profileHref =
    role === "guru"
      ? "/guru/profile"
      : role === "siswa"
        ? "/siswa/profile"
        : "/admin";

  const adminMenu: MenuItemType[] = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboardIcon, iconColor: "text-amber-500" },
    { label: "Kelola Siswa", href: "/admin/students", icon: GraduationCap, iconColor: "text-amber-600" },
    { label: "Kelola Guru", href: "/admin/teachers", icon: Users, iconColor: "text-orange-500" },
    { label: "Kelola Kelas", href: "/admin/classes", icon: BuildingLibraryIcon, iconColor: "text-emerald-500" },
    { label: "Mata Pelajaran", href: "/admin/subjects", icon: BookOpenCheckIcon, iconColor: "text-teal-600" },
    { label: "Jadwal Pelajaran", href: "/admin/schedules", icon: CalendarClock, iconColor: "text-cyan-600" },
    { label: "Presensi Siswa", href: "/admin/attendance", icon: ClipboardListIcon, iconColor: "text-orange-500" },
    { label: "Buat Pengumuman", href: "/admin/announcements", icon: MegaphoneIcon, iconColor: "text-rose-500" },
    { label: "Kalender Kegiatan", href: "/admin/calendar", icon: CalendarDaysIcon, iconColor: "text-purple-500" },
    { label: "Monitor Kelas Online", href: "/admin/kelas-online", icon: VideoIcon, iconColor: "text-indigo-500" },
    // Hanya tampil untuk Super Admin (jenjang === "ALL" atau default Super Admin)
    ...(jenjang === "ALL" || !jenjang
      ? [
          {
            label: "Kelola Admin",
            href: "/admin/manage-admins",
            icon: ShieldCheck,
            iconColor: "text-emerald-500",
          },
        ]
      : []),
  ];

  const guruMenu: MenuItemType[] = [
    { label: "Dashboard", href: "/guru", icon: LayoutDashboardIcon, iconColor: "text-amber-500" },
    { label: "Mata Pelajaran", href: "/guru/mapel", icon: BookOpenCheckIcon, iconColor: "text-teal-600" },
    { label: "Presensi KBM", href: "/guru/attendance", icon: ClipboardListIcon, iconColor: "text-orange-500" },
    { label: "Chat Siswa", href: "/guru/chat", icon: ChatIcon, iconColor: "text-cyan-600" },
    ...(isWaliKelas
      ? [
          { label: "Kelas Saya", href: "/guru/my-class", icon: BuildingLibraryIcon, iconColor: "text-emerald-500" },
        ]
      : []),
    { label: "Pengumuman", href: "/guru/announcements", icon: MegaphoneIcon, iconColor: "text-rose-500" },
    { label: "Kalender Kegiatan", href: "/guru/calendar", icon: CalendarDaysIcon, iconColor: "text-purple-500" },
    { label: "Prestasi Siswa", href: "/guru/achievements", icon: TrophyIcon, iconColor: "text-amber-500" },
    { label: "Kedisiplinan Siswa", href: "/guru/violations", icon: AlertLoopIcon, iconColor: "text-rose-500" },
    { label: "Kelas Online", href: "/guru/kelas-online", icon: VideoIcon, iconColor: "text-indigo-500" },
  ];

  const siswaMenu: MenuItemType[] = [
    { label: "Dashboard", href: "/siswa", icon: LayoutDashboardIcon, iconColor: "text-amber-500" },
    { label: "Mata Pelajaran", href: "/siswa/mapel", icon: BookOpenCheckIcon, iconColor: "text-teal-600" },
    { label: "Chat Guru", href: "/siswa/chat", icon: ChatIcon, iconColor: "text-cyan-600" },
    { label: "Kalender Kegiatan", href: "/siswa/calendar", icon: CalendarDaysIcon, iconColor: "text-purple-500" },
    { label: "Riwayat Presensi", href: "/siswa/attendance", icon: ClipboardListIcon, iconColor: "text-orange-500" },
    { label: "Data Pelanggaran", href: "/siswa/violations", icon: AlertLoopIcon, iconColor: "text-rose-500" },
    { label: "Kelas Online", href: "/siswa/kelas-online", icon: VideoIcon, iconColor: "text-indigo-500" },
  ];

  const menu = role === "admin" ? adminMenu : role === "guru" ? guruMenu : siswaMenu;

  return (
    <TooltipProvider delay={100}>
      <aside
        className={cn(
          "flex h-full flex-col border-r border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-950/45 backdrop-blur-2xl text-sidebar-foreground shadow-2xl transition-all duration-300 ease-in-out select-none",
          collapsed ? "w-20" : "w-[228px]",
          className
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "relative flex shrink-0 border-b border-white/40 dark:border-white/10 transition-all duration-300 overflow-hidden",
            collapsed
              ? "h-16 items-center justify-center px-2"
              : isMobileDrawer
                ? "py-4 px-3 flex-col items-center justify-center"
                : "py-4 px-3 flex-col items-center justify-center"
          )}
        >
          {/* Al-Azhar Triangular Prism Mosaic Accent */}
          <AlAzharCornerMosaic
            className={cn(
              "absolute top-0 right-0 pointer-events-none select-none transition-all",
              collapsed ? "w-16 h-16 opacity-75" : "w-32 h-20 opacity-80 dark:opacity-65"
            )}
          />
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href={`/${role}`}
                    className="flex h-12 w-12 items-center justify-center"
                  >
                    <Image
                      src="/images/logo-alazhar-cairo.avif"
                      alt="Logo SD - SMP Islam Al-Azhar Cairo Palembang"
                      width={48}
                      height={48}
                      priority
                      className="h-11 w-11 object-contain drop-shadow-sm"
                    />
                  </Link>
                }
              />
              <TooltipContent
                side="right"
                sideOffset={14}
                className="z-50 rounded-[var(--radius)] bg-popover px-3 py-1.5 text-xs font-semibold text-popover-foreground border border-border shadow-xl"
              >
                SD - SMP Islam Al-Azhar Cairo Palembang
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href={`/${role}`}
              onClick={onNavigate}
              className="flex flex-col items-center justify-center text-center overflow-hidden py-0.5 z-10 w-full"
            >
              <div className="relative h-20 w-20 sm:h-[84px] sm:w-[84px] shrink-0 flex items-center justify-center">
                <Image
                  src="/images/logo-alazhar-cairo.avif"
                  alt="Logo Al-Azhar Cairo Palembang"
                  width={84}
                  height={84}
                  priority
                  className="h-full w-full object-contain drop-shadow-sm"
                />
              </div>
              <div className="flex flex-col items-center min-w-0 mt-2">
                <span className="text-[13px] font-black tracking-tight text-foreground dark:text-white leading-snug uppercase">
                  Al-Azhar Cairo
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-widest uppercase mt-0.5">
                  Palembang
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Mobile Profile Card */}
        {isMobileDrawer && (
          <div className="px-3 pt-3 pb-2 border-b border-sidebar-border/60">
            <Link
              href={profileHref}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 p-2 rounded-xl transition-all duration-150 group border",
                pathname === profileHref
                  ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/40 text-foreground"
                  : "bg-muted/40 hover:bg-muted/70 dark:bg-muted/20 border-border/50 text-foreground hover:border-amber-500/30"
              )}
            >
              <div className="relative h-9.5 w-9.5 rounded-full overflow-hidden ring-2 ring-amber-500/70 shrink-0 bg-muted flex items-center justify-center shadow-xs">
                {userImage ? (
                  <img
                    src={userImage}
                    alt={userName || "Profil"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                    {userName ? userName.substring(0, 2).toUpperCase() : <User className="h-4 w-4" />}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[13px] font-bold text-foreground truncate block group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {userName || "Profil Saya"}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Nav Menu */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto py-2.5 text-[13px] scrollbar-thin scrollbar-thumb-sidebar-border transition-all duration-300",
            collapsed ? "px-2 space-y-1.5 flex flex-col items-center" : "pr-2 pl-0 space-y-0.5"
          )}
        >
          {!collapsed ? (
            <div className="px-3.5 pt-0.5 pb-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Menu Navigasi
            </div>
          ) : (
            <div className="w-8 border-b border-white/40 dark:border-white/10 my-1" />
          )}

          {menu.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        {/* Logout Footer */}
        <div
          className={cn(
            "border-t border-white/40 dark:border-white/10 shrink-0 transition-all duration-300",
            collapsed ? "p-2 flex justify-center" : isMobileDrawer ? "p-2.5 pb-3.5" : "p-2.5"
          )}
        >
          <form action={logoutAction} className={collapsed ? "" : "w-full"}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-[var(--radius)] text-destructive hover:bg-destructive/15 hover:text-destructive cursor-pointer"
                      aria-label="Keluar Sistem"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  }
                />
                <TooltipContent
                  side="right"
                  sideOffset={14}
                  className="z-50 rounded-[var(--radius)] bg-popover px-3 py-1.5 text-xs font-semibold text-destructive border border-border shadow-xl"
                >
                  Keluar Sistem
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start gap-2.5 rounded-[var(--radius)] py-1.5 px-3 text-destructive hover:bg-destructive/15 hover:text-destructive text-[13px] font-medium cursor-pointer transition-colors"
              >
                <LogOut className="h-4.5 w-4.5 shrink-0" />
                <span>Keluar Sistem</span>
              </Button>
            )}
          </form>
        </div>

        {/* Al-Azhar Colorful Triangular Prism Mosaic Strip at Bottom */}
        <div className="mt-auto shrink-0 w-full overflow-hidden border-t border-sidebar-border/30">
          <AlAzharMosaicStrip className="h-8 sm:h-9 w-full opacity-95 select-none pointer-events-none" />
        </div>
      </aside>
    </TooltipProvider>
  );
}
