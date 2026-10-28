"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
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

export type NimbusFx = "plane" | "drop" | "spin" | "glow" | "wave" | "pop" | "none";

interface MenuItemType {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  iconColor?: string;
  fx?: NimbusFx;
}

/* ---------- Liquid Sidebar Styles & Keyframes ---------- */
const NIMBUS_SIDEBAR_CSS = `
/* Completely hide scrollbars on sidebar and nav */
.nimbus-sidebar-nav::-webkit-scrollbar,
.no-scrollbar::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
.nimbus-sidebar-nav,
.no-scrollbar {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}

.nimbus-sidebar-glass {
  background: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(20px) saturate(1.25) brightness(1.05);
  -webkit-backdrop-filter: blur(20px) saturate(1.25) brightness(1.05);
  box-shadow:
    inset 0 1px 1.5px rgba(255, 255, 255, 0.85),
    inset -1px 0 0 rgba(255, 255, 255, 0.4),
    0 20px 45px -15px rgba(0, 40, 90, 0.08);
}
:is(.dark) .nimbus-sidebar-glass {
  background: rgba(10, 15, 26, 0.62);
  backdrop-filter: blur(20px) saturate(1.25) brightness(1.02);
  -webkit-backdrop-filter: blur(20px) saturate(1.25) brightness(1.02);
  box-shadow:
    inset 0 1px 1.5px rgba(255, 255, 255, 0.15),
    inset -1px 0 0 rgba(255, 255, 255, 0.08),
    0 20px 45px -15px rgba(0, 0, 0, 0.6);
}

/* Liquid Active Drop */
.nimbus-drop {
  position: absolute;
  border-radius: 14px;
  pointer-events: none;
  z-index: 0;
  will-change: transform, height, width;
  background: radial-gradient(120% 140% at 30% 0%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.25) 55%), rgba(255, 255, 255, 0.65);
  box-shadow:
    inset 0 1.5px 2px rgba(255, 255, 255, 0.95),
    inset 0 -2px 6px rgba(5, 150, 105, 0.22),
    inset 0 0 0 1px rgba(255, 255, 255, 0.7),
    0 6px 18px -4px rgba(5, 150, 105, 0.22),
    0 2px 6px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  transition: opacity 0.25s ease-out;
}

:is(.dark) .nimbus-drop {
  background: radial-gradient(120% 140% at 30% 0%, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.02) 55%), rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1.5px 2px rgba(255, 255, 255, 0.35),
    inset 0 -2px 6px rgba(16, 185, 129, 0.25),
    inset 0 0 0 1px rgba(255, 255, 255, 0.18),
    0 8px 24px -4px rgba(0, 0, 0, 0.55),
    0 2px 6px rgba(0, 0, 0, 0.3);
}

/* Nav Item */
.nimbus-item {
  position: relative;
  z-index: 1;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.nimbus-item:hover {
  filter: brightness(1.05);
}

/* Icon Scene Animations */
.nv-ico {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
}
.nv-ico svg {
  transition: transform .45s cubic-bezier(.3,1.6,.5,1);
}
.nimbus-item[aria-current="page"] .nv-ico svg {
  transform: translateY(-1px) scale(1.08);
}
.nv-door {
  fill: transparent;
}
.nv-ico[data-fx="pop"] svg {
  animation: nvPop .5s cubic-bezier(.3,1.6,.5,1) both;
}
@keyframes nvPop {
  0% { transform: scale(.72); }
  60% { transform: scale(1.2); }
  100% { transform: translateY(-1px) scale(1.08); }
}
.nv-ico[data-fx="plane"] svg {
  animation: nvPlane 1.15s cubic-bezier(.55,0,.3,1) both;
}
@keyframes nvPlane {
  0% { transform: none; }
  12% { transform: translate(-3px,2px) rotate(7deg); }
  42% { transform: translate(64px,-26px) rotate(-24deg) scale(.9); opacity: 0; }
  43% { transform: translate(-60px,16px) rotate(-12deg) scale(.9); opacity: 0; }
  58% { opacity: 1; }
  80% { transform: translate(3px,-1px) rotate(2deg); }
  100% { transform: translateY(-1px) scale(1.08); }
}
.nv-ico[data-fx="plane"]::after {
  content: "";
  position: absolute;
  left: 55%;
  top: 48%;
  height: 2px;
  width: 46px;
  border-radius: 2px;
  transform-origin: 0 50%;
  background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.95));
  animation: nvTrail 1.15s ease-out both;
  pointer-events: none;
}
@keyframes nvTrail {
  0%,8% { opacity: 0; transform: rotate(-22deg) scaleX(0); }
  30% { opacity: .9; transform: rotate(-22deg) scaleX(1); }
  55%,100% { opacity: 0; transform: rotate(-22deg) translateX(30px) scaleX(.2); }
}
.nv-ico[data-fx="drop"] svg {
  animation: nvDrop .95s cubic-bezier(.4,0,.3,1) both;
  transform-origin: 50% 100%;
}
@keyframes nvDrop {
  0% { transform: translateY(-1px); }
  26% { transform: translateY(-13px) scale(.88,1.12); }
  46% { transform: translateY(3px) scale(1.3,.68); }
  62% { transform: translateY(-3px) scale(.92,1.08); }
  80% { transform: translateY(0) scale(1.04,.97); }
  100% { transform: translateY(-1px) scale(1.08); }
}
.nv-ico[data-fx="drop"]::before,
.nv-ico[data-fx="drop"]::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 4px;
  height: 4px;
  margin-left: -2px;
  border-radius: 50%;
  background: #059669;
  opacity: 0;
  pointer-events: none;
}
.nv-ico[data-fx="drop"]::before {
  animation: nvSplashL .95s ease-out both;
}
.nv-ico[data-fx="drop"]::after {
  animation: nvSplashR .95s ease-out both;
}
@keyframes nvSplashL {
  0%,44% { opacity: 0; transform: none; }
  50% { opacity: .9; transform: translate(-6px,-8px); }
  75%,100% { opacity: 0; transform: translate(-13px,2px) scale(.4); }
}
@keyframes nvSplashR {
  0%,44% { opacity: 0; transform: none; }
  50% { opacity: .9; transform: translate(6px,-9px); }
  75%,100% { opacity: 0; transform: translate(14px,2px) scale(.4); }
}
.nv-ico[data-fx="spin"] svg {
  animation: nvSpin 1s cubic-bezier(.2,.75,.25,1) both;
}
@keyframes nvSpin {
  0% { transform: perspective(80px) rotateY(0); }
  100% { transform: perspective(80px) rotateY(360deg) translateY(-1px) scale(1.08); }
}
.nv-ico[data-fx="glow"] svg {
  animation: nvHop .8s cubic-bezier(.3,1.4,.5,1) both;
  transform-origin: 50% 100%;
}
@keyframes nvHop {
  0% { transform: none; }
  30% { transform: translateY(-5px) scale(1.04,.96); }
  55% { transform: translateY(0) scale(1.12,.88); }
  75% { transform: translateY(-2px) scale(.98,1.04); }
  100% { transform: translateY(-1px) scale(1.08); }
}
.nv-ico[data-fx="wave"] svg {
  animation: nvWave .9s ease-in-out both;
  transform-origin: 50% 92%;
}
@keyframes nvWave {
  0% { transform: none; }
  20% { transform: rotate(-15deg); }
  40% { transform: rotate(12deg); }
  60% { transform: rotate(-8deg); }
  80% { transform: rotate(4deg); }
  100% { transform: translateY(-1px) scale(1.08); }
}

@media (prefers-reduced-motion: reduce) {
  .nv-ico svg, .nv-ico::before, .nv-ico::after {
    animation: none !important;
    transition: none !important;
  }
}
`;

type Body = { y: number; v: number };
type Sat = { x: number; y: number; vx: number; vy: number; r: number; k: number };

function makeLiquidState() {
  return {
    a: { y: 0, v: 0 } as Body,
    b: { y: 0, v: 0 } as Body,
    sx: { s: 1, v: 0 },
    lead: 0 as 0 | 1,
    lagFrom: 0,
    sats: [] as Sat[],
    t: { x: 0, y: 0, w: 0, h: 42, cx: 0, cy: 0 },
    mouse: { x: 0, y: 0, s: 0, on: false },
    moving: false,
    split: false,
    ready: false,
    w: 0,
    h: 0,
    visible: true,
    reduce: false,
    raf: 0,
    last: 0,
    time: 0,
  };
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
    { label: "Dashboard", href: "/admin", icon: LayoutDashboardIcon, iconColor: "text-amber-500", fx: "glow" },
    { label: "Kelola Siswa", href: "/admin/students", icon: GraduationCap, iconColor: "text-amber-600", fx: "pop" },
    { label: "Kelola Guru", href: "/admin/teachers", icon: Users, iconColor: "text-orange-500", fx: "wave" },
    { label: "Kelola Kelas", href: "/admin/classes", icon: BuildingLibraryIcon, iconColor: "text-emerald-500", fx: "pop" },
    { label: "Mata Pelajaran", href: "/admin/subjects", icon: BookOpenCheckIcon, iconColor: "text-teal-600", fx: "glow" },
    { label: "Jadwal Pelajaran", href: "/admin/schedules", icon: CalendarClock, iconColor: "text-cyan-600", fx: "spin" },
    { label: "Presensi Siswa", href: "/admin/attendance", icon: ClipboardListIcon, iconColor: "text-orange-500", fx: "drop" },
    { label: "Buat Pengumuman", href: "/admin/announcements", icon: MegaphoneIcon, iconColor: "text-rose-500", fx: "pop" },
    { label: "Kalender Kegiatan", href: "/admin/calendar", icon: CalendarDaysIcon, iconColor: "text-purple-500", fx: "spin" },
    { label: "Monitor Kelas Online", href: "/admin/kelas-online", icon: VideoIcon, iconColor: "text-indigo-500", fx: "wave" },
    ...(jenjang === "ALL" || !jenjang
      ? [
          {
            label: "Kelola Admin",
            href: "/admin/manage-admins",
            icon: ShieldCheck,
            iconColor: "text-emerald-500",
            fx: "glow" as NimbusFx,
          },
        ]
      : []),
  ];

  const guruMenu: MenuItemType[] = [
    { label: "Dashboard", href: "/guru", icon: LayoutDashboardIcon, iconColor: "text-amber-500", fx: "glow" },
    { label: "Mata Pelajaran", href: "/guru/mapel", icon: BookOpenCheckIcon, iconColor: "text-teal-600", fx: "glow" },
    { label: "Presensi KBM", href: "/guru/attendance", icon: ClipboardListIcon, iconColor: "text-orange-500", fx: "drop" },
    { label: "Chat Siswa", href: "/guru/chat", icon: ChatIcon, iconColor: "text-cyan-600", fx: "wave" },
    ...(isWaliKelas
      ? [
          { label: "Kelas Saya", href: "/guru/my-class", icon: BuildingLibraryIcon, iconColor: "text-emerald-500", fx: "pop" as NimbusFx },
        ]
      : []),
    { label: "Pengumuman", href: "/guru/announcements", icon: MegaphoneIcon, iconColor: "text-rose-500", fx: "pop" },
    { label: "Kalender Kegiatan", href: "/guru/calendar", icon: CalendarDaysIcon, iconColor: "text-purple-500", fx: "spin" },
    { label: "Prestasi Siswa", href: "/guru/achievements", icon: TrophyIcon, iconColor: "text-amber-500", fx: "pop" },
    { label: "Kedisiplinan Siswa", href: "/guru/violations", icon: AlertLoopIcon, iconColor: "text-rose-500", fx: "drop" },
    { label: "Kelas Online", href: "/guru/kelas-online", icon: VideoIcon, iconColor: "text-indigo-500", fx: "wave" },
  ];

  const siswaMenu: MenuItemType[] = [
    { label: "Dashboard", href: "/siswa", icon: LayoutDashboardIcon, iconColor: "text-amber-500", fx: "glow" },
    { label: "Mata Pelajaran", href: "/siswa/mapel", icon: BookOpenCheckIcon, iconColor: "text-teal-600", fx: "glow" },
    { label: "Chat Guru", href: "/siswa/chat", icon: ChatIcon, iconColor: "text-cyan-600", fx: "wave" },
    { label: "Kalender Kegiatan", href: "/siswa/calendar", icon: CalendarDaysIcon, iconColor: "text-purple-500", fx: "spin" },
    { label: "Riwayat Presensi", href: "/siswa/attendance", icon: ClipboardListIcon, iconColor: "text-orange-500", fx: "drop" },
    { label: "Data Pelanggaran", href: "/siswa/violations", icon: AlertLoopIcon, iconColor: "text-rose-500", fx: "drop" },
    { label: "Kelas Online", href: "/siswa/kelas-online", icon: VideoIcon, iconColor: "text-indigo-500", fx: "wave" },
  ];

  const menu = role === "admin" ? adminMenu : role === "guru" ? guruMenu : siswaMenu;

  // Active item index
  const activeIndex = useMemo(() => {
    const idx = menu.findIndex((item) => {
      if (pathname === item.href) return true;
      if (item.href === "/admin" || item.href === "/guru" || item.href === "/siswa") {
        return false;
      }
      return pathname.startsWith(item.href);
    });
    return idx >= 0 ? idx : 0;
  }, [menu, pathname]);

  // Liquid Physics & Animation State
  const navRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const iconRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const st = useRef(makeLiquidState());
  const [fx, setFx] = useState({ i: -1, n: 0 });

  /* ---- draw frame ---- */
  const draw = useCallback(() => {
    const s = st.current;
    const T = s.t;
    const top = Math.min(s.a.y, s.b.y);
    const bottom = Math.max(s.a.y, s.b.y) + T.h;
    const height = Math.max(T.h, bottom - top);

    // Update DOM liquid drop element
    if (dropRef.current) {
      dropRef.current.style.transform = `translate3d(0, ${top}px, 0) scaleX(${s.sx.s})`;
      dropRef.current.style.height = `${height}px`;
      dropRef.current.style.top = `0px`;
      dropRef.current.style.left = `${T.x}px`;
      dropRef.current.style.width = `${T.w}px`;
    }

    // Draw satellite droplets on canvas
    const cv = canvasRef.current;
    if (cv) {
      const ctx = cv.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, cv.width, cv.height);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        // Draw satellite droplets
        if (s.sats.length > 0) {
          ctx.save();
          ctx.scale(dpr, dpr);
          s.sats.forEach((sat) => {
            ctx.beginPath();
            ctx.arc(sat.x, sat.y, sat.r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(16, 185, 129, 0.45)";
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
            ctx.stroke();
          });
          ctx.restore();
        }
      }
    }
  }, []);

  /* ---- physics step ---- */
  const step = useCallback((dt: number, now: number) => {
    const s = st.current;
    const T = s.t;
    s.time += dt;

    const bodies = [s.a, s.b];
    let still = true;

    if (s.reduce) {
      s.a.y = s.b.y = T.y;
      s.a.v = s.b.v = 0;
      s.sx.s = 1;
      s.sats = [];
    } else {
      bodies.forEach((B, i) => {
        const lead = i === s.lead;
        const k = lead ? 220 : 75;
        const c = lead ? 26 : 14;
        const f = !lead && now < s.lagFrom ? 0.08 : 1;
        B.v += (k * (T.y - B.y) - c * B.v) * dt * f;
        B.y += B.v * dt;

        if (Math.abs(T.y - B.y) > 0.3 || Math.abs(B.v) > 3) still = false;
      });

      const L = bodies[s.lead];
      const sxT = 1 - 0.15 * Math.min(Math.abs(L.v) / 1400, 1);
      s.sx.v += (280 * (sxT - s.sx.s) - 9 * s.sx.v) * dt;
      s.sx.s += s.sx.v * dt;
      if (Math.abs(s.sx.s - 1) > 0.002 || Math.abs(s.sx.v) > 0.02) still = false;

      // Break the neck: spawn droplets between head and tail on long jumps
      const sep = Math.abs(s.a.y - s.b.y);
      if (!s.split && s.moving && sep > 55) {
        s.split = true;
        const lo = bodies[1 - s.lead], hi = bodies[s.lead];
        [0.32, 0.52, 0.72].forEach((t, j) => {
          s.sats.push({
            x: T.cx + (Math.random() - 0.5) * 8,
            y: lo.y + (hi.y - lo.y) * t + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 28,
            vy: (lo.v + hi.v) * 0.42,
            r: 4.5 + Math.random() * 2 - j * 0.4,
            k: 70 + Math.random() * 90,
          });
        });
      }

      s.sats = s.sats.filter((d) => {
        d.vy += (d.k * (T.y - d.y) - 9 * d.vy) * dt;
        d.vx += (-16 * (d.x - T.cx) - 8 * d.vx) * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (Math.abs(T.y - d.y) < T.h * 0.5) d.r -= dt * 25;
        return d.r > 0.6;
      });
      if (s.sats.length) still = false;
    }

    if (s.moving && still) {
      s.moving = false;
    }

    const targetMouse = s.mouse.on ? 1 : 0;
    s.mouse.s += (targetMouse - s.mouse.s) * Math.min(1, dt * 7);
  }, []);

  /* ---- requestAnimationFrame loop ---- */
  const loop = useCallback(() => {
    const s = st.current;
    if (s.raf) return;
    s.last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - s.last) / 1000, 1 / 30);
      s.last = now;
      step(dt, now);
      draw();
      const busy = s.moving || s.sats.length || s.mouse.s > 0.01;
      if (s.visible && (!s.reduce || busy)) s.raf = requestAnimationFrame(tick);
      else s.raf = 0;
    };
    s.raf = requestAnimationFrame(tick);
  }, [draw, step]);

  /* ---- measure layout ---- */
  const measure = useCallback(() => {
    const nav = navRef.current;
    const el = itemRefs.current[activeIndex];
    if (!nav || !el) return;
    const s = st.current;
    s.w = nav.offsetWidth;
    s.h = nav.offsetHeight;
    const T = s.t;

    T.x = el.offsetLeft;
    T.w = el.offsetWidth;
    T.h = el.offsetHeight;
    const ny = el.offsetTop;
    T.cx = T.x + T.w / 2;
    T.cy = ny + T.h / 2;

    if (!s.ready) {
      s.a.y = s.b.y = ny;
      s.ready = true;
    } else if (Math.abs(ny - T.y) > 0.5) {
      s.lead = Math.abs(ny - s.a.y) <= Math.abs(ny - s.b.y) ? 0 : 1;
      s.lagFrom = performance.now() + 75;
      s.moving = true;
      s.split = false;
    }
    T.y = ny;

    // Canvas size
    const cv = canvasRef.current;
    if (cv) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = nav.clientWidth, Hh = nav.scrollHeight;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(Hh * dpr)) {
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(Hh * dpr);
        cv.style.width = `${W}px`;
        cv.style.height = `${Hh}px`;
      }
    }
    loop();
  }, [activeIndex, loop]);

  useEffect(() => {
    const s = st.current;
    s.reduce = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([e]) => {
      s.visible = e.isIntersecting;
      if (s.visible) loop();
    });
    if (navRef.current) io.observe(navRef.current);
    const vis = () => {
      s.visible = document.visibilityState === "visible";
      if (s.visible) loop();
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, [loop]);

  useLayoutEffect(() => {
    measure();
  }, [measure, menu.length, collapsed]);

  const measureRef = useRef(measure);
  measureRef.current = measure;

  useEffect(() => {
    let lastW = -1;
    const ro = new ResizeObserver(() => {
      const w = navRef.current?.offsetWidth ?? 0;
      if (w !== lastW) {
        lastW = w;
        st.current.ready = false;
        measureRef.current();
      }
    });
    if (navRef.current) ro.observe(navRef.current);
    return () => ro.disconnect();
  }, []);

  const handleItemClick = (e: React.MouseEvent, i: number) => {
    const kind = menu[i]?.fx ?? "pop";
    setFx({ i, n: fx.n + 1 });
    onNavigate?.();
  };

  return (
    <TooltipProvider delay={100}>
      <aside
        className={cn(
          "nimbus-sidebar-glass flex h-full flex-col border-r border-white/50 dark:border-white/10 text-sidebar-foreground transition-all duration-300 ease-in-out select-none relative overflow-hidden",
          collapsed ? "w-20" : "w-[228px]",
          className
        )}
      >
        <style dangerouslySetInnerHTML={{ __html: NIMBUS_SIDEBAR_CSS }} />

        {/* SVG Refraction Filter */}
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <filter id="nimbus-refract" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.006 0.02" numOctaves="2" seed="7" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
            <feDisplacementMap in="SourceGraphic" in2="soft" scale="60" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

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
                className="z-50 rounded-xl bg-popover/90 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-popover-foreground border border-border shadow-xl"
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

        {/* Liquid Nav Menu */}
        <nav
          ref={navRef as any}
          className={cn(
            "nimbus-sidebar-nav flex-1 overflow-y-auto overflow-x-hidden py-2.5 text-[13px] no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden transition-all duration-300 relative",
            collapsed ? "px-2 space-y-1.5 flex flex-col items-center" : "pr-2 pl-0 space-y-0.5"
          )}
          onPointerMove={(e) => {
            if (e.pointerType !== "mouse" || !navRef.current) return;
            const r = navRef.current.getBoundingClientRect();
            const s = st.current;
            s.mouse.x = e.clientX - r.left;
            s.mouse.y = e.clientY - r.top + navRef.current.scrollTop;
            s.mouse.on = true;
            loop();
          }}
          onPointerLeave={() => {
            st.current.mouse.on = false;
            loop();
          }}
        >
          {/* Liquid Active Drop Background */}
          <span
            ref={dropRef}
            className="nimbus-drop"
            aria-hidden="true"
          />

          {/* Liquid Ripple & Satellite Droplets Overlay Canvas */}
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 z-0 max-w-full overflow-hidden"
            aria-hidden="true"
          />

          {!collapsed ? (
            <div className="px-3.5 pt-0.5 pb-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground relative z-10">
              Menu Navigasi
            </div>
          ) : (
            <div className="w-8 border-b border-white/40 dark:border-white/10 my-1 relative z-10" />
          )}

          {menu.map((item, index) => {
            const isActive = activeIndex === index;
            const kind = item.fx ?? "pop";
            const playing = fx.i === index && kind !== "none";
            const Icon = item.icon;

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger
                    render={
                      <Link
                        href={item.href}
                        ref={(el: HTMLElement | null) => {
                          itemRefs.current[index] = el;
                        }}
                        onClick={(e) => handleItemClick(e, index)}
                        className={cn(
                          "nimbus-item flex h-11 w-11 items-center justify-center rounded-2xl transition-colors duration-200 relative group z-10 select-none",
                          isActive
                            ? "text-emerald-700 dark:text-emerald-300 font-bold"
                            : "text-foreground/80 dark:text-slate-300 hover:text-foreground dark:hover:text-white"
                        )}
                        aria-label={item.label}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span
                          className="nv-ico"
                          key={playing ? fx.n : 0}
                          data-fx={playing ? kind : undefined}
                          ref={(el: HTMLSpanElement | null) => {
                            iconRefs.current[index] = el;
                          }}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5 shrink-0 transition-colors",
                              isActive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : item.iconColor || "text-foreground"
                            )}
                          />
                        </span>
                      </Link>
                    }
                  />
                  <TooltipContent
                    side="right"
                    sideOffset={14}
                    className="z-50 rounded-xl bg-popover/90 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-popover-foreground border border-border/80 shadow-xl"
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
                ref={(el: HTMLElement | null) => {
                  itemRefs.current[index] = el;
                }}
                onClick={(e) => handleItemClick(e, index)}
                className={cn(
                  "nimbus-item flex items-center gap-2.5 py-2 px-3 mx-2 text-[13px] font-medium transition-colors duration-200 group rounded-xl relative z-10 select-none",
                  isActive
                    ? "text-emerald-800 dark:text-emerald-300 font-bold"
                    : "text-foreground/85 font-semibold dark:text-slate-300 hover:text-foreground dark:hover:text-white"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className="nv-ico shrink-0"
                  key={playing ? fx.n : 0}
                  data-fx={playing ? kind : undefined}
                  ref={(el: HTMLSpanElement | null) => {
                    iconRefs.current[index] = el;
                  }}
                >
                  <Icon
                    className={cn(
                      "h-4.5 w-4.5 shrink-0 transition-colors",
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : item.iconColor || "text-foreground"
                    )}
                  />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Footer with Liquid Effect */}
        <div
          className={cn(
            "border-t border-white/40 dark:border-white/10 shrink-0 transition-all duration-300 relative z-10",
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
                      className="h-11 w-11 rounded-2xl text-destructive hover:bg-destructive/15 hover:text-destructive cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                      aria-label="Keluar Sistem"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  }
                />
                <TooltipContent
                  side="right"
                  sideOffset={14}
                  className="z-50 rounded-xl bg-popover/90 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-destructive border border-border/80 shadow-xl"
                >
                  Keluar Sistem
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start gap-2.5 rounded-xl py-2 px-3 text-destructive hover:bg-destructive/15 hover:text-destructive text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:translate-x-0.5 active:scale-98"
              >
                <LogOut className="h-4.5 w-4.5 shrink-0" />
                <span>Keluar Sistem</span>
              </Button>
            )}
          </form>
        </div>

        {/* Al-Azhar Colorful Triangular Prism Mosaic Strip at Bottom */}
        <div className="mt-auto shrink-0 w-full overflow-hidden border-t border-sidebar-border/30 relative z-10">
          <AlAzharMosaicStrip className="h-8 sm:h-9 w-full opacity-95 select-none pointer-events-none" />
        </div>
      </aside>
    </TooltipProvider>
  );
}
