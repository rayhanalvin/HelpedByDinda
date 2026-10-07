"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Play, Pause, Volume2, Maximize, Download, FileText, Clock, User, CheckCircle2, Share2, Sparkles } from "lucide-react";
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
    durasiMenit?: number | null;
    isPublished: boolean;
  } | null;

  const [materi, setMateri] = React.useState<Detail>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

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

  const handleDownloadPdf = () => {
    toast(`Mengunduh modul: ${materi.judul}.pdf`, "success");
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
              <Badge variant="default" className="text-xs">
                {materi.mataPelajaran}
              </Badge>
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

      {/* Bunny Stream Video Player Area */}
      <div className="rounded-3xl overflow-hidden border border-border bg-black shadow-2xl relative">
        <div className="relative aspect-video w-full flex items-center justify-center bg-zinc-950">
          <img src={materi.thumbnailUrl ?? ""} alt={materi.judul} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? "opacity-30" : "opacity-75"}`} />

          {/* Overlay play button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-primary/90 text-white shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            aria-label={isPlaying ? "Jeda" : "Putar"}
          >
            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
          </button>

          {/* Bunny Stream CDN watermark / info */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-xl bg-black/60 backdrop-blur-md px-3 py-1.5 text-xs text-white border border-white/10">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Bunny Stream CDN • HD 1080p</span>
          </div>

          {/* Player controls bottom bar */}
          <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/90 via-black/50 to-transparent p-4 flex flex-col gap-2 z-10 text-white">
            {/* Progress line */}
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden cursor-pointer">
              <div className="bg-primary h-full transition-all duration-300" style={{ width: isPlaying ? "45%" : "0%" }} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-primary transition-colors">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <div className="flex items-center gap-1.5">
                  <Volume2 className="h-4 w-4" />
                  <span className="text-[11px] text-white/80">08:12 / {materi.durasiMenit || 18}:00</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white/15 text-[10px] font-bold">1.0x</span>
                <Maximize className="h-4 w-4 cursor-pointer hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        </div>
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
                  <p className="text-xs font-bold text-foreground truncate">{materi.judul}.pdf</p>
                  <p className="text-[11px] text-muted-foreground">Modul & Bank Soal (2.4 MB)</p>
                </div>
              </div>

              <Button variant="accent" onClick={handleDownloadPdf} className="w-full text-xs font-bold gap-2">
                <Download className="h-4 w-4" /> Unduh Modul PDF
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
                  <p className="text-[11px] text-muted-foreground">Tutor {materi.mataPelajaran}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
