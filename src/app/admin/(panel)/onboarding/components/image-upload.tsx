"use client";

import { useCallback, useState } from "react";
import { Upload, X, ImageIcon, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  id: string;
  label: string;
  hint?: string;
  accept?: string;
  preview?: string | null;
  onChange: (file: File | null) => void;
  onClear?: () => void;
  descriptionLabel?: string;
  descriptionValue?: string;
  descriptionPlaceholder?: string;
  descriptionMaxLength?: number;
  onDescriptionChange?: (value: string) => void;
}

export function ImageUpload({
  id,
  label,
  hint,
  accept = "image/png,image/jpeg,image/webp",
  preview,
  onChange,
  onClear,
  descriptionLabel,
  descriptionValue,
  descriptionPlaceholder,
  descriptionMaxLength = 80,
  onDescriptionChange,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        setFileName(file.name);
        onChange(file);
      }
    },
    [onChange]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (file) {
        setFileName(file.name);
        onChange(file);
      }
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setFileName(null);
    onChange(null);
    onClear?.();
  }, [onChange, onClear]);

  const hasPreview = preview || fileName;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-200",
          "flex flex-col items-center justify-center p-6 text-center",
          isDragging
            ? "border-foreground bg-foreground/5"
            : "border-border hover:border-foreground/30 bg-secondary/20",
          hasPreview && "p-4"
        )}
      >
        {preview ? (
          <div className="relative z-10 w-full pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={handleClear}
              className="pointer-events-auto absolute -top-2 -right-2 z-10 size-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center pointer-events-none">
            <div
              className={cn(
                "size-12 rounded-full flex items-center justify-center mb-3 transition-colors",
                isDragging ? "bg-foreground/10" : "bg-secondary"
              )}
            >
              {isDragging ? (
                <FileImage className="size-6 text-foreground" />
              ) : (
                <Upload className="size-6 text-muted-foreground" />
              )}
            </div>

            <p className="text-sm font-medium text-foreground mb-1">
              {isDragging ? "Suelta la imagen aquí" : "Arrastra una imagen"}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              o haz clic para seleccionar
            </p>

            {fileName && (
              <div className="flex items-center gap-2 text-xs text-foreground bg-secondary px-3 py-1.5 rounded-full">
                <ImageIcon className="size-3.5" />
                <span className="max-w-[150px] truncate">{fileName}</span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="pointer-events-auto ml-1 hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
          </div>
        )}

        <input
          id={id}
          name={id}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="absolute inset-0 z-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {onDescriptionChange && (
        <div className="space-y-2">
          <label htmlFor={`${id}-description`} className="text-xs font-medium text-foreground">
            {descriptionLabel ?? "Descripcion breve"}
          </label>
          <input
            id={`${id}-description`}
            type="text"
            value={descriptionValue ?? ""}
            onChange={(event) => onDescriptionChange(event.target.value)}
            maxLength={descriptionMaxLength}
            placeholder={descriptionPlaceholder ?? "Ej: Frente del local al atardecer"}
            className="h-10 w-full rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
          />
          <p className="text-[11px] text-muted-foreground">
            Se muestra debajo de la foto en la galeria publica.
          </p>
        </div>
      )}
    </div>
  );
}
