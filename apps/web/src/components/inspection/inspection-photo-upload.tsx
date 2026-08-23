"use client";

import { useState, useCallback } from "react";
import { toast } from "@/components/ui/toast";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { uploadImageAction } from "@/actions/upload";
import { getCsrfToken } from "@/lib/axios";

interface InspectionPhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function InspectionPhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 10,
}: InspectionPhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const validFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/"),
      );

      const remainingSlots = maxPhotos - photos.length;
      const filesToUpload = validFiles.slice(0, remainingSlots);

      if (filesToUpload.length === 0) {
        toast({
          title: "Batas foto tercapai",
          description: `Maksimal ${maxPhotos} foto per inspeksi.`,
          type: "error",
        });
        return;
      }

      if (filesToUpload.length > remainingSlots) {
        toast({
          title: "Beberapa file diabaikan",
          description: `Hanya ${remainingSlots} slot tersisa.`,
          type: "info",
        });
      }

      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "inspection");
        const csrfToken = getCsrfToken();
        if (csrfToken) {
          formData.append("csrf", csrfToken);
        }

        const result = await uploadImageAction(undefined, formData);

        if (result?.success && result.data?.url) {
          onPhotosChange([...photos, result.data.url]);
          toast({
            title: "Upload berhasil",
            type: "success",
          });
        } else {
          toast({
            title: result?.error || "Gagal mengunggah foto",
            type: "error",
          });
        }
      }
    },
    [photos, maxPhotos, onPhotosChange],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() =>
          document.getElementById("inspection-photo-input")?.click()
        }
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
        )}
      >
        <input
          id="inspection-photo-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2">
          <Upload className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Klik atau seret foto ke sini</p>
          <p className="text-xs text-muted-foreground">
            Maksimal {maxPhotos} foto, format JPG/PNG/WebP
          </p>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {photos.map((url, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-lg overflow-hidden border group"
            >
              <Image
                src={url}
                alt={`Inspection photo ${idx + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
