"use client";

import createGlobe, { type COBEOptions } from "cobe";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowLeftIcon, Home, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const GLOBE_CONFIG: Omit<COBEOptions, "width" | "height"> = {
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.2,
  baseColor: [1, 1, 1],
  markerColor: [5 / 255, 150 / 255, 105 / 255], // Aksen Hijau Emerald Al-Azhar
  glowColor: [236 / 255, 253 / 255, 245 / 255],
  markers: [
    { location: [21.4225, 39.8262], size: 0.08 }, // Makkah Al-Mukarramah
    { location: [24.4672, 39.6112], size: 0.06 }, // Madinah Al-Munawwarah
    { location: [30.0444, 31.2357], size: 0.07 }, // Kairo (Al-Azhar Cairo)
    { location: [-2.9761, 104.7754], size: 0.09 }, // Palembang (Al-Azhar Cairo Palembang)
  ],
};

export interface GlobeProps {
  className?: string;
  config?: Partial<COBEOptions>;
}

export function Globe({ className, config }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef(0);
  const widthRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      if (canvas) {
        widthRef.current = canvas.offsetWidth;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const initialWidth = (widthRef.current || 300) * 2;

    const globe = createGlobe(canvas, {
      ...GLOBE_CONFIG,
      ...config,
      width: initialWidth,
      height: initialWidth,
      phi: 0,
      theta: config?.theta ?? 0.3,
      mapSamples: config?.mapSamples ?? 16000,
      mapBrightness: config?.mapBrightness ?? 1.2,
      baseColor: config?.baseColor ?? [1, 1, 1],
      markerColor: config?.markerColor ?? [5 / 255, 150 / 255, 105 / 255],
      glowColor: config?.glowColor ?? [236 / 255, 253 / 255, 245 / 255],
      diffuse: config?.diffuse ?? 0.4,
      devicePixelRatio: config?.devicePixelRatio ?? 2,
      dark: config?.dark ?? 0,
    });

    let animationFrameId: number;
    const animate = () => {
      phiRef.current += 0.005;
      globe.update({ phi: phiRef.current });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      globe.destroy();
      window.removeEventListener("resize", handleResize);
    };
  }, [config]);

  return (
    <div className={cn("relative aspect-square w-full max-w-md", className)}>
      <canvas
        ref={canvasRef}
        className="size-full [contain:layout_paint_size]"
      />
    </div>
  );
}

// 🎞️ Animation Variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: "easeOut" } },
};

const globeVariants: Variants = {
  hidden: { scale: 0.85, opacity: 0, y: 10 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: "easeOut" },
  },
  floating: {
    y: [-4, 4],
    transition: {
      duration: 5,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

export interface NotFoundProps {
  title?: string;
  description?: string;
  backText?: string;
  onBack?: () => void;
}

export function CosmicNotFound({
  title = "Afwan, Halaman Tidak Ditemukan",
  description = "Qadarullah, halaman atau materi yang Ananda/Bapak/Ibu tuju belum dapat ditemukan atau alamat tautan kurang tepat. Jangan khawatir, mari kita kembali ke beranda untuk melanjutkan aktivitas belajar dengan bismillah.",
  backText = "Kembali ke Beranda Utama",
  onBack,
}: NotFoundProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center px-4 min-h-screen bg-white text-gray-900 relative z-20 py-12">
      <AnimatePresence mode="wait">
        <motion.div
          className="text-center max-w-xl mx-auto"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={fadeUp}
        >
          {/* Badge Kalimat Thayyibah yang Sopan & Santun */}
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ • Status 404</span>
          </motion.div>

          {/* Visual 404 dengan 3D Globe di tengah */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-8">
            <motion.span
              className="text-7xl md:text-8xl font-black text-gray-800 tracking-tight select-none"
              variants={fadeUp}
            >
              4
            </motion.span>

            <motion.div
              className="relative w-24 h-24 md:w-32 md:h-32"
              variants={globeVariants}
              animate={["visible", "floating"]}
            >
              <Globe />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(5,150,105,0.12)_0%,transparent_70%)]" />
            </motion.div>

            <motion.span
              className="text-7xl md:text-8xl font-black text-gray-800 tracking-tight select-none"
              variants={fadeUp}
            >
              4
            </motion.span>
          </div>

          {/* Judul Bernuansa Islami & Sopan */}
          <motion.h1
            className="mb-3 text-2xl sm:text-4xl font-bold tracking-tight text-gray-900"
            variants={fadeUp}
          >
            {title}
          </motion.h1>

          {/* Penjelasan Lembut & Menenangkan */}
          <motion.p
            className="mx-auto mb-8 max-w-lg text-sm sm:text-base text-gray-600 leading-relaxed"
            variants={fadeUp}
          >
            {description}
          </motion.p>

          {/* Pilihan Tombol Navigasi Sopan */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-3.5"
          >
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-sm"
            >
              <Home className="w-4 h-4 text-white" />
              <span>{backText}</span>
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 hover:text-slate-900 font-semibold px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 shadow-xs transition-all duration-200 cursor-pointer text-sm"
            >
              <ArrowLeftIcon className="w-4 h-4 text-slate-700" />
              <span>Kembali Sebelumnya</span>
            </button>
          </motion.div>

          {/* Kutipan Pengingat Menuntut Ilmu */}
          <motion.div
            variants={fadeUp}
            className="mt-12 pt-6 border-t border-gray-100 text-xs text-gray-500 italic max-w-md mx-auto"
          >
            &ldquo;Barangsiapa menempuh jalan untuk menuntut ilmu, maka Allah mudahkan baginya jalan menuju surga.&rdquo;
            <span className="block not-italic font-semibold text-gray-600 mt-1">
              (HR. Muslim No. 2699)
            </span>
            <span className="block not-italic text-[11px] text-gray-400 mt-2">
              Student Apps • SD - SMP Islam Al-Azhar Cairo Palembang
            </span>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default CosmicNotFound;
