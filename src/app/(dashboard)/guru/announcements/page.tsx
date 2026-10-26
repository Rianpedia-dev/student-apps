import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Calendar, Edit, Megaphone, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateIndo } from "@/lib/utils";
import { AnnouncementAttachment } from "@/components/shared/announcement-attachment";
import { CreateAnnouncementDialog } from "@/components/features/announcement/create-announcement-dialog";
import { DeleteAnnouncementButton } from "@/components/features/announcement/delete-announcement-button";

export const dynamic = "force-dynamic";

export default async function GuruAnnouncementsPage() {
  const session = await getSession();
  if (!session || session.role !== "guru") {
    redirect("/login");
  }

  const guruClass = session.kelas || "Guru";

  let announcements: any[] = [];
  try {
    announcements = await prisma.pengumuman.findMany({
      where: { from: guruClass },
      orderBy: { id: "desc" },
    });
  } catch (e) {
    console.error("Database query error in guru announcements:", e);
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman & Tombol Buat Pengumuman */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pengumuman Kelas</h1>
        </div>
        <CreateAnnouncementDialog guruClass={guruClass} />
      </div>

      {/* Daftar Pengumuman Kelas Guru */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Pengumuman Diterbitkan
          </h2>
        </div>

        {announcements.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <div className="p-3.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Megaphone className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-base">Belum Ada Pengumuman</h3>
              </div>
              <div className="pt-2">
                <CreateAnnouncementDialog
                  guruClass={guruClass}
                  trigger={
                    <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium">
                      <Plus className="h-4 w-4" />
                      <span>Buat Pengumuman</span>
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {announcements.map((item) => (
              <Card
                key={item.id.toString()}
                className="relative overflow-hidden border-l-4 border-l-emerald-600 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <CardContent className="p-4 sm:p-5 space-y-3 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={
                          item.from?.toLowerCase().includes("kepala")
                            ? "indigo"
                            : item.from?.toLowerCase().includes("admin")
                              ? "purple"
                              : item.from?.toLowerCase().includes("kurikulum")
                                ? "teal"
                                : item.from?.toLowerCase().includes("kesiswaan")
                                  ? "orange"
                                  : "emerald"
                        }
                        size="sm"
                      >
                        {item.from}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                        <Calendar className="h-3.5 w-3.5" /> {formatDateIndo(item.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <Link href={`/guru/announcements/${item.id}`}>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit pengumuman"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteAnnouncementButton id={item.id.toString()} />
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-foreground tracking-tight">{item.title}</h3>

                  {item.file && (
                    <div className="w-full">
                      <AnnouncementAttachment
                        fileUrl={item.file}
                        title={item.title}
                        compact={true}
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div
                    className="text-sm text-foreground/85 leading-relaxed prose dark:prose-invert max-w-none pt-1 break-words flex-1"
                    dangerouslySetInnerHTML={{ __html: item.pengumuman }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

