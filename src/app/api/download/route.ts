import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { getSession } from "@/lib/auth";
import { resolveUploadFilePath } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.status === "0") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("file");
  const customName = searchParams.get("name");

  if (!filePath) {
    return new NextResponse("File parameter is required", { status: 400 });
  }

  try {
    const resolved = resolveUploadFilePath(filePath);
    if (!resolved.valid) {
      return new NextResponse("Unauthorized path", { status: 403 });
    }

    let fileStat: Awaited<ReturnType<typeof stat>>;
    try {
      fileStat = await stat(resolved.fullPath);
    } catch {
      return new NextResponse("File tidak ditemukan", { status: 404 });
    }

    if (!fileStat.isFile()) {
      return new NextResponse("Target bukan file", { status: 400 });
    }

    const ext = path.extname(resolved.fullPath);
    let downloadFilename = path.basename(resolved.fullPath);

    if (customName) {
      const cleanCustom = customName
        .replace(/[\r\n\0/\\?%*:|"<>]/g, "-")
        .trim();
      if (cleanCustom) {
        downloadFilename = cleanCustom.toLowerCase().endsWith(ext.toLowerCase())
          ? cleanCustom
          : `${cleanCustom}${ext}`;
      }
    }

    const asciiFilename = downloadFilename.replace(/[^\x20-\x7E]|["\\;]/g, "_");
    const nodeStream = fs.createReadStream(resolved.fullPath);
    const webStream = Readable.toWeb(nodeStream) as unknown as BodyInit;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(
          downloadFilename
        )}`,
        "Content-Length": fileStat.size.toString(),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Download route error:", error);
    return new NextResponse("Gagal mengunduh file", { status: 500 });
  }
}
