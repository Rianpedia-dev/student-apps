"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, School, X } from "lucide-react";
import { cn } from "cn";

export interface ClassOption {
  id: string;
  nama: string;
  jenjang: string;
}

interface ClassSearchSelectProps {
  classes: ClassOption[];
  value: string;
  onChange: (classId: string) => void;
  required?: boolean;
}

export function ClassSearchSelect({
  classes,
  value,
  onChange,
  required = false,
}: ClassSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === value) || null;
  }, [classes, value]);

  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classes;
    const q = searchQuery.toLowerCase().trim();
    return classes.filter(
      (c) =>
        c.nama.toLowerCase().includes(q) ||
        c.jenjang.toLowerCase().includes(q)
    );
  }, [classes, searchQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = (classId: string) => {
    onChange(classId);
    setIsOpen(false);
    setSearchQuery("");
  };

  const isFiltering = searchQuery.trim().length > 0;
  const sdClasses = useMemo(() => filteredClasses.filter((c) => c.jenjang === "SD"), [filteredClasses]);
  const smpClasses = useMemo(() => filteredClasses.filter((c) => c.jenjang === "SMP"), [filteredClasses]);
  const otherClasses = useMemo(
    () => filteredClasses.filter((c) => c.jenjang !== "SD" && c.jenjang !== "SMP"),
    [filteredClasses]
  );

  const renderClassItem = (c: ClassOption) => {
    const isSelected = c.id === value;
    const isSD = c.jenjang === "SD";

    return (
      <button
        key={c.id}
        type="button"
        onClick={() => handleSelect(c.id)}
        className={cn(
          "w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer",
          isSelected
            ? "bg-primary/15 text-primary font-semibold dark:bg-primary/25"
            : "hover:bg-muted text-foreground"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
              isSelected
                ? "bg-primary text-primary-foreground"
                : isSD
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
            )}
          >
            {c.jenjang}
          </div>
          <div className="truncate">
            <span className="block truncate font-medium text-foreground">
              {c.nama}
            </span>
            <span className="block truncate text-[10px] text-muted-foreground font-normal">
              Jenjang {c.jenjang}
            </span>
          </div>
        </div>
        {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
      </button>
    );
  };

  return (
    <div className={cn("relative w-full", isOpen && "z-30")} ref={containerRef}>
      {/* Hidden input to ensure FormData gets kelas_id seamlessly */}
      <input type="hidden" name="kelas_id" value={value} required={required} />

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full text-xs rounded-xl border border-input bg-background p-2.5 flex items-center justify-between gap-2 text-left transition-all",
          "focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50",
          isOpen && "ring-1 ring-primary border-primary"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <School className="h-3 w-3" />
          </div>
          {selectedClass ? (
            <div className="truncate flex items-center gap-1.5">
              <span className="font-semibold text-foreground truncate">
                {selectedClass.nama}
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                  selectedClass.jenjang === "SD"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                )}
              >
                {selectedClass.jenjang}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">-- Pilih Rombongan Belajar --</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>

      {/* Dropdown Floating Menu with Search */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl p-2 space-y-1.5 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama kelas atau jenjang (SD/SMP)..."
              className="w-full pl-8 pr-7 py-2 text-xs rounded-lg border border-input bg-muted/40 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded-sm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Results Info Counter */}
          <div className="flex items-center justify-between px-1 text-[10px] text-muted-foreground font-medium">
            <span>Daftar Rombongan Belajar</span>
            <span>{filteredClasses.length} kelas</span>
          </div>

          {/* Scrollable Classes List */}
          <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
            {filteredClasses.length > 0 ? (
              isFiltering ? (
                // Filtered flat list
                filteredClasses.map((c) => renderClassItem(c))
              ) : (
                // Grouped by jenjang (SD / SMP)
                <>
                  {sdClasses.length > 0 && (
                    <div>
                      <div className="px-2 pt-1 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        <span>Sekolah Dasar (SD)</span>
                      </div>
                      <div className="space-y-1">
                        {sdClasses.map((c) => renderClassItem(c))}
                      </div>
                    </div>
                  )}

                  {smpClasses.length > 0 && (
                    <div className={sdClasses.length > 0 ? "pt-1.5" : ""}>
                      <div className="px-2 pt-1 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-t border-border/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                        <span>Sekolah Menengah Pertama (SMP)</span>
                      </div>
                      <div className="space-y-1">
                        {smpClasses.map((c) => renderClassItem(c))}
                      </div>
                    </div>
                  )}

                  {otherClasses.length > 0 && (
                    <div className="pt-1.5">
                      <div className="px-2 pt-1 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-t border-border/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                        <span>Kelas Lainnya</span>
                      </div>
                      <div className="space-y-1">
                        {otherClasses.map((c) => renderClassItem(c))}
                      </div>
                    </div>
                  )}
                </>
              )
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Kelas tidak ditemukan</p>
                <p className="text-[11px] text-muted-foreground/80">
                  Tidak ada kelas yang cocok dengan "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
