"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, FileText, CheckCircle2, Share2, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-fetch";

export default function MuridMateriDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;

  type Detail = {
    id: string;
    judul: string;
    deskripsi: string | null;
    mataPelajaran: string;
    kelasSasaran: string;
    kelasLabel: string;
    pengajarNama: string;
    thumbnailUrl?: string | null;
    fileUrl?: string | null;
    fileData?: string | null;
    fileName?: string | null;
    fileMimeType?: string | null;
    isPublished: boolean;
  } | null;

  const [materi, setMateri] = React.useState<Detail>(null);

  React.useEffect(() => {
    let mounted = true;
    if (!id) return;
    apiFetch(`/api/materi/${id}`)
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok || !res.ok) throw new Error(res.message || "Akses materi ditolak.");
        return res;
      })
      .then((res) => {
        if (!mounted) return;
        setMateri(res.data as Detail);
      })
      .catch((error) => {
        setMateri(null);
        if (mounted) toast(error instanceof Error ? error.message : "Materi tidak dapat diakses.", "error");
      });
    return () => {
      mounted = false;
    };
  }, [id, toast]);
  if (!materi) return <div className="py-12 text-center">Materi tidak ditemukan atau akses ditolak.</div>;

  const fileSrc = materi.fileData || materi.fileUrl || null;
  const isPdf = materi.fileMimeType === "application/pdf" || (materi.fileName || "").toLowerCase().endsWith(".pdf");
  const isVideo = (materi.fileMimeType || "").startsWith("video/") || [".mp4", ".webm", ".mov"].some((ext) => (materi.fileName || "").toLowerCase().endsWith(ext));

  const handleDownloadFile = () => {
    if (!fileSrc) {
      toast("Belum ada berkas untuk materi ini.", "error");
      return;
    }
    const a = document.createElement("a");
    a.href = fileSrc;
    a.download = materi.fileName || `${materi.judul}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast("Unduh berkas dimulai.", "success");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link href="/murid/materi" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-2">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Katalog Materi
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Kelas {materi.kelasSasaran}
              </Badge>
              <span className="text-xs text-muted-foreground">Oleh {materi.pengajarNama}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{materi.judul}</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast("Tautan materi telah disalin ke papan klip!", "info");
            }}
            className="gap-1.5 text-xs font-semibold"
          >
            <Share2 className="h-3.5 w-3.5" /> Bagikan
          </Button>
        </div>
      </div>

      {/* Berkas Pembelajaran Area */}
      <div className="rounded-3xl overflow-hidden border border-border bg-zinc-950 shadow-2xl relative">
        {fileSrc && isVideo ? (
          <video
            key={fileSrc}
            controls
            className="aspect-video w-full"
            src={fileSrc}
            poster={materi.thumbnailUrl || undefined}
          />
        ) : fileSrc && isPdf ? (
          <iframe src={fileSrc} title={materi.judul} className="aspect-video w-full" />
        ) : fileSrc ? (
          <div className="relative aspect-video w-full flex items-center justify-center">
            <img src={materi.thumbnailUrl ?? ""} alt={materi.judul} className="absolute inset-0 w-full h-full object-cover opacity-40" />
            <div className="relative z-10 flex flex-col items-center gap-3 p-6">
              <FileText className="h-12 w-12 text-white/90" />
              <p className="text-sm font-bold text-white">Berkas: {materi.fileName || "Berkas Pembelajaran"}</p>
              <Button variant="accent" size="sm" onClick={handleDownloadFile} className="gap-1.5 text-xs font-bold">
                <Download className="h-4 w-4" /> Unduh Berkas
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative aspect-video w-full flex items-center justify-center bg-zinc-950">
            <div className="relative z-10 flex flex-col items-center gap-3 p-6 text-center">
              <FileText className="h-12 w-12 text-white/60 opacity-60" />
              <p className="text-sm font-bold text-white/80">Belum ada berkas untuk materi ini</p>
            </div>
          </div>
        )}
      </div>

      {/* Content tabs & details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Ringkasan Materi</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{materi.deskripsi}</p>

              <div className="pt-4 border-t border-border space-y-3">
                <h4 className="text-sm font-bold text-foreground">Poin-Poin Penting Pembelajaran:</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Konsep dasar rumus dan pembuktian logika analitis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Langkah penyelesaian bertahap untuk soal tipe UTBK & ujian sekolah</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Perangkap kesalahan umum yang sering dialami murid</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info & Download */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-border">
            <CardContent className="p-5 space-y-4">
              <h4 className="text-sm font-bold text-foreground">Modul Pendukung</h4>
              <div className="rounded-2xl border border-border p-3.5 bg-muted/20 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{materi.fileName || `${materi.judul}.pdf`}</p>
                  <p className="text-[11px] text-muted-foreground">Modul & Berkas Pembelajaran</p>
                </div>
              </div>

              <Button variant="accent" onClick={handleDownloadFile} disabled={!fileSrc} className="w-full text-xs font-bold gap-2">
                <Download className="h-4 w-4" /> Unduh Berkas
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-5 space-y-3">
              <h4 className="text-sm font-bold text-foreground">Pengajar Materi</h4>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{materi.pengajarNama.slice(0, 2).toUpperCase()}</div>
                <div>
                  <p className="text-xs font-bold text-foreground">{materi.pengajarNama}</p>
                  <p className="text-[11px] text-muted-foreground">Tutor Helped By Dinda</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
