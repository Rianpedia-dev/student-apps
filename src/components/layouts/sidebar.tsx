"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Users,
  GraduationCap,
  School,
  Megaphone,
  AlertTriangle,
  LogOut,
  Sparkles,
  BookOpen,
  MonitorPlay,
  FileCheck,
  MessageSquare,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./sidebar-context";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ClipboardListIcon } from "@/components/ui/clipboard-list-icon";
import { LayoutDashboardIcon } from "@/components/ui/layout-dashboard-icon";
import { AccountIcon } from "@/components/ui/account-icon";
import { CalendarDaysIcon } from "@/components/ui/calendar-days-icon";
import { VideoIcon } from "@/components/ui/video-icon";
import { AlAzharCornerMosaic, AlAzharMosaicStrip } from "@/components/ui/alazhar-patterns";

const ANIMATED_ICONS = new Set<unknown>([
  ClipboardListIcon,
  LayoutDashboardIcon,
  AccountIcon,
  CalendarDaysIcon,
  VideoIcon,
]);

interface SidebarProps {
  role: "admin" | "guru" | "siswa";
  userName?: string;
  userEmail?: string;
  kelas?: string | null;
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
  onNavigate,
  forceExpanded = false,
  className,
  isMobileDrawer = false,
}: SidebarProps) {
  const pathname = usePathname();
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const { isCollapsed, toggleSidebar } = useSidebar();
  const collapsed = forceExpanded ? false : isCollapsed;

  const adminMenu = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboardIcon, iconColor: "text-amber-500" },
    { label: "Kelola Siswa", href: "/admin/students", icon: GraduationCap, iconColor: "text-amber-600" },
    { label: "Kelola Guru", href: "/admin/teachers", icon: Users, iconColor: "text-orange-500" },
    { label: "Kelola Kelas", href: "/admin/classes", icon: School, iconColor: "text-emerald-500" },
    { label: "Mata Pelajaran", href: "/admin/subjects", icon: BookOpen, iconColor: "text-teal-600" },
    { label: "Jadwal Pelajaran", href: "/admin/schedules", icon: CalendarClock, iconColor: "text-cyan-600" },
    { label: "Buat Pengumuman", href: "/admin/announcements", icon: Megaphone, iconColor: "text-rose-500" },
    { label: "Kalender Kegiatan", href: "/admin/calendar", icon: CalendarDaysIcon, iconColor: "text-purple-500" },
    { label: "Monitor Kelas Online", href: "/admin/kelas-online", icon: MonitorPlay, iconColor: "text-indigo-500" },
  ];

  const guruMenu = [
    { label: "Dashboard", href: "/guru", icon: LayoutDashboardIcon, iconColor: "text-amber-500" },
    { label: "Profil Saya", href: "/guru/profile", icon: AccountIcon, iconColor: "text-amber-600" },
    { label: "Tugas Siswa", href: "/guru/tugas", icon: FileCheck, iconColor: "text-emerald-600" },
    { label: "Jadwal & Mapel", href: "/guru/mapel", icon: BookOpen, iconColor: "text-teal-600" },
    { label: "Chat Siswa", href: "/guru/chat", icon: MessageSquare, iconColor: "text-cyan-600" },
    { label: "Kelas Saya", href: "/guru/my-class", icon: School, iconColor: "text-emerald-500" },
    { label: "Absensi Kelas", href: "/guru/attendance", icon: ClipboardListIcon, iconColor: "text-orange-500" },
    { label: "Pengumuman", href: "/guru/announcements", icon: Megaphone, iconColor: "text-rose-500" },
    { label: "Kalender Kegiatan", href: "/guru/calendar", icon: CalendarDaysIcon, iconColor: "text-purple-500" },
    { label: "Prestasi Siswa", href: "/guru/achievements", icon: Sparkles, iconColor: "text-amber-500" },
    { label: "Kelas Online", href: "/guru/kelas-online", icon: VideoIcon, iconColor: "text-indigo-500" },
  ];

  const siswaMenu = [
    { label: "Dashboard", href: "/siswa", icon: LayoutDashboardIcon, iconColor: "text-amber-500" },
    { label: "Profil Saya", href: "/siswa/profile", icon: AccountIcon, iconColor: "text-amber-600" },
    { label: "Mata Pelajaran", href: "/siswa/mapel", icon: BookOpen, iconColor: "text-teal-600" },
    { label: "Tugas Saya", href: "/siswa/tugas", icon: FileCheck, iconColor: "text-emerald-600" },
    { label: "Chat Guru", href: "/siswa/chat", icon: MessageSquare, iconColor: "text-cyan-600" },
    { label: "Kalender Kegiatan", href: "/siswa/calendar", icon: CalendarDaysIcon, iconColor: "text-purple-500" },
    { label: "Riwayat Absensi", href: "/siswa/attendance", icon: ClipboardListIcon, iconColor: "text-orange-500" },
    { label: "Data Pelanggaran", href: "/siswa/violations", icon: AlertTriangle, iconColor: "text-rose-500" },
    { label: "Kelas Online", href: "/siswa/kelas-online", icon: VideoIcon, iconColor: "text-indigo-500" },
  ];

  const menu = role === "admin" ? adminMenu : role === "guru" ? guruMenu : siswaMenu;

  return (
    <TooltipProvider delay={100}>
      <aside
        className={cn(
          "flex h-full flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-md text-sidebar-foreground shadow-xl transition-all duration-300 ease-in-out select-none",
          collapsed ? "w-20" : "w-64",
          className
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "relative flex shrink-0 border-b border-sidebar-border transition-all duration-300 overflow-hidden",
            collapsed
              ? "h-16 items-center justify-center px-2"
              : isMobileDrawer
                ? "py-5 px-4 flex-col items-center justify-center"
                : "py-5 sm:py-6 px-4 flex-col items-center justify-center"
          )}
        >
          {/* Al-Azhar Triangular Prism Mosaic Accent */}
          <AlAzharCornerMosaic
            className={cn(
              "absolute top-0 right-0 pointer-events-none select-none transition-all",
              collapsed ? "w-16 h-16 opacity-75" : "w-36 sm:w-40 h-24 opacity-85 dark:opacity-70"
            )}
          />
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href={`/${role}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-105"
                  >
                    <Image
                      src="/images/logo-alazhar-cairo.avif"
                      alt="Logo SD - SMP Islam Al-Azhar Cairo Palembang"
                      width={44}
                      height={44}
                      priority
                      className="h-10 w-10 object-contain drop-shadow-sm"
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
              className="flex flex-col items-center justify-center text-center overflow-hidden group py-1 z-10 w-full"
            >
              <div className="relative h-20 w-20 sm:h-22 sm:w-22 shrink-0 rounded-full overflow-hidden p-1 border-2 border-amber-500/30 bg-white shadow-md transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/images/logo-alazhar-cairo.avif"
                  alt="Logo Al-Azhar Cairo Palembang"
                  width={88}
                  height={88}
                  priority
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col items-center min-w-0 mt-2.5">
                <span className="text-[14px] font-black tracking-tight text-slate-800 dark:text-slate-100 leading-snug uppercase">
                  Al-Azhar Cairo
                </span>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 tracking-widest uppercase mt-0.5">
                  Palembang
                </span>
              </div>
            </Link>
          )}
        </div>


        {/* Nav Menu */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto py-3 text-[14px] scrollbar-thin scrollbar-thumb-sidebar-border transition-all duration-300",
            collapsed ? "px-2 space-y-1.5 flex flex-col items-center" : "pr-3 pl-0 space-y-1"
          )}
        >
          {!collapsed ? (
            <div className="px-5 pt-1 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Menu Navigasi
            </div>
          ) : (
            <div className="w-8 border-b border-sidebar-border my-1" />
          )}

          {menu.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon as React.ComponentType<{
              className?: string;
              isHovered?: boolean;
            }>;
            const isHovered = hoveredHref === item.href;
            const isAnimatedIcon = ANIMATED_ICONS.has(item.icon);

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger
                    render={
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        onMouseEnter={() => setHoveredHref(item.href)}
                        onMouseLeave={() =>
                          setHoveredHref((curr) => (curr === item.href ? null : curr))
                        }
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-[var(--radius)] transition-all duration-150 relative group",
                          isActive
                            ? "bg-slate-100 dark:bg-slate-800 text-foreground font-semibold border-l-4 border-amber-500 shadow-xs"
                            : "text-muted-foreground hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-foreground"
                        )}
                        aria-label={item.label}
                      >
                        <span className="menu-icon-wrapper">
                          <Icon
                            className={cn(
                              "h-5 w-5 shrink-0 transition-colors",
                              item.iconColor || "text-foreground"
                            )}
                            {...(isAnimatedIcon ? { isHovered } : {})}
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
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                onMouseEnter={() => setHoveredHref(item.href)}
                onMouseLeave={() =>
                  setHoveredHref((curr) => (curr === item.href ? null : curr))
                }
                className={cn(
                  "flex items-center gap-3 py-2 px-4 text-sm font-medium transition-all duration-150 group rounded-r-xl",
                  isActive
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-l-4 border-amber-500 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 border-l-4 border-transparent"
                )}
              >
                <span className="menu-icon-wrapper shrink-0">
                  <Icon
                    className={cn(
                      "h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                      item.iconColor || "text-foreground"
                    )}
                    {...(isAnimatedIcon ? { isHovered } : {})}
                  />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div
          className={cn(
            "border-t border-sidebar-border shrink-0 transition-all duration-300",
            collapsed ? "p-2 flex justify-center" : isMobileDrawer ? "p-3 pb-4" : "p-3"
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
                className="w-full justify-start gap-3 rounded-[var(--radius)] py-2 px-3 text-destructive hover:bg-destructive/15 hover:text-destructive text-sm font-medium cursor-pointer transition-colors"
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

