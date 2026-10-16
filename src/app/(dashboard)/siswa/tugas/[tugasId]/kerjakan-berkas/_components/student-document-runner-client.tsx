"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentCanvasEditor } from "@/components/features/assignment/canvas/document-canvas-editor";
import { saveStudentDraftAnnotationAction, submitDocumentTaskAction } from "@/actions/assignment";
import { toast } from "sonner";

interface StudentDocumentRunnerClientProps {
  tugasId: string;
  tugasJudul: string;
  fileSoalUrl: string;
  submissionId: string;
  initialAnnotationData?: string | null;
  isGraded?: boolean;
}

export function StudentDocumentRunnerClient({
  tugasId,
  tugasJudul,
  fileSoalUrl,
  submissionId,
  initialAnnotationData,
  isGraded = false,
}: StudentDocumentRunnerClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveDraft = async ({ annotationData }: { annotationData: string }) => {
    try {
      await saveStudentDraftAnnotationAction({
        tugasId,
        annotatedData: annotationData,
      });
    } catch (e) {
      console.error("Gagal simpan draft:", e);
    }
  };

  const handleSubmit = async ({
    annotationData,
    renderedImageDataUrl,
  }: {
    annotationData: string;
    renderedImageDataUrl: string;
  }) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("tugas_id", tugasId);
      formData.append("submission_mode", "in_app");
      formData.append("annotated_data", annotationData);
      formData.append("canvas_image_data", renderedImageDataUrl);

      const res = await submitDocumentTaskAction(formData);
      if (res.success) {
        toast.success(res.message);
        router.push(`/siswa/tugas/${tugasId}`);
      } else {
        toast.error(res.error || "Gagal mengumpulkan tugas.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan saat mengumpulkan tugas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full">
      <DocumentCanvasEditor
        fileUrl={fileSoalUrl}
        fileName={tugasJudul}
        mode="student"
        initialAnnotationData={initialAnnotationData}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        readOnly={isGraded}
        submitButtonText="Kumpulkan Tugas 🚀"
      />
    </div>
  );
}
