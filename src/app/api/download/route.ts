import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("file");
  const customName = searchParams.get("name");

  if (!filePath) {
    return new NextResponse("File parameter is required", { status: 400 });
  }

  try {
    const decodedPath = decodeURIComponent(filePath).trim();

    // Security: normalize and prevent path traversal
    const normalized = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, "");

    // Must be inside uploads directory
    const isUploadPath =
      normalized.startsWith("/uploads") ||
      normalized.startsWith("uploads") ||
      normalized.startsWith("\\uploads");

    if (!isUploadPath) {
      return new NextResponse("Unauthorized path", { status: 403 });
    }

    const cleanRelative = normalized.replace(/^[\\\/]+/, "");
    const fullPath = path.join(process.cwd(), "public", cleanRelative);

    if (!fs.existsSync(fullPath)) {
      return new NextResponse("File tidak ditemukan", { status: 404 });
    }

    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) {
      return new NextResponse("Target bukan file", { status: 400 });
    }

    const ext = path.extname(fullPath);
    let downloadFilename = path.basename(fullPath);

    if (customName) {
      const cleanCustom = customName.replace(/[/\\?%*:|"<>]/g, "-").trim();
      if (cleanCustom) {
        downloadFilename = cleanCustom.endsWith(ext)
          ? cleanCustom
          : `${cleanCustom}${ext}`;
      }
    }

    const fileBuffer = fs.readFileSync(fullPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${downloadFilename}"; filename*=UTF-8''${encodeURIComponent(
          downloadFilename
        )}`,
        "Content-Length": stat.size.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Download route error:", error);
    return new NextResponse("Gagal mengunduh file", { status: 500 });
  }
}
