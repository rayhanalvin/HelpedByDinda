"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Video, FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export default function PengajarMateriBaruPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const [formData, setFormData] = React.useState({
    judul: "",
    deskripsi: "",
    mataPelajaran: "Matematika",
    kelasSasaran: "SMA",
    tipe: "video",
    durasiMenit: "20",
    isPublished: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/materi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            judul: formData.judul,
            deskripsi: formData.deskripsi,
            mataPelajaran: formData.mataPelajaran,
            kelasSasaran: formData.kelasSasaran,
            kategori: "Pembelajaran",
            isPublished: formData.isPublished,
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message || "Gagal menyimpan materi");
        toast("Materi pembelajaran berhasil diunggah dan disimpan!", "success");
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
            <CardDescription>File video akan otomatis di-encode ke Bunny Stream CDN</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tipe Format Materi</label>
                <select
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={formData.tipe}
                  onChange={(e) => setFormData({ ...formData, tipe: e.target.value })}
                >
                  <option value="video">Video Pembelajaran (Bunny Stream)</option>
                  <option value="pdf">Modul Dokumen PDF (Bunny Storage)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Estimasi Durasi Belajar (Menit)</label>
                <Input type="number" placeholder="20" value={formData.durasiMenit} onChange={(e) => setFormData({ ...formData, durasiMenit: e.target.value })} />
              </div>
            </div>

            {/* Upload Drag & Drop Simulator */}
            <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors bg-muted/20 cursor-pointer">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">Pilih Berkas Video MP4 atau PDF untuk Diunggah</p>
              <p className="text-xs text-muted-foreground mt-1">Batas ukuran Video maks. 2GB (Bunny Stream) • PDF maks. 25MB</p>
              <div className="mt-3 inline-block">
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">Bunny Stream Integration Ready</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/pengajar/materi">
            <Button variant="outline">Batal</Button>
          </Link>
          <Button type="submit" variant="accent" size="lg" isLoading={loading} className="font-bold px-8">
            Simpan & Terbitkan Materi
          </Button>
        </div>
      </form>
    </div>
  );
}
