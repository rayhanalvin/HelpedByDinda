"use client";

import * as React from "react";
import { ImagePlus, Upload, Link2, X, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";

interface ImageUploaderProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function ImageUploader({ label = "Gambar", value, onChange, placeholder = "Tempel URL gambar atau unggah dari perangkat", className, compact }: ImageUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast("File harus berupa gambar.", "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast("Ukuran gambar maksimal 8 MB.", "error");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await apiFetch<{ ok: boolean; data: { url: string } }>("/api/admin/upload", {
        method: "POST",
        body: formData,
        headers: {},
      });
      onChange(result.data.url);
      toast("Gambar berhasil diunggah.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mengunggah gambar.", "error");
    } finally {
      setUploading(false);
    }
  };

  const showPreview = Boolean(value && value.trim());

  return (
    <div className={`space-y-2 ${className || ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        {showPreview && (
          <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline">
            <Trash2 className="h-3 w-3" /> Hapus gambar
          </button>
        )}
      </div>

      <div className={`flex items-center gap-2 ${compact ? "flex-col sm:flex-row" : "flex-col sm:flex-row"}`}>
        <Button type="button" variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Mengunggah..." : "Upload Gambar"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        <div className="relative w-full">
          <Link2 className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={compact ? "pl-9 h-9 text-xs" : "pl-9"} />
        </div>
      </div>

      {showPreview && (
        <div className="group relative overflow-hidden rounded-xl border border-border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="max-h-48 w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.3")} />
        </div>
      )}
    </div>
  );
}