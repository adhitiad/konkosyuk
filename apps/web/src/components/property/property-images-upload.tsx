"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { uploadImageAction } from "@/actions/upload";
import type { UploadImageState } from "@/types/action";
import { useActionState } from "react";
import { getCsrfToken } from "@/lib/axios";

interface PropertyImagesUploadProps {
  initialImages?: string[];
  onImagesChange: (images: string[]) => void;
  minImages?: number;
  maxImages?: number;
}

interface UploadedImage {
  id: string;
  url: string;
  isUploading: boolean;
  progress: number;
}

export function PropertyImagesUpload({
  initialImages = [],
  onImagesChange,
  minImages = 3,
  maxImages = 5,
}: PropertyImagesUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(
    initialImages.map((url) => ({
      id: crypto.randomUUID(),
      url,
      isUploading: false,
      progress: 100,
    })),
  );
  const [dragActive, setDragActive] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [, uploadAction] = useActionState(uploadImageAction, undefined);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const validFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/"),
      );

      const remainingSlots = maxImages - images.length;
      const filesToUpload = validFiles.slice(0, remainingSlots);

      if (filesToUpload.length === 0) {
        toast({
          title: "Batas gambar tercapai",
          description: `Maksimal ${maxImages} gambar per properti.`,
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

      const newImages: UploadedImage[] = filesToUpload.map((file) => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        isUploading: true,
        progress: 0,
      }));

      setImages((prev) => [...prev, ...newImages]);
      setUploadingCount((prev) => prev + filesToUpload.length);

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const imageId = newImages[i].id;

        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", "property");
          const csrfToken = getCsrfToken();
          if (csrfToken) {
            formData.append("csrf", csrfToken);
          }

          const result = (await uploadAction(
            formData,
          )) as unknown as UploadImageState;

          if (result?.success && result.data?.url) {
            setImages((prev) =>
              prev.map((img) =>
                img.id === imageId
                  ? {
                      ...img,
                      url: result.data!.url,
                      isUploading: false,
                      progress: 100,
                    }
                  : img,
              ),
            );

            setImages((currentImages) => {
              const allUrls = currentImages.map((img) => img.url);
              onImagesChange(allUrls);
              return currentImages;
            });
          } else {
            throw new Error(result?.error || "Upload gagal");
          }
        } catch {
          toast({
            title: "Upload gagal",
            description: `Gagal upload ${file.name}`,
            type: "error",
          });

          setImages((prev) => prev.filter((img) => img.id !== imageId));
        } finally {
          setUploadingCount((prev) => prev - 1);
        }
      }
    },
    [images.length, maxImages, onImagesChange, uploadAction],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (
      dragIndex !== null &&
      dragOverIndex !== null &&
      dragIndex !== dragOverIndex
    ) {
      setImages((prev) => {
        const newImages = [...prev];
        const [movedImage] = newImages.splice(dragIndex, 1);
        newImages.splice(dragOverIndex, 0, movedImage);

        onImagesChange(newImages.map((img) => img.url));

        return newImages;
      });
    }

    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dragOverIndex, onImagesChange]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setImages((prev) => {
        const newImages = prev.filter((img) => img.id !== id);
        onImagesChange(newImages.map((img) => img.url));
        return newImages;
      });
    },
    [onImagesChange],
  );

  const canUpload = images.length < maxImages;
  const uploadedCount = images.filter((img) => !img.isUploading).length;
  const hasMinImages = uploadedCount >= minImages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Gambar Properti</h3>
          <p className="text-xs text-muted-foreground">
            Upload {minImages}-{maxImages} gambar (min. {minImages} gambar)
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {uploadedCount} dari {maxImages} gambar
        </div>
      </div>

      {canUpload && (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={uploadingCount > 0}
          />
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            {uploadingCount > 0 ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    Mengupload {uploadingCount} gambar...
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Klik atau drag & drop gambar di sini
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Format: JPG, PNG, WebP (Max 5MB per file)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!canUpload && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Maksimal {maxImages} gambar sudah tercapai
          </CardContent>
        </Card>
      )}

      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">💡 Tips:</span>
            <span>
              Drag gambar untuk mengubah urutan. Gambar pertama akan menjadi
              cover/hero image.
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <Card
                key={image.id}
                className={cn(
                  "relative overflow-hidden group transition-all duration-200",
                  image.isUploading && "opacity-75",
                  dragIndex === index && "opacity-50 scale-95",
                  dragOverIndex === index &&
                    "ring-2 ring-primary ring-offset-2",
                )}
                draggable={!image.isUploading}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
              >
                <CardContent className="p-0 aspect-square relative">
                  <Image
                    src={image.url}
                    alt={`Property image ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized={image.url.startsWith("blob:")}
                  />

                  {image.isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}

                  {index === 0 && !image.isUploading && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center gap-1">
                      <span>⭐</span>
                      <span>Cover</span>
                    </div>
                  )}

                  {index > 0 && !image.isUploading && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                      {index + 1}
                    </div>
                  )}

                  {!image.isUploading && (
                    <div className="absolute bottom-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="9" cy="12" r="1" />
                        <circle cx="9" cy="5" r="1" />
                        <circle cx="9" cy="19" r="1" />
                        <circle cx="15" cy="12" r="1" />
                        <circle cx="15" cy="5" r="1" />
                        <circle cx="15" cy="19" r="1" />
                      </svg>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(image.id)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    disabled={image.isUploading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!hasMinImages && images.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <ImageIcon className="h-4 w-4" />
          <p>
            Minimal {minImages} gambar diperlukan. Saat ini: {uploadedCount}
          </p>
        </div>
      )}
    </div>
  );
}
