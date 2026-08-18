"use client";

import { useState, useEffect, useCallback } from "react";
import { UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  initialImageUrl?: string | null;
  onUploadComplete: (url: string) => void;
}

function ImageUpload({ initialImageUrl, onUploadComplete }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Derive the current preview URL: use file preview if available, otherwise initialImageUrl
  const currentPreview = preview ?? initialImageUrl ?? null;

  useEffect(() => {
    if (!preview) return;
    return () => {
      if (preview !== initialImageUrl) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview, initialImageUrl]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (!selected) return;

      if (!selected.type.startsWith("image/")) {
        alert("File yang diupload harus berupa gambar.");
        return;
      }

      if (preview && preview !== initialImageUrl) {
        URL.revokeObjectURL(preview);
      }

      const objectUrl = URL.createObjectURL(selected);
      setFile(selected);
      setPreview(objectUrl);
      setIsUploading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append("file", selected);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          const newUrl = res?.data?.url || res?.url || objectUrl;
          onUploadComplete(newUrl);
          setIsUploading(false);
          setProgress(100);
        } else {
          setIsUploading(false);
          alert("Gagal mengupload gambar.");
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        alert("Gagal mengupload gambar.");
      };

      xhr.send(formData);
    },
    [preview, initialImageUrl, onUploadComplete],
  );

  const handleRemove = useCallback(() => {
    if (preview && preview !== initialImageUrl) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setIsUploading(false);
    setProgress(0);
  }, [preview, initialImageUrl]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Foto Profil</label>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-neutral-900 dark:border-neutral-700 dark:hover:bg-neutral-800 transition-colors overflow-hidden",
          (file || currentPreview) && "p-0",
        )}
        onClick={() =>
          !currentPreview && document.getElementById("image-upload-input")?.click()
        }
      >
        // eslint-disable-next-line @next/next/no-img-element
        {currentPreview ? (
          <>
            <img
              src={currentPreview}
              alt="Preview"
              className="h-full w-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-sm">Ganti gambar</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 size-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="size-4" />
            </button>
            {isUploading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                <p className="text-white text-sm font-medium">Mengupload...</p>
                <div className="w-3/4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <UploadCloud className="size-10 text-slate-400 mb-2" />
            <p className="text-sm text-slate-600 dark:text-neutral-400">
              Drag & drop atau{" "}
              <span className="text-blue-600 font-semibold">pilih file</span>{" "}
              untuk upload
            </p>
          </>
        )}
        <input
          id="image-upload-input"
          type="file"
          className="sr-only"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
    </div>
  );
}

export { ImageUpload };
