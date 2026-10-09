"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export default function PengajarMateriBaruPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const [formData, setFormData] = React.useState({
    judul: "",
    deskripsi: "",
    mataPelajaran: "Matematika",
    kelasSasaran: "SMA",
    isPublished: true,
  });
  const [file, setFile] = React.useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast("Pilih berkas materi (PDF/MP4/gambar/dokumen) sebelum simpan.", "error");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast("Ukuran berkas maksimal 25MB.", "error");
      return;
    }
    setLoading(true);

    (async () => {
      try {
        const fd = new FormData();
        fd.append("judul", formData.judul);
        fd.append("deskripsi", formData.deskripsi);
        fd.append("mataPelajaran", formData.mataPelajaran);
        fd.append("kelasSasaran", formData.kelasSasaran);
        fd.append("kategori", "Pembelajaran");
        fd.append("isPublished", String(formData.isPublished));
        fd.append("file", file);
        const res = await fetch("/api/materi", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message || "Gagal menyimpan materi");
        toast("Materi pembelajaran berhasil diunggah!", "success");
        router.push("/pengajar/materi");
      } catch (err) {
        toast(String((err as Error).message || "Gagal menyimpan materi"), "error");
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link href="/pengajar/materi" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-2">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Materi
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Unggah Materi Pembelajaran Baru</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Lengkapi metadata materi agar murid dapat mengakses video streaming Bunny atau mengunduh modul PDF.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Informasi Utama Materi</CardTitle>
            <CardDescription>Judul dan sasaran jenjang murid yang dapat melihat materi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Judul Materi Pembelajaran</label>
              <Input required placeholder="Contoh: Logaritma & Eksponen: Rumus Kilat & Soal UTBK" value={formData.judul} onChange={(e) => setFormData({ ...formData, judul: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Mata Pelajaran</label>
                <select
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={formData.mataPelajaran}
                  onChange={(e) => setFormData({ ...formData, mataPelajaran: e.target.value })}
                >
                  <option value="Matematika">Matematika</option>
                  <option value="Fisika">Fisika</option>
                  <option value="Bahasa Inggris">Bahasa Inggris</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Penalaran Kuantitatif">Penalaran Kuantitatif UTBK</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Jenjang Kelas Sasaran</label>
                <select
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={formData.kelasSasaran}
                  onChange={(e) => setFormData({ ...formData, kelasSasaran: e.target.value })}
                >
                  <option value="SD">SD (Kelas 1-6)</option>
                  <option value="SMP">SMP (Kelas 7-9)</option>
                  <option value="SMA">SMA (Kelas 10-12)</option>
                  <option value="UTBK">Intensif UTBK SNBT</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Deskripsi / Ringkasan Materi</label>
              <textarea
                rows={3}
                required
                placeholder="Jelaskan ringkasan konsep yang akan dipelajari murid dalam video atau modul ini..."
                className="w-full rounded-xl border border-input bg-card p-3.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Media & Bunny Stream Integration */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Media & Berkas Pembelajaran</CardTitle>
            <CardDescription>PDF, MP4, gambar, atau dokumen pembelajaran (maks 25MB) yang akan disimpan dan tersinkronisasi untuk murid.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors bg-muted/20 cursor-pointer block">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              {file ? (
                <>
                  <p className="text-sm font-bold text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB — siap untuk diunggah</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-foreground">Pilih Berkas Video MP4, PDF, atau Dokumen untuk Diunggah</p>
                  <p className="text-xs text-muted-foreground mt-1">Batas ukuran maks. 25MB • PDF • MP4 • WebM • Gambar • Word/PPT</p>
                </>
              )}
              <input
                type="file"
                className="sr-only"
                accept=".pdf,.mp4,.webm,.mov,.jpg,.jpeg,.png,.webp,.ppt,.pptx,.doc,.docx,.txt"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  e.target.value = "";
                  if (!selected) return;
                  if (selected.size > MAX_FILE_SIZE) {
                    toast("Ukuran berkas maksimal 25MB.", "error");
                    return;
                  }
                  setFile(selected);
                }}
              />
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/pengajar/materi">
            <Button variant="outline">Batal</Button>
          </Link>
          <Button type="submit" variant="accent" size="lg" isLoading={loading} className="font-bold px-8">
            Simpan Materi
          </Button>
        </div>
      </form>
    </div>
  );
}
