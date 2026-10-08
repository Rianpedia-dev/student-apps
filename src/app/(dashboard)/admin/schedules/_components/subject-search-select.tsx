"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, BookOpen, X } from "lucide-react";
import { cn } from "cn";

export interface SubjectOption {
  id: string;
  nama: string;
  kode: string;
}

interface SubjectSearchSelectProps {
  subjects: SubjectOption[];
  value: string;
  onChange: (subjectId: string) => void;
  required?: boolean;
}

export function SubjectSearchSelect({
  subjects,
  value,
  onChange,
  required = false,
}: SubjectSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedSubject = useMemo(() => {
    return subjects.find((s) => s.id === value) || null;
  }, [subjects, value]);

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const q = searchQuery.toLowerCase().trim();
    return subjects.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.kode.toLowerCase().includes(q)
    );
  }, [subjects, searchQuery]);

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

  const handleSelect = (subjectId: string) => {
    onChange(subjectId);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={cn("relative w-full", isOpen && "z-30")} ref={containerRef}>
      {/* Hidden input to ensure FormData gets mapel_id seamlessly */}
      <input type="hidden" name="mapel_id" value={value} required={required} />

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
          <div className="h-5 w-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen className="h-3 w-3" />
          </div>
          {selectedSubject ? (
            <div className="truncate flex items-center gap-1.5">
              <span className="font-semibold text-foreground truncate">
                {selectedSubject.nama}
              </span>
              <span className="text-[11px] font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                {selectedSubject.kode}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">-- Pilih Mata Pelajaran --</span>
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
              placeholder="Cari nama mata pelajaran atau kode..."
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
            <span>Daftar Mata Pelajaran</span>
            <span>{filteredSubjects.length} mata pelajaran</span>
          </div>

          {/* Scrollable Subjects List */}
          <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map((s) => {
                const isSelected = s.id === value;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelect(s.id)}
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
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        )}
                      >
                        <BookOpen className="h-3 w-3" />
                      </div>
                      <div className="truncate">
                        <span className="block truncate font-medium text-foreground">
                          {s.nama}
                        </span>
                        <span className="block truncate text-[10px] text-muted-foreground font-mono">
                          Kode: {s.kode}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Mata pelajaran tidak ditemukan</p>
                <p className="text-[11px] text-muted-foreground/80">
                  Tidak ada mata pelajaran yang cocok dengan "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
