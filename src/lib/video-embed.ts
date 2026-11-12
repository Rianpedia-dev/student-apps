const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".ogv", ".mov", ".m4v"] as const;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
]);
const YOUTUBE_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;
const GDRIVE_ID_REGEX = /^[A-Za-z0-9_-]{10,}$/;

export type ResolvedLearningVideo =
  | {
      kind: "iframe";
      provider: "youtube" | "gdrive" | "vimeo";
      embedUrl: string;
      originalUrl: string;
    }
  | {
      kind: "video";
      provider: "direct";
      videoSrc: string;
      originalUrl: string;
    }
  | {
      kind: "link";
      provider: "external";
      originalUrl: string;
    };

/**
 * Menentukan apakah sebuah URL atau tipe berkas merujuk ke file video yang dapat diputar langsung oleh browser.
 */
export function isVideoFile(url?: string | null, fileType?: string | null): boolean {
  if (fileType) {
    const cleanType = fileType.trim().toLowerCase().replace(/^\./, "");
    if (
      cleanType.startsWith("video/") ||
      VIDEO_EXTENSIONS.some((ext) => ext.slice(1) === cleanType)
    ) {
      return true;
    }
  }

  if (url) {
    const cleanPath = url.trim().split(/[?#]/)[0].toLowerCase();
    return VIDEO_EXTENSIONS.some((ext) => cleanPath.endsWith(ext));
  }

  return false;
}

function normalizeVideoUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null;
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return candidate;
  } catch {
    return null;
  }
}

/**
 * Mengekstrak ID video YouTube (11 karakter) dari URL watch, youtu.be, shorts, live, maupun embed.
 */
export function getYouTubeVideoId(url?: string | null): string | null {
  const normalized = normalizeVideoUrl(url);
  if (!normalized || normalized.startsWith("/")) return null;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0] || "";
    return YOUTUBE_ID_REGEX.test(id) ? id : null;
  }

  if (!YOUTUBE_HOSTS.has(host)) {
    return null;
  }

  const vParam = parsed.searchParams.get("v");
  if (vParam && YOUTUBE_ID_REGEX.test(vParam)) {
    return vParam;
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (
    segments.length >= 2 &&
    ["embed", "shorts", "live", "v"].includes(segments[0]) &&
    YOUTUBE_ID_REGEX.test(segments[1])
  ) {
    return segments[1];
  }

  return null;
}

/**
 * Mengubah URL YouTube menjadi URL embed mode privasi (youtube-nocookie.com).
 */
export function getYouTubeEmbedUrl(url?: string | null): string | null {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : null;
}

/**
 * Mengembalikan daftar URL thumbnail YouTube berurutan dari resolusi tertinggi ke fallback standar.
 */
export function getYouTubeThumbnailUrls(urlOrId?: string | null): string[] {
  if (!urlOrId) return [];
  const trimmed = urlOrId.trim();
  const videoId = YOUTUBE_ID_REGEX.test(trimmed)
    ? trimmed
    : getYouTubeVideoId(trimmed);
  if (!videoId) return [];

  return [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  ];
}

function getGoogleDriveEmbedUrl(parsed: URL): string | null {
  if (parsed.hostname.toLowerCase() !== "drive.google.com") {
    return null;
  }

  const pathMatch = parsed.pathname.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
  if (pathMatch && GDRIVE_ID_REGEX.test(pathMatch[1])) {
    return `https://drive.google.com/file/d/${pathMatch[1]}/preview`;
  }

  if (parsed.pathname === "/open" || parsed.pathname === "/uc") {
    const idParam = parsed.searchParams.get("id");
    if (idParam && GDRIVE_ID_REGEX.test(idParam)) {
      return `https://drive.google.com/file/d/${idParam}/preview`;
    }
  }

  return null;
}

function getVimeoEmbedUrl(parsed: URL): string | null {
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

  if (host === "player.vimeo.com") {
    const match = parsed.pathname.match(/^\/video\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : null;
  }

  if (host === "vimeo.com") {
    const match = parsed.pathname.match(/\/(\d+)(?:\/[A-Za-z0-9]+)?$/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : null;
  }

  return null;
}

/**
 * Memetakan tautan atau path video pembelajaran menjadi mode pemutaran terbaik:
 * iframe (YouTube / Google Drive / Vimeo), pemutar HTML5 langsung, atau tautan eksternal.
 */
export function resolveLearningVideo(url?: string | null): ResolvedLearningVideo | null {
  const normalized = normalizeVideoUrl(url);
  if (!normalized) return null;

  if (normalized.startsWith("/")) {
    if (isVideoFile(normalized)) {
      return {
        kind: "video",
        provider: "direct",
        videoSrc: normalized,
        originalUrl: normalized,
      };
    }
    return {
      kind: "link",
      provider: "external",
      originalUrl: normalized,
    };
  }

  const youtubeEmbed = getYouTubeEmbedUrl(normalized);
  if (youtubeEmbed) {
    return {
      kind: "iframe",
      provider: "youtube",
      embedUrl: youtubeEmbed,
      originalUrl: normalized,
    };
  }

  const parsed = new URL(normalized);

  const gdriveEmbed = getGoogleDriveEmbedUrl(parsed);
  if (gdriveEmbed) {
    return {
      kind: "iframe",
      provider: "gdrive",
      embedUrl: gdriveEmbed,
      originalUrl: normalized,
    };
  }

  const vimeoEmbed = getVimeoEmbedUrl(parsed);
  if (vimeoEmbed) {
    return {
      kind: "iframe",
      provider: "vimeo",
      embedUrl: vimeoEmbed,
      originalUrl: normalized,
    };
  }

  if (isVideoFile(normalized)) {
    return {
      kind: "video",
      provider: "direct",
      videoSrc: normalized,
      originalUrl: normalized,
    };
  }

  return {
    kind: "link",
    provider: "external",
    originalUrl: normalized,
  };
}

