"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Pen,
  Highlighter,
  Type,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  X,
  Star,
  Download,
  Save,
  Send,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Hand,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  tool: "pen" | "highlighter" | "eraser";
  color: string;
  size: number;
  points: StrokePoint[];
  page: number;
}

export interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  page: number;
}

export interface StampAnnotation {
  id: string;
  type: "check" | "cross" | "star";
  x: number;
  y: number;
  page: number;
}

export interface DocumentAnnotationData {
  version: number;
  strokes: Stroke[];
  texts: TextAnnotation[];
  stamps: StampAnnotation[];
}

export interface DocumentCanvasEditorProps {
  fileUrl: string;
  fileName?: string;
  mode?: "student" | "teacher";
  initialAnnotationData?: string | null;
  onSaveDraft?: (data: { annotationData: string; previewDataUrl?: string }) => Promise<void>;
  onAnnotationChange?: (annotationData: string) => void;
  onSubmit?: (data: { annotationData: string; renderedImageDataUrl: string }) => Promise<void>;
  isSubmitting?: boolean;
  submitButtonText?: string;
  readOnly?: boolean;
  floatingOverlay?: React.ReactNode;
}

const PEN_COLORS = [
  { label: "Hitam", value: "#1e293b" },
  { label: "Biru", value: "#2563eb" },
  { label: "Merah", value: "#dc2626" },
  { label: "Hijau", value: "#16a34a" },
  { label: "Ungu", value: "#9333ea" },
  { label: "Oranye", value: "#ea580c" },
];

const HIGHLIGHTER_COLORS = [
  { label: "Kuning", value: "#facc15" },
  { label: "Hijau Neon", value: "#4ade80" },
  { label: "Biru Muda", value: "#38bdf8" },
  { label: "Merah Muda", value: "#f472b6" },
];

export function DocumentCanvasEditor({
  fileUrl,
  fileName = "Lembar Soal",
  mode = "student",
  initialAnnotationData,
  onSaveDraft,
  onAnnotationChange,
  onSubmit,
  isSubmitting = false,
  submitButtonText,
  readOnly = false,
  floatingOverlay,
}: DocumentCanvasEditorProps) {
  // Fullscreen / Zen Mode State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  // Side Toolbar Collapse State (starts collapsed on mobile and tablet for maximum document space)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        if (editorWrapperRef.current?.requestFullscreen && !document.fullscreenElement) {
          await editorWrapperRef.current.requestFullscreen().catch(() => {});
        }
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        e.preventDefault();
        handleToggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    const handleNativeFsChange = () => {
      const isNativeFs = Boolean(document.fullscreenElement);
      if (!isNativeFs && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleNativeFsChange);
    document.addEventListener("webkitfullscreenchange", handleNativeFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleNativeFsChange);
      document.removeEventListener("webkitfullscreenchange", handleNativeFsChange);
    };
  }, [isFullscreen]);

  // Tool state
  const [activeTool, setActiveTool] = useState<
    "pen" | "highlighter" | "text" | "eraser" | "stamp_check" | "stamp_cross" | "stamp_star" | "pan"
  >(mode === "teacher" ? "pen" : "pen");

  const [penColor, setPenColor] = useState(mode === "teacher" ? "#dc2626" : "#2563eb");
  const [highlighterColor, setHighlighterColor] = useState("#facc15");
  const [brushSize, setBrushSize] = useState<number>(mode === "teacher" ? 3 : 3);
  const [fontSize, setFontSize] = useState<number>(16);

  // Document Pages State (PDF vs Image)
  const isPdf = fileUrl.toLowerCase().includes(".pdf");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Zoom and Pan
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Annotations
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [texts, setTexts] = useState<TextAnnotation[]>([]);
  const [stamps, setStamps] = useState<StampAnnotation[]>([]);
  const [history, setHistory] = useState<DocumentAnnotationData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Active In-Place Text Editing state (NO ghost placeholder on canvas!)
  const [editingText, setEditingText] = useState<{
    id: string;
    x: number;
    y: number;
    page: number;
    color: string;
    fontSize: number;
    text: string;
    isNew: boolean;
  } | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const currentStrokeRef = useRef<StrokePoint[]>([]);

  // Canvas Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const activeRenderTaskRef = useRef<any>(null);
  const [docReady, setDocReady] = useState<number>(0);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 1130, // Default A4 aspect
  });

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Parse initial annotations
  useEffect(() => {
    if (initialAnnotationData) {
      try {
        const parsed = JSON.parse(initialAnnotationData) as DocumentAnnotationData;
        if (parsed.strokes) setStrokes(parsed.strokes);
        if (parsed.texts) setTexts(parsed.texts);
        if (parsed.stamps) setStamps(parsed.stamps);
        setHistory([parsed]);
        setHistoryIndex(0);
      } catch (e) {
        console.error("Gagal parse initial annotation data:", e);
      }
    }
  }, [initialAnnotationData]);

  // Immediately notify parent when annotations change
  useEffect(() => {
    if (onAnnotationChange) {
      const dataJson = JSON.stringify({
        version: 1,
        strokes,
        texts,
        stamps,
      });
      onAnnotationChange(dataJson);
    }
  }, [strokes, texts, stamps, onAnnotationChange]);

  // Push to undo/redo history
  const recordHistory = useCallback(
    (newStrokes: Stroke[], newTexts: TextAnnotation[], newStamps: StampAnnotation[]) => {
      const state: DocumentAnnotationData = {
        version: 1,
        strokes: newStrokes,
        texts: newTexts,
        stamps: newStamps,
      };
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, state];
      });
      setHistoryIndex((prev) => prev + 1);
      setSaveStatus("unsaved");
    },
    [historyIndex]
  );

  // 2. Load PDF.js or Image Background Document
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingDoc(true);
    setLoadError(null);

    async function loadBackground() {
      try {
        if (isPdf) {
          // Check if window.pdfjsLib is loaded
          if (!(window as any).pdfjsLib) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement("script");
              script.src = "/vendor/pdfjs/pdf.min.js";
              script.onload = () => {
                const pdfjs = (window as any).pdfjsLib;
                if (pdfjs) {
                  pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.js";
                  resolve();
                } else {
                  reject(new Error("pdfjsLib tidak ditemukan"));
                }
              };
              script.onerror = () => reject(new Error("Gagal memuat library PDF"));
              document.head.appendChild(script);
            });
          }

          const pdfjs = (window as any).pdfjsLib;
          const loadingTask = pdfjs.getDocument(fileUrl);
          const pdfDoc = await loadingTask.promise;
          if (isCancelled) return;

          pdfDocRef.current = pdfDoc;
          setTotalPages(pdfDoc.numPages);

          // Get dimensions from page
          const page = await pdfDoc.getPage(currentPage || 1);
          const viewport = page.getViewport({ scale: 1.5 });
          const width = Math.round(viewport.width);
          const height = Math.round(viewport.height);

          setCanvasDimensions({ width, height });
          setDocReady((prev) => prev + 1);
        } else {
          // Load Image
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = fileUrl;
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Gagal memuat gambar lembar soal"));
          });

          if (isCancelled) return;
          imageElementRef.current = img;
          setTotalPages(1);

          // Standardize width for comfortable drawing (e.g. 900px)
          const targetWidth = Math.min(1200, Math.max(750, img.naturalWidth || 800));
          const aspect = img.naturalHeight / img.naturalWidth;
          const targetHeight = Math.round(targetWidth * aspect);

          setCanvasDimensions({ width: targetWidth, height: targetHeight });
          setDocReady((prev) => prev + 1);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Error loading document:", err);
          setLoadError(err.message || "Gagal memuat berkas lembar kerja.");
          setIsLoadingDoc(false);
        }
      }
    }

    loadBackground();

    return () => {
      isCancelled = true;
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [fileUrl, isPdf]);

  // Render Background (PDF page or Image) onto bgCanvas cleanly without React wiping
  const renderBackground = useCallback(async () => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;

    if (isPdf && pdfDocRef.current) {
      try {
        if (activeRenderTaskRef.current) {
          try {
            activeRenderTaskRef.current.cancel();
          } catch {}
          activeRenderTaskRef.current = null;
        }

        const page = await pdfDocRef.current.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.5 }); // High resolution for sharp crisp text
        const width = Math.round(viewport.width);
        const height = Math.round(viewport.height);

        // Ensure canvas element dimensions match
        if (bgCanvas.width !== width || bgCanvas.height !== height) {
          bgCanvas.width = width;
          bgCanvas.height = height;
        }

        const ctx = bgCanvas.getContext("2d");
        if (!ctx) return;

        // Solid clean white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
        });
        activeRenderTaskRef.current = renderTask;
        await renderTask.promise;
        setIsLoadingDoc(false);
      } catch (e: any) {
        if (e?.name !== "RenderingCancelledException") {
          console.error("Render PDF page error:", e);
        }
      } finally {
        activeRenderTaskRef.current = null;
      }
    } else if (!isPdf && imageElementRef.current) {
      const img = imageElementRef.current;
      const ctx = bgCanvas.getContext("2d");
      if (!ctx) return;

      // Solid clean white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      ctx.drawImage(img, 0, 0, bgCanvas.width, bgCanvas.height);
      setIsLoadingDoc(false);
    }
  }, [isPdf, currentPage]);

  // Redraw background whenever document is ready, page changes, or canvas dimensions settle
  useEffect(() => {
    if (docReady > 0) {
      renderBackground();
    }
  }, [docReady, currentPage, canvasDimensions, renderBackground]);

  // Change page for PDF
  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setIsLoadingDoc(true);
    if (pdfDocRef.current) {
      try {
        const page = await pdfDocRef.current.getPage(newPage);
        const viewport = page.getViewport({ scale: 1.5 });
        const width = Math.round(viewport.width);
        const height = Math.round(viewport.height);
        setCanvasDimensions({ width, height });
      } catch (e) {
        console.error("Page change dimension error:", e);
      }
    }
    setCurrentPage(newPage);
  };

  // Always reset scroll to top on document load or page change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [fileUrl, currentPage]);

  // 3. Render Annotations Layer onto Drawing Canvas
  const redrawAnnotations = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter by current page
    const pageStrokes = strokes.filter((s) => s.page === currentPage);
    const pageTexts = texts.filter((t) => t.page === currentPage);
    const pageStamps = stamps.filter((s) => s.page === currentPage);

    // 1. Draw strokes
    for (const stroke of pageStrokes) {
      if (stroke.points.length < 1) continue;

      ctx.save();
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.tool === "highlighter") {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * 3;
        ctx.globalAlpha = 0.38;
      } else if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = stroke.size * 4;
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.globalAlpha = 1.0;
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw Text Annotations
    for (const textItem of pageTexts) {
      if (editingText && editingText.id === textItem.id) continue;

      ctx.save();
      ctx.font = `600 ${textItem.fontSize}px 'Outfit', 'Inter', sans-serif`;
      ctx.fillStyle = textItem.color;
      ctx.textBaseline = "top";

      // Draw light background pill for clarity if needed
      const lines = textItem.text.split("\n");
      let lineY = textItem.y;
      for (const line of lines) {
        ctx.fillText(line, textItem.x, lineY);
        lineY += textItem.fontSize * 1.25;
      }
      ctx.restore();
    }

    // 3. Draw Stamps (✓, ✗, ⭐)
    for (const stamp of pageStamps) {
      ctx.save();
      ctx.translate(stamp.x, stamp.y);
      if (stamp.type === "check") {
        ctx.fillStyle = "#16a34a";
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(-2, 5);
        ctx.lineTo(8, -5);
        ctx.stroke();
      } else if (stamp.type === "cross") {
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-6, -6);
        ctx.lineTo(6, 6);
        ctx.moveTo(6, -6);
        ctx.lineTo(-6, 6);
        ctx.stroke();
      } else if (stamp.type === "star") {
        ctx.fillStyle = "#eab308";
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("★", 0, 1);
      }
      ctx.restore();
    }
  }, [strokes, texts, stamps, currentPage, editingText]);

  // Sync canvas dimensions
  useEffect(() => {
    const drawCanvas = drawCanvasRef.current;
    if (drawCanvas) {
      drawCanvas.width = canvasDimensions.width;
      drawCanvas.height = canvasDimensions.height;
      redrawAnnotations();
    }
  }, [canvasDimensions, redrawAnnotations]);

  // Redraw when strokes/texts/stamps change
  useEffect(() => {
    redrawAnnotations();
  }, [redrawAnnotations]);

  // Text confirmation / cancellation handlers
  const handleConfirmText = () => {
    if (!editingText) return;
    const val = editingText.text.trim();
    if (val) {
      let updated: TextAnnotation[];
      if (editingText.isNew) {
        const newAnnot: TextAnnotation = {
          id: editingText.id,
          text: val,
          x: editingText.x,
          y: editingText.y,
          color: editingText.color,
          fontSize: editingText.fontSize,
          page: editingText.page,
        };
        updated = [...texts, newAnnot];
      } else {
        updated = texts.map((t) =>
          t.id === editingText.id ? { ...t, text: val } : t
        );
      }
      setTexts(updated);
      recordHistory(strokes, updated, stamps);
    } else if (!editingText.isNew) {
      const updated = texts.filter((t) => t.id !== editingText.id);
      setTexts(updated);
      recordHistory(strokes, updated, stamps);
    }
    setEditingText(null);
  };

  const handleCancelText = () => {
    setEditingText(null);
  };

  // 4. Pointer Interaction (Drawing, Text, Stamps)
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): StrokePoint => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;

    if (activeTool === "pan") {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    const coords = getCanvasCoords(e);

    // Eraser: point-and-click removal of stamps and texts
    if (activeTool === "eraser") {
      const stampIdx = stamps.findIndex(
        (s) => s.page === currentPage && Math.hypot(s.x - coords.x, s.y - coords.y) < 24
      );
      if (stampIdx !== -1) {
        const updatedStamps = stamps.filter((_, idx) => idx !== stampIdx);
        setStamps(updatedStamps);
        recordHistory(strokes, texts, updatedStamps);
        return;
      }

      const textIdx = texts.findIndex(
        (t) => t.page === currentPage && Math.abs(t.x - coords.x) < 50 && Math.abs(t.y - coords.y) < 20
      );
      if (textIdx !== -1) {
        const updatedTexts = texts.filter((_, idx) => idx !== textIdx);
        setTexts(updatedTexts);
        recordHistory(strokes, updatedTexts, stamps);
        return;
      }
    }

    // Stamp placement
    if (activeTool.startsWith("stamp_")) {
      const stampType = activeTool.replace("stamp_", "") as "check" | "cross" | "star";
      const newStamp: StampAnnotation = {
        id: `stamp-${Date.now()}`,
        type: stampType,
        x: coords.x,
        y: coords.y,
        page: currentPage,
      };
      const updated = [...stamps, newStamp];
      setStamps(updated);
      recordHistory(strokes, texts, updated);
      return;
    }

    // Text box placement or editing
    if (activeTool === "text") {
      const existingText = texts.find(
        (t) => t.page === currentPage && Math.abs(t.x - coords.x) < 60 && Math.abs(t.y - coords.y) < 25
      );
      if (existingText) {
        setEditingText({
          id: existingText.id,
          x: existingText.x,
          y: existingText.y,
          page: existingText.page,
          color: existingText.color,
          fontSize: existingText.fontSize,
          text: existingText.text,
          isNew: false,
        });
      } else {
        setEditingText({
          id: `txt-${Date.now()}`,
          x: coords.x,
          y: coords.y,
          page: currentPage,
          color: penColor,
          fontSize: fontSize,
          text: "",
          isNew: true,
        });
      }
      return;
    }

    // Pen, Highlighter, Eraser
    setIsDrawing(true);
    currentStrokeRef.current = [coords];

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning && activeTool === "pan") {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (!isDrawing || readOnly) return;

    const coords = getCanvasCoords(e);
    currentStrokeRef.current.push(coords);

    // Live draw current stroke on top of canvas for high-performance feel
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pts = currentStrokeRef.current;
    if (pts.length < 2) return;

    ctx.save();
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (activeTool === "highlighter") {
      ctx.strokeStyle = highlighterColor;
      ctx.lineWidth = brushSize * 3;
      ctx.globalAlpha = 0.38;
    } else if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = brushSize * 4;
    } else {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = brushSize;
      ctx.globalAlpha = 1.0;
    }

    const p1 = pts[pts.length - 2];
    const p2 = pts[pts.length - 1];
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing || readOnly) return;
    setIsDrawing(false);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const pts = currentStrokeRef.current;
    if (pts.length > 0) {
      const newStroke: Stroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tool: activeTool === "highlighter" ? "highlighter" : activeTool === "eraser" ? "eraser" : "pen",
        color: activeTool === "highlighter" ? highlighterColor : penColor,
        size: brushSize,
        points: pts,
        page: currentPage,
      };

      const updated = [...strokes, newStroke];
      setStrokes(updated);
      recordHistory(updated, texts, stamps);
    }

    currentStrokeRef.current = [];
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      const state = history[nextIndex];
      setStrokes(state.strokes);
      setTexts(state.texts);
      setStamps(state.stamps);
      setHistoryIndex(nextIndex);
      setSaveStatus("unsaved");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const state = history[nextIndex];
      setStrokes(state.strokes);
      setTexts(state.texts);
      setStamps(state.stamps);
      setHistoryIndex(nextIndex);
      setSaveStatus("unsaved");
    }
  };

  // Autosave Draft
  useEffect(() => {
    if (saveStatus !== "unsaved" || readOnly || !onSaveDraft) return;

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      const dataJson = JSON.stringify({
        version: 1,
        strokes,
        texts,
        stamps,
      });

      try {
        await onSaveDraft({ annotationData: dataJson });
        setSaveStatus("saved");
      } catch (e) {
        console.error("Autosave draft failed:", e);
        setSaveStatus("unsaved");
      }
    }, 2500); // Autosave after 2.5s of idle

    return () => {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, [strokes, texts, stamps, saveStatus, onSaveDraft, readOnly]);

  // Export Flattened Canvas (Background + Annotations merged)
  const getFlattenedCanvasDataUrl = (): string => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!bgCanvas || !drawCanvas) return "";

    const mergeCanvas = document.createElement("canvas");
    mergeCanvas.width = canvasDimensions.width;
    mergeCanvas.height = canvasDimensions.height;
    const ctx = mergeCanvas.getContext("2d");
    if (!ctx) return "";

    // Fill solid white background first so transparent PDF/canvas margins never produce black or transparent artifacts
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height);

    // Draw background (soal PDF/Image)
    ctx.drawImage(bgCanvas, 0, 0);
    // Draw annotations layer
    ctx.drawImage(drawCanvas, 0, 0);

    return mergeCanvas.toDataURL("image/webp", 0.9);
  };

  const handleManualSubmit = async () => {
    if (!onSubmit) return;
    const finalDataUrl = getFlattenedCanvasDataUrl();
    const dataJson = JSON.stringify({
      version: 1,
      strokes,
      texts,
      stamps,
    });
    await onSubmit({ annotationData: dataJson, renderedImageDataUrl: finalDataUrl });
  };

  return (
    <div
      ref={editorWrapperRef}
      className={cn(
        "flex flex-row w-full h-full bg-card transition-all duration-200 overflow-hidden relative",
        isFullscreen
          ? "fixed inset-0 z-[100] w-screen h-screen rounded-none border-0 shadow-none"
          : "rounded-2xl border border-border shadow-md"
      )}
    >
      {/* Side Toolbar (Placed beside the file, leaves top 100% uncovered) */}
      <aside
        className={cn(
          "relative flex flex-col shrink-0 border-r border-border bg-card/98 backdrop-blur-md z-30 transition-all duration-300 ease-in-out select-none h-full overflow-y-auto overflow-x-hidden scrollbar-none",
          isSidebarCollapsed
            ? "w-12 sm:w-14 items-center px-1.5 py-2.5"
            : "w-52 sm:w-56 px-2.5 sm:px-3 py-2.5"
        )}
      >
        {/* Header / Collapse Toggle */}
        <div className={cn("flex items-center w-full pb-2 border-b border-border/80", isSidebarCollapsed ? "justify-center" : "justify-end")}>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
            title={isSidebarCollapsed ? "Perluas Toolbar" : "Ciutkan Toolbar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Fullscreen Toggle Button */}
        <div className="w-full pt-2">
          <Button
            type="button"
            variant={isFullscreen ? "default" : "outline"}
            size={isSidebarCollapsed ? "icon-xs" : "sm"}
            onClick={handleToggleFullscreen}
            className={cn(
              "rounded-xl font-semibold transition-all",
              isSidebarCollapsed
                ? "h-8 w-8 mx-auto"
                : "w-full h-8 px-2 gap-2 text-xs justify-start",
              isFullscreen && "bg-primary text-primary-foreground font-bold shadow-xs"
            )}
            title={isFullscreen ? "Keluar Layar Penuh (Esc)" : "Mode Layar Penuh"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Keluar Penuh</span>}
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Layar Penuh</span>}
              </>
            )}
          </Button>
        </div>

        {/* Tool Selection */}
        <div className="w-full pt-2.5 space-y-1">
          {!isSidebarCollapsed && (
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
              Alat Gambar
            </span>
          )}
          <div className={cn(isSidebarCollapsed ? "flex flex-col items-center gap-1.5" : "grid grid-cols-2 gap-1.5")}>
            {/* Pena */}
            <Button
              type="button"
              variant={activeTool === "pen" ? "default" : "outline"}
              size={isSidebarCollapsed ? "icon-xs" : "sm"}
              onClick={() => setActiveTool("pen")}
              className={cn(
                "rounded-xl font-semibold",
                isSidebarCollapsed ? "h-8 w-8" : "h-8 px-2 gap-1.5 text-xs justify-start"
              )}
              title="Pena Coret"
            >
              <Pen className="h-3.5 w-3.5 shrink-0" />
              {!isSidebarCollapsed && <span>Pena</span>}
            </Button>

            {/* Stabilo */}
            <Button
              type="button"
              variant={activeTool === "highlighter" ? "default" : "outline"}
              size={isSidebarCollapsed ? "icon-xs" : "sm"}
              onClick={() => setActiveTool("highlighter")}
              className={cn(
                "rounded-xl font-semibold",
                isSidebarCollapsed ? "h-8 w-8" : "h-8 px-2 gap-1.5 text-xs justify-start"
              )}
              title="Stabilo / Sorot"
            >
              <Highlighter className="h-3.5 w-3.5 shrink-0" />
              {!isSidebarCollapsed && <span>Stabilo</span>}
            </Button>

            {/* Teks */}
            <Button
              type="button"
              variant={activeTool === "text" ? "default" : "outline"}
              size={isSidebarCollapsed ? "icon-xs" : "sm"}
              onClick={() => setActiveTool("text")}
              className={cn(
                "rounded-xl font-semibold",
                isSidebarCollapsed ? "h-8 w-8" : "h-8 px-2 gap-1.5 text-xs justify-start"
              )}
              title="Ketik Teks Jawaban"
            >
              <Type className="h-3.5 w-3.5 shrink-0" />
              {!isSidebarCollapsed && <span>Teks</span>}
            </Button>

            {/* Hapus */}
            <Button
              type="button"
              variant={activeTool === "eraser" ? "default" : "outline"}
              size={isSidebarCollapsed ? "icon-xs" : "sm"}
              onClick={() => setActiveTool("eraser")}
              className={cn(
                "rounded-xl font-semibold",
                isSidebarCollapsed ? "h-8 w-8" : "h-8 px-2 gap-1.5 text-xs justify-start"
              )}
              title="Penghapus"
            >
              <Eraser className="h-3.5 w-3.5 shrink-0" />
              {!isSidebarCollapsed && <span>Hapus</span>}
            </Button>

            {/* Pan / Geser */}
            <Button
              type="button"
              variant={activeTool === "pan" ? "default" : "outline"}
              size={isSidebarCollapsed ? "icon-xs" : "sm"}
              onClick={() => setActiveTool("pan")}
              className={cn(
                "rounded-xl font-semibold",
                isSidebarCollapsed ? "h-8 w-8" : "col-span-2 h-8 px-2 gap-1.5 text-xs justify-start"
              )}
              title="Geser Lembar (Pan)"
            >
              <Hand className="h-3.5 w-3.5 shrink-0" />
              {!isSidebarCollapsed && <span>Geser Lembar</span>}
            </Button>
          </div>
        </div>

        {/* Teacher Correction Stamps (if mode === 'teacher') */}
        {mode === "teacher" && (
          <div className="w-full pt-2 space-y-1">
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                Stempel
              </span>
            )}
            <div className={cn("p-1 bg-muted/50 rounded-xl border border-border", isSidebarCollapsed ? "flex flex-col gap-1 items-center" : "grid grid-cols-3 gap-1")}>
              <Button
                type="button"
                variant={activeTool === "stamp_check" ? "default" : "ghost"}
                size="icon-xs"
                onClick={() => setActiveTool("stamp_check")}
                className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg"
                title="Centang (✓)"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant={activeTool === "stamp_cross" ? "default" : "ghost"}
                size="icon-xs"
                onClick={() => setActiveTool("stamp_cross")}
                className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                title="Silang (✗)"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant={activeTool === "stamp_star" ? "default" : "ghost"}
                size="icon-xs"
                onClick={() => setActiveTool("stamp_star")}
                className="h-7 w-7 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"
                title="Bintang (⭐)"
              >
                <Star className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Colors Selection for Pen / Highlighter */}
        {(activeTool === "pen" || activeTool === "highlighter") && (
          <div className="w-full pt-2.5 space-y-1.5 border-t border-border/70 mt-2">
            {!isSidebarCollapsed && (
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {activeTool === "pen" ? "Warna Tinta" : "Warna Stabilo"}
                </span>
                <span
                  className="h-3 w-3 rounded-full border border-border"
                  style={{ backgroundColor: activeTool === "pen" ? penColor : highlighterColor }}
                />
              </div>
            )}
            <div className={cn("p-1 bg-muted/40 rounded-xl border border-border", isSidebarCollapsed ? "grid grid-cols-2 gap-1" : "grid grid-cols-6 gap-1")}>
              {(activeTool === "pen" ? PEN_COLORS : HIGHLIGHTER_COLORS).map((c) => {
                const isSelected = (activeTool === "pen" ? penColor : highlighterColor) === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      if (activeTool === "pen") setPenColor(c.value);
                      else setHighlighterColor(c.value);
                    }}
                    className={cn(
                      "rounded-full border mx-auto transition-transform",
                      isSidebarCollapsed ? "h-4 w-4" : "h-5 w-5",
                      isSelected ? "scale-125 border-foreground ring-2 ring-primary" : "border-transparent hover:scale-110"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Thickness selector */}
        {(activeTool === "pen" || activeTool === "highlighter" || activeTool === "eraser") && (
          <div className="w-full pt-2 space-y-1">
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                Ukuran: {brushSize}px
              </span>
            )}
            <div className={cn("p-1 bg-muted/40 rounded-xl border border-border text-xs font-bold text-center", isSidebarCollapsed ? "flex flex-col gap-1 items-center" : "grid grid-cols-3 gap-1")}>
              {[2, 4, 8].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setBrushSize(size)}
                  className={cn(
                    "rounded-lg transition-colors",
                    isSidebarCollapsed ? "h-6 w-6 text-[10px] flex items-center justify-center" : "py-0.5",
                    brushSize === size ? "bg-primary text-primary-foreground font-bold shadow-xs" : "hover:bg-muted text-muted-foreground"
                  )}
                  title={`Ukuran ${size}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Undo / Redo */}
        <div className="w-full pt-2.5 space-y-1 border-t border-border/70 mt-2">
          {!isSidebarCollapsed && (
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
              Riwayat
            </span>
          )}
          <div className={cn(isSidebarCollapsed ? "flex flex-col items-center gap-1" : "grid grid-cols-2 gap-1.5")}>
            <Button
              type="button"
              variant="outline"
              size={isSidebarCollapsed ? "icon-xs" : "sm"}
              disabled={historyIndex <= 0}
              onClick={handleUndo}
              className={cn("rounded-xl", isSidebarCollapsed ? "h-8 w-8" : "h-8 px-2 gap-1 text-xs")}
              title="Batal Coret (Undo)"
            >
              <Undo2 className="h-3.5 w-3.5" />
              {!isSidebarCollapsed && <span>Batal</span>}
            </Button>
            <Button
              type="button"
              variant="outline"
              size={isSidebarCollapsed ? "icon-xs" : "sm"}
              disabled={historyIndex >= history.length - 1}
              onClick={handleRedo}
              className={cn("rounded-xl", isSidebarCollapsed ? "h-8 w-8" : "h-8 px-2 gap-1 text-xs")}
              title="Ulangi Coret (Redo)"
            >
              <Redo2 className="h-3.5 w-3.5" />
              {!isSidebarCollapsed && <span>Ulang</span>}
            </Button>
          </div>
        </div>

        {/* Multi-page controls */}
        {totalPages > 1 && (
          <div className="w-full pt-2 space-y-1">
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                Halaman
              </span>
            )}
            <div className={cn("p-1 bg-muted/60 rounded-xl border border-border text-xs", isSidebarCollapsed ? "flex flex-col items-center gap-1" : "flex items-center justify-between")}>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="h-6 w-6 rounded-lg"
                title="Sebelumnya"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="font-bold text-foreground text-[11px] px-1">
                {currentPage}/{totalPages}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="h-6 w-6 rounded-lg"
                title="Berikutnya"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Zoom controls */}
        <div className="w-full pt-2 space-y-1">
          {!isSidebarCollapsed && (
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
              Zoom
            </span>
          )}
          <div className={cn("p-1 bg-muted/40 rounded-xl border border-border text-xs", isSidebarCollapsed ? "flex flex-col items-center gap-1" : "flex items-center justify-between")}>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.2) * 10) / 10))}
              className="h-6 w-6"
              title="Perkecil (-)"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="font-mono font-bold text-foreground text-[10px]">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.2) * 10) / 10))}
              className="h-6 w-6"
              title="Perbesar (+)"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                setZoom(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Reset Zoom & Posisi"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Bottom Actions: Autosave & Submit */}
        <div className="w-full mt-auto pt-3 border-t border-border/70 space-y-2 shrink-0">
          {!readOnly && onSaveDraft && (
            <div className={cn("flex items-center gap-1 text-[10px] text-muted-foreground", isSidebarCollapsed ? "justify-center" : "justify-center py-0.5")}>
              <span
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  saveStatus === "saved"
                    ? "bg-emerald-500 animate-pulse"
                    : saveStatus === "saving"
                    ? "bg-amber-500 animate-spin"
                    : "bg-muted-foreground"
                )}
              />
              {!isSidebarCollapsed && (
                <span className="truncate">
                  {saveStatus === "saved" ? "Tersimpan Otomatis" : saveStatus === "saving" ? "Menyimpan..." : "Belum Tersimpan"}
                </span>
              )}
            </div>
          )}

          {onSubmit && !readOnly && (
            <Button
              type="button"
              variant="default"
              size={isSidebarCollapsed ? "icon-xs" : "sm"}
              disabled={isSubmitting}
              onClick={handleManualSubmit}
              className={cn(
                "rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all",
                isSidebarCollapsed ? "h-9 w-9 p-0 mx-auto flex items-center justify-center" : "w-full h-9 px-2 gap-1.5 text-xs"
              )}
              title={submitButtonText || (mode === "teacher" ? "Simpan Nilai & Koreksi" : "Kumpulkan Tugas 🚀")}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <Send className="h-3.5 w-3.5 shrink-0" />
              )}
              {!isSidebarCollapsed && (
                <span className="truncate">
                  {submitButtonText || (mode === "teacher" ? "Simpan Nilai" : "Kumpulkan 🚀")}
                </span>
              )}
            </Button>
          )}
        </div>
      </aside>

      {/* Canvas Workspace Area (Starts right at the top, zero top obstruction) */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full h-full overflow-auto bg-muted/40 flex items-start justify-center p-4 sm:p-8 select-none"
        style={{
          cursor: activeTool === "pan" ? (isPanning ? "grabbing" : "grab") : activeTool === "text" ? "text" : "crosshair",
        }}
      >
        {/* Loading Spinner */}
        {isLoadingDoc && (
          <div className="absolute inset-0 z-30 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-semibold text-muted-foreground">Memuat lembar kerja dokumen...</p>
          </div>
        )}

        {/* Load Error */}
        {loadError && (
          <div className="absolute inset-0 z-30 bg-background/90 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <h4 className="text-sm font-bold text-foreground">Gagal Menampilkan Berkas Lembar Soal</h4>
            <p className="text-xs text-muted-foreground max-w-md">{loadError}</p>
            <a
              href={`/api/download?file=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(fileName)}`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Berkas Langsung</span>
            </a>
          </div>
        )}

        {/* Canvas Render Frame with Zoom and Pan Transform (Clean top margin, 100% visible) */}
        <div
          className="relative rounded-lg shadow-xl border border-border bg-white overflow-hidden transition-transform duration-75 origin-top-center shrink-0 my-2 sm:my-4"
          style={{
            width: canvasDimensions.width,
            height: canvasDimensions.height,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          }}
        >
          {/* Layer 1: Background Canvas (Rendered Soal PDF / Image) */}
          <canvas
            ref={bgCanvasRef}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            className="absolute inset-0 z-0 pointer-events-none"
          />

          {/* Layer 2: Interactive Drawing & Annotation Canvas */}
          <canvas
            ref={drawCanvasRef}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute inset-0 z-10 touch-none"
          />

          {/* Layer 3: In-Place Floating Text Editor */}
          {editingText && editingText.page === currentPage && (
            <div
              className="absolute z-30 flex items-center gap-1.5 p-1.5 bg-card/95 backdrop-blur-md rounded-xl shadow-2xl border-2 border-primary animate-in fade-in zoom-in-95 pointer-events-auto"
              style={{
                left: Math.max(8, Math.min(canvasDimensions.width - 290, editingText.x)),
                top: Math.max(8, Math.min(canvasDimensions.height - 52, editingText.y - 12)),
              }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                autoFocus
                value={editingText.text}
                onChange={(e) =>
                  setEditingText((prev) => (prev ? { ...prev, text: e.target.value } : null))
                }
                placeholder="Ketik teks jawaban kamu..."
                className="px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary min-w-[180px] sm:min-w-[220px]"
                style={{ color: editingText.color }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmText();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    handleCancelText();
                  }
                }}
              />
              <Button
                type="button"
                variant="default"
                size="icon-xs"
                onClick={handleConfirmText}
                className="h-7 w-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                title="Simpan Teks (Enter)"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={handleCancelText}
                className="h-7 w-7 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                title="Batal (Esc)"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Overlay Slot (e.g. Teacher grading drawer during fullscreen) */}
      {floatingOverlay}
    </div>
  );
}
