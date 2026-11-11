export interface CanvasStrokePoint {
  x: number;
  y: number;
}

export interface CanvasStroke {
  id: string;
  tool: "pen" | "highlighter" | "eraser";
  color: string;
  size: number;
  points: CanvasStrokePoint[];
  page: number;
}

export interface CanvasTextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  page: number;
}

export interface CanvasStampAnnotation {
  id: string;
  type: "check" | "cross" | "star";
  x: number;
  y: number;
  page: number;
}

export interface DocumentAnnotationPayload {
  version: number;
  strokes: CanvasStroke[];
  texts: CanvasTextAnnotation[];
  stamps: CanvasStampAnnotation[];
}

export interface AnnotationSummary {
  strokeCount: number;
  textCount: number;
  checkCount: number;
  crossCount: number;
  starCount: number;
  totalCount: number;
  pages: number[];
}

/**
 * Parses serialized canvas annotation JSON safely into a normalized payload.
 */
export function parseAnnotationData(raw?: string | null): DocumentAnnotationPayload | null {
  if (!raw || typeof raw !== "string" || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DocumentAnnotationPayload>;
    if (!parsed || typeof parsed !== "object") return null;

    return {
      version: typeof parsed.version === "number" ? parsed.version : 1,
      strokes: Array.isArray(parsed.strokes) ? parsed.strokes : [],
      texts: Array.isArray(parsed.texts) ? parsed.texts : [],
      stamps: Array.isArray(parsed.stamps) ? parsed.stamps : [],
    };
  } catch {
    return null;
  }
}

/**
 * Returns true if the annotation JSON contains at least one stroke, text, or stamp.
 */
export function hasCanvasAnnotations(raw?: string | null): boolean {
  const parsed = parseAnnotationData(raw);
  if (!parsed) return false;
  return parsed.strokes.length > 0 || parsed.texts.length > 0 || parsed.stamps.length > 0;
}

/**
 * Summarizes strokes, text notes, stamps, and annotated page numbers.
 */
export function summarizeCanvasAnnotations(raw?: string | null): AnnotationSummary {
  const parsed = parseAnnotationData(raw);
  if (!parsed) {
    return {
      strokeCount: 0,
      textCount: 0,
      checkCount: 0,
      crossCount: 0,
      starCount: 0,
      totalCount: 0,
      pages: [],
    };
  }

  let checkCount = 0;
  let crossCount = 0;
  let starCount = 0;
  const pageSet = new Set<number>();

  for (const s of parsed.strokes) {
    if (typeof s.page === "number") pageSet.add(s.page);
  }
  for (const t of parsed.texts) {
    if (typeof t.page === "number") pageSet.add(t.page);
  }
  for (const st of parsed.stamps) {
    if (typeof st.page === "number") pageSet.add(st.page);
    if (st.type === "check") checkCount++;
    else if (st.type === "cross") crossCount++;
    else if (st.type === "star") starCount++;
  }

  const strokeCount = parsed.strokes.length;
  const textCount = parsed.texts.length;
  const totalCount = strokeCount + textCount + parsed.stamps.length;

  return {
    strokeCount,
    textCount,
    checkCount,
    crossCount,
    starCount,
    totalCount,
    pages: Array.from(pageSet).sort((a, b) => a - b),
  };
}

/**
 * Determines whether a submission's `file_url` is a manually uploaded student file
 * (Option 2) rather than an in-app canvas snapshot (`/canvas-...`) or worksheet fallback.
 */
export function isUploadedSubmissionFile(
  fileUrl?: string | null,
  fileSoalUrl?: string | null,
  fileType?: string | null
): boolean {
  if (!fileUrl || fileUrl.trim().length === 0) return false;
  if (fileSoalUrl && fileUrl === fileSoalUrl) return false;
  if (fileType === "worksheet") return false;
  if (fileUrl.includes("/canvas-")) return false;
  return true;
}

/**
 * Resolves the exact base document URL against which `annotated_data` coordinates
 * were recorded (manual uploaded file for Option 2 uploads, or teacher's worksheet
 * `fileSoalUrl` for Option 1 in-app canvas work).
 */
export function resolveAnnotationBaseDocumentUrl({
  fileSoalUrl,
  submissionFileUrl,
  submissionFileType,
}: {
  fileSoalUrl?: string | null;
  submissionFileUrl?: string | null;
  submissionFileType?: string | null;
}): string {
  if (isUploadedSubmissionFile(submissionFileUrl, fileSoalUrl, submissionFileType)) {
    return submissionFileUrl || fileSoalUrl || "";
  }
  return fileSoalUrl || submissionFileUrl || "";
}

