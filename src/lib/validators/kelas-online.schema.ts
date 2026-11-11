import { z } from "zod";

export const createKelasOnlineRoomSchema = z.object({
  sessionType: z.enum(["MAPEL", "WALI_KELAS"]).default("MAPEL"),
  kelasId: z.string().trim().optional(),
  mapelId: z.string().trim().optional(),
  jadwalId: z.string().trim().optional(),
  pertemuanId: z.string().trim().optional(),
  topik: z.string().trim().max(255, "Topik maksimal 255 karakter").optional(),
});
