"use client";

import { useState, useCallback } from "react";

interface DropzoneProps {
  onFilesChange: (files: File[]) => void;
  maxFiles: number;
  minFiles: number;
  currentFiles: File[];
}

export function Dropzone({
  onFilesChange,
  maxFiles,
  minFiles,
  currentFiles,
}: DropzoneProps) {
  const [dragActive, setDragActive] = useState(false);

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
        const newFiles = Array.from(e.dataTransfer.files).filter((f) =>
          f.type.startsWith("image/"),
        );
        const allowed = newFiles.slice(
          0,
          Math.max(0, maxFiles - currentFiles.length),
        );
        if (allowed.length > 0) {
          onFilesChange([...currentFiles, ...allowed]);
        }
      }
    },
    [currentFiles, maxFiles, onFilesChange],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files).filter((f) =>
          f.type.startsWith("image/"),
        );
        const allowed = newFiles.slice(
          0,
          Math.max(0, maxFiles - currentFiles.length),
        );
        if (allowed.length > 0) {
          onFilesChange([...currentFiles, ...allowed]);
        }
      }
    },
    [currentFiles, maxFiles, onFilesChange],
  );

  const removeFile = useCallback(
    (index: number) => {
      const updated = currentFiles.filter((_, i) => i !== index);
      onFilesChange(updated);
    },
    [currentFiles, onFilesChange],
  );

  const remainingSlots = maxFiles - currentFiles.length;
  const canAddMore = remainingSlots > 0;
  const belowMin = currentFiles.length < minFiles;

  return (
    <div className="space-y-2">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-4xl border-2 border-dashed p-6 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        } ${!canAddMore ? "opacity-50" : ""}`}
      >
        <input
          id="property-images"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleChange}
          disabled={!canAddMore}
        />
        <label
          htmlFor="property-images"
          className={`flex cursor-pointer flex-col items-center gap-2 ${!canAddMore ? "cursor-not-allowed" : ""}`}
        >
          <div className="rounded-full bg-primary/10 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">
              {canAddMore
                ? "Klik atau seret gambar ke sini"
                : "Maksimal 5 gambar"}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP maksimal 2MB per file
            </p>
          </div>
        </label>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span
          className={
            belowMin ? "text-red-500 font-medium" : "text-muted-foreground"
          }
        >
          {currentFiles.length}/{maxFiles} gambar{" "}
          {belowMin && `(Minimal ${minFiles})`}
        </span>
        {belowMin && (
          <span className="text-red-500">
            Kurang {minFiles - currentFiles.length} gambar lagi
          </span>
        )}
      </div>

      {currentFiles.length > 0 && (
         
        <div className="grid grid-cols-5 gap-2">
          {currentFiles.map((file, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg border overflow-hidden"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
