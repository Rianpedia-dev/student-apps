"use client";

import { useState, useMemo } from "react";
import { Search, Check, X, GraduationCap, CheckSquare2, Square } from "lucide-react";
import { cn } from "cn";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { UserItem } from "@/types";

interface StudentSearchSelectProps {
  students: UserItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function StudentSearchSelect({
  students,
  selectedIds,
  onChange,
  disabled = false,
}: StudentSearchSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const matchName = s.name.toLowerCase().includes(q);
      const matchNis = (s.nis || "").toLowerCase().includes(q);
      return matchName || matchNis;
    });
  }, [students, searchQuery]);

  const toggleStudent = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    if (disabled) return;
    const filteredIds = filteredStudents.map((s) => s.id);
    const allSelected = filteredIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      // Uncheck all in current filter
      onChange(selectedIds.filter((id) => !filteredIds.includes(id)));
    } else {
      // Add all in current filter
      const newIds = Array.from(new Set([...selectedIds, ...filteredIds]));
      onChange(newIds);
    }
  };

  const isAllFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedIds.includes(s.id));

  return (
    <div className="space-y-3 w-full">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          placeholder="Cari berdasarkan nama siswa atau NIS..."
          className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-foreground placeholder:text-muted-foreground shadow-2xs transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
            title="Hapus pencarian"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Info & Bulk Select Action Toolbar */}
      <div className="flex items-center justify-between text-xs px-1 text-muted-foreground flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            Daftar Siswa ({filteredStudents.length})
          </span>
          {selectedIds.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
              {selectedIds.length} dipilih
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={disabled}
              className="text-xs text-muted-foreground hover:text-destructive hover:underline cursor-pointer"
            >
              Reset Pilihan
            </button>
          )}

          {filteredStudents.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAllFiltered}
              disabled={disabled}
              className="h-7 text-xs px-2.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10 cursor-pointer gap-1.5 font-medium"
            >
              {isAllFilteredSelected ? (
                <>
                  <CheckSquare2 className="h-3.5 w-3.5" />
                  <span>Batal Pilih Semua</span>
                </>
              ) : (
                <>
                  <Square className="h-3.5 w-3.5" />
                  <span>Pilih Semua ({filteredStudents.length})</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Students List */}
      <div className="border border-border/80 rounded-2xl bg-muted/20 p-2 sm:p-2.5 max-h-[320px] sm:max-h-[380px] overflow-y-auto space-y-1.5 custom-scrollbar">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((st) => {
            const isSelected = selectedIds.includes(st.id);
            return (
              <div
                key={st.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleStudent(st.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleStudent(st.id);
                  }
                }}
                className={cn(
                  "w-full text-left p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-3 transition-all cursor-pointer border select-none",
                  isSelected
                    ? "bg-emerald-500/15 border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/40"
                    : "bg-card border-border/60 hover:bg-muted/70 hover:border-border text-foreground active:scale-[0.99]"
                )}
              >
                {/* Avatar + Nama + NIS ONLY */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="size-10 rounded-full overflow-hidden shrink-0 border border-border/80 shadow-2xs hover:ring-2 hover:ring-emerald-500/60 transition-all cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                    title={`Klik untuk melihat foto ${st.name}`}
                  >
                    <UserAvatar
                      src={st.image}
                      gender={st.gender}
                      name={st.name}
                      alt={st.name}
                      previewable={true}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="truncate min-w-0 flex-1">
                    <span
                      className={cn(
                        "block font-semibold truncate text-sm leading-tight",
                        isSelected
                          ? "text-emerald-700 dark:text-emerald-300 font-bold"
                          : "text-foreground"
                      )}
                    >
                      {st.name}
                    </span>
                    <span className="block text-xs text-muted-foreground truncate mt-0.5">
                      NIS: {st.nis || "-"}
                    </span>
                  </div>
                </div>

                {/* Checkbox indicator */}
                <div className="shrink-0 pl-1">
                  {isSelected ? (
                    <div className="h-6 w-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-lg border-2 border-border/80 group-hover:border-emerald-500/50 bg-background transition-colors" />
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
            <div className="h-10 w-10 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <p className="font-semibold text-foreground text-sm">Siswa tidak ditemukan</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {searchQuery
                ? `Tidak ada siswa yang cocok dengan "${searchQuery}". Coba gunakan nama atau NIS lain.`
                : "Tidak ada siswa aktif yang tersedia untuk dimasukkan ke kelas."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
