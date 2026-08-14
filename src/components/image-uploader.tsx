"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/axios";
import imageCompression from "browser-image-compression";

interface ImageUploaderProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export default function ImageUploader({
  value = [],
  onChange,
  maxFiles = 10,
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const validateFile = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Format tidak didukung",
        description: "Gunakan JPG, PNG, atau WebP.",
        type: "error",
      });
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "Ukuran terlalu besar",
        description: `Maksimal ${maxSizeMB}MB per file.`,
        type: "error",
      });
      return false;
    }
    return true;
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    try {
      return await imageCompression(file, options);
    } catch {
      return file;
    }
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (value.length + files.length > maxFiles) {
        toast({
          title: "Maksimal file",
          description: `Hanya ${maxFiles} file yang diizinkan.`,
          type: "error",
        });
        return;
      }

      setUploading(true);
      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          if (!validateFile(file)) return null;

          const compressedFile = await compressImage(file);
          const formData = new FormData();
          formData.append("file", compressedFile);

          const { data } = await apiClient.post("/api/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          return data.url as string;
        });

        const urls = (await Promise.all(uploadPromises)).filter(
          (url): url is string => url !== null,
        );
        onChange?.([...value, ...urls]);
      } catch (err) {
        toast({
          title: "Upload gagal",
          description:
            err instanceof Error ? err.message : "Terjadi kesalahan.",
          type: "error",
        });
      } finally {
        setUploading(false);
      }
    },
    [value, maxFiles, onChange],
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange?.(updated);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-4xl border-2 border-dashed p-8 transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-input hover:border-primary/50"
        }`}
      >
        <HugeiconsIcon
          icon={Upload01Icon}
          strokeWidth={2}
          className="size-8 text-muted-foreground mb-2"
        />
        <p className="text-sm font-medium">Drag & drop gambar ke sini</p>
        <p className="text-xs text-muted-foreground">
          atau klik untuk memilih file
        </p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploading || value.length >= maxFiles}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <Image
                src={url}
                alt={`Upload ${index + 1}`}
                fill
                className="h-32 w-full rounded-lg object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <HugeiconsIcon
                  icon={Delete01Icon}
                  strokeWidth={2}
                  className="size-3"
                />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
