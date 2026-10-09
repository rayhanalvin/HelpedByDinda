"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

type MateriEdit = {
  id: string;
  judul: string;
  deskripsi: string;
  mataPelajaran: string;
  kelasSasaran: string;
  fileName: string | null;
  isPublished: boolean;
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export default function PengajarMateriEditPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    judul: "",
    deskripsi: "",
    mataPelajaran: "Matematika",
    kelasSasaran: "SMA",
  });
  const [file, setFile] = React.useState<File | null>(null);
  const [existingFileName, setExistingFileName] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/materi/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message || "Gagal memuat materi.");
        setFormData({
          judul: data.data.judul,
          deskripsi: data.data.deskripsi || "",
          mataPelajaran: data.data.mataPelajaran,
          kelasSasaran: data.data.kelasSasaran,
        });
        setExistingFileName(data.data.fileName || null);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Gagal memuat materi.", "error");
        router.push("/pengajar/materi");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("id", id);
      fd.append("judul", formData.judul);
      fd.append("deskripsi", formData.deskripsi);
      fd.append("mataPelajaran", formData.mataPelajaran);
      fd.append("kelasSasaran", formData.kelasSasaran);
      if (file) fd.append("file", file);
      const res = await fetch("/api/materi", { method: "PATCH", body: fd });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Gagal simpan perubahan.");
      toast("Materi berhasil diperbarui!", "success");
      router.push("/pengajar/materi");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal simpan perubahan.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFile = async () => {
    try {
      const res = await fetch("/api/materi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, fileUrl: null, bunnyVideoId: null, thumbnailUrl: null }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Gagal menghapus berkas.");
      setExistingFileName(null);
      setFile(null);
      toast("Berkas materi dihapus.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menghapus berkas.", "error");
    }
  };

  if (loading) {
    return <div className="text-center text-sm text-muted-foreground p-10">Memuat materi...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link href="/pengajar/materi" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-2">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Materi
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Edit Materi Pembelajaran</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Perbarui metadata dan berkas pembelajaran untuk murid.</p>
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
              <Input required value={formData.judul} onChange={(e) => setFormData({ ...formData, judul: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Mata Pelajaran</label>
                <select
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm"
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
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm"
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
                className="w-full rounded-xl border border-input bg-card p-3.5 text-sm text-foreground shadow-sm"
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Berkas Pembelajaran</CardTitle>
            <CardDescription>PDF, MP4, gambar, atau dokumen (maks 25MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingFileName && !file && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                <p className="text-xs font-semibold text-emerald-700">Berkas saat ini: {existingFileName}</p>
                <Button variant="destructive" size="sm" className="mt-2" type="button" onClick={handleDeleteFile}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus Berkas
                </Button>
              </div>
            )}
            <label className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 transition-colors bg-muted/20 cursor-pointer block">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">
                {file ? file.name : existingFileName ? "Ganti Berkas" : "Pilih Berkas Pembelajaran"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF • MP4 • Gambar • Word/PPT — maks 25MB</p>
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
            <Button variant="outline" type="button">Batal</Button>
          </Link>
          <Button type="submit" variant="accent" size="lg" isLoading={saving} className="font-bold px-8">
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}