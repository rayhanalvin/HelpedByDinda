"use client";

import * as React from "react";
import Link from "next/link";
import { FolderKanban, Plus, Video, FileText, Eye, Trash2, CheckCircle, Clock, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { DUMMY_PENGAJAR } from "@/lib/dummy-data";
import { apiFetch } from "@/lib/api-fetch";

type MateriItem = {
  id: string;
  judul: string;
  deskripsi: string;
  mataPelajaran: string;
  kelasLabel: string;
  pengajarNama: string;
  isPublished: boolean;
  thumbnailUrl?: string | null;
  durasiMenit?: number | null;
  bunnyVideoId?: string | null;
};

export default function PengajarMateriPage() {
  const { toast } = useToast();
  const currentPengajar = DUMMY_PENGAJAR[0]; // Budi Santoso

  const [materiList, setMateriList] = React.useState<MateriItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    apiFetch("/api/materi")
      .then((r) => r.json())
      .then((res) => {
        if (!mounted) return;
        if (res.ok) setMateriList(res.data);
      })
      .catch(() => toast("Gagal mengambil daftar materi.", "error"));
    return () => {
      mounted = false;
    };
  }, [toast]);

  const handleTogglePublish = async (id: string) => {
    try {
      const item = materiList.find((m) => m.id === id);
      if (!item) return;
      const res = await apiFetch(`/api/materi/${id}`, { method: "PATCH", body: JSON.stringify({ isPublished: !item.isPublished }), headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "error");
      setMateriList((prev) => prev.map((m) => (m.id === id ? { ...m, isPublished: !m.isPublished } : m)));
      toast(`Materi "${item.judul}" status diperbarui.`, "success");
    } catch (err) {
      toast("Gagal memperbarui status publikasi.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus materi ini?")) return;
    try {
      const res = await apiFetch(`/api/materi/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "error");
      setMateriList((prev) => prev.filter((m) => m.id !== id));
      toast("Materi berhasil dihapus.", "info");
    } catch (err) {
      toast("Gagal menghapus materi.", "error");
    }
  };

  const filteredMateri = materiList.filter((m) => m.judul.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Kelola Materi Pembelajaran</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Unggah video penjelasan Bunny Stream dan modul latihan PDF untuk murid bimbingan Anda.</p>
        </div>

        <Link href="/pengajar/materi/baru">
          <Button variant="accent" className="font-bold gap-2">
            <Plus className="h-4 w-4" /> Unggah Materi Baru
          </Button>
        </Link>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Input placeholder="Cari materi yang Anda unggah..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      {/* Materi List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMateri.map((materi) => (
          <Card key={materi.id} className="border-border overflow-hidden hover:shadow-md transition-all">
            <div className="relative aspect-video w-full bg-muted">
              <img src={materi.thumbnailUrl ?? ""} alt={materi.judul} className="h-full w-full object-cover" />
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge variant={materi.bunnyVideoId ? "default" : "secondary"}>{materi.bunnyVideoId ? "VIDEO" : "PDF"}</Badge>
                <Badge variant={materi.isPublished ? "success" : "warning"}>{materi.isPublished ? "DITERBITKAN" : "DRAFT"}</Badge>
              </div>
              {materi.durasiMenit && <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white">{materi.durasiMenit} Menit</span>}
            </div>

            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary">{materi.mataPelajaran}</span>
                <span className="text-xs text-muted-foreground">Sasaran: {materi.kelasLabel}</span>
              </div>

              <h3 className="text-base font-bold text-foreground line-clamp-1">{materi.judul}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{materi.deskripsi}</p>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <button type="button" onClick={() => handleTogglePublish(materi.id)} className="text-xs font-semibold text-primary hover:underline">
                  {materi.isPublished ? "Tarik ke Draft" : "Terbitkan ke Murid"}
                </button>

                <div className="flex items-center gap-1">
                  <Link href={`/murid/materi/${materi.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                      <Eye className="h-3.5 w-3.5 mr-1" /> Pratinjau
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(materi.id)} className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredMateri.length === 0 && (
          <div className="col-span-full text-center py-16 border border-dashed border-border rounded-3xl p-8">
            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-bold text-foreground">Belum Ada Materi</h3>
            <p className="text-xs text-muted-foreground mt-1">Mulai unggah modul atau video bimbingan pertamamu sekarang.</p>
          </div>
        )}
      </div>
    </div>
  );
}
