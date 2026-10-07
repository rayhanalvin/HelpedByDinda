"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, FileText, PlayCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-fetch";

type MateriCard = {
  id: string;
  judul: string;
  deskripsi: string;
  mataPelajaran: string;
  kelasLabel: string;
  pengajarNama: string;
  tipe?: string;
  thumbnailUrl?: string;
  durasiMenit?: number | null;
};

export default function MuridMateriPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const [materiList, setMateriList] = React.useState<MateriCard[]>([]);

  React.useEffect(() => {
    let mounted = true;
    apiFetch("/api/materi")
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok || !res.ok) throw new Error(res.message || "Akses materi ditolak.");
        return res;
      })
      .then((res) => {
        if (!mounted) return;
        setMateriList(res.data);
      })
      .catch((error) => {
        if (mounted) toast(error instanceof Error ? error.message : "Gagal memuat materi atau akses ditolak.", "error");
      });
    return () => {
      mounted = false;
    };
  }, [toast]);

  const filteredMateri = materiList.filter((m) => {
    const matchSearch = m.judul.toLowerCase().includes(searchQuery.toLowerCase()) || m.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Materi Pembelajaran</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Akses rekaman video penjelasan Bunny Stream dan unduh modul latihan PDF terstruktur.</p>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:max-w-md">
        <Input placeholder="Cari judul materi atau topik..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Grid Materi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMateri.map((materi) => (
          <Card key={materi.id} className="overflow-hidden hover:shadow-lg transition-all border-border flex flex-col justify-between group">
            <div>
              {/* Thumbnail with overlay icon */}
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                <img src={materi.thumbnailUrl} alt={materi.judul} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  {materi.tipe === "video" ? (
                    <PlayCircle className="h-12 w-12 text-white/90 drop-shadow-md group-hover:scale-110 transition-transform" />
                  ) : (
                    <FileText className="h-12 w-12 text-white/90 drop-shadow-md group-hover:scale-110 transition-transform" />
                  )}
                </div>

                <div className="absolute top-3 left-3 flex gap-1.5">
                  <Badge variant={materi.tipe === "video" ? "default" : "secondary"} className="text-[10px] font-bold">
                    {materi.tipe === "video" ? "VIDEO STREAM" : "MODUL PDF"}
                  </Badge>
                </div>

                {materi.durasiMenit && <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-xs">{materi.durasiMenit} Menit</span>}
              </div>

              <CardContent className="p-5 space-y-2.5">
                <Badge variant="outline" className="text-[10px]">
                  {materi.kelasLabel}
                </Badge>

                <h3 className="text-base font-bold text-foreground line-clamp-2 leading-snug">{materi.judul}</h3>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{materi.deskripsi}</p>
              </CardContent>
            </div>

            <div className="p-5 pt-0 border-t border-border mt-3 flex items-center justify-between">
              <div className="text-[11px] text-muted-foreground">
                Tutor: <span className="font-semibold text-foreground">{materi.pengajarNama}</span>
              </div>
              <Link href={`/murid/materi/${materi.id}`}>
                <Button variant="outline" size="sm" className="font-semibold text-xs gap-1">
                  Buka Materi
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {filteredMateri.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-3xl p-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-foreground">Tidak Ada Materi Ditemukan</h3>
          <p className="text-xs text-muted-foreground mt-1">Coba gunakan kata kunci pencarian atau filter mapel lain.</p>
        </div>
      )}
    </div>
  );
}
