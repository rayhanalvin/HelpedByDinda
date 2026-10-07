"use client";

import * as React from "react";
import { CalendarDays, MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { formatDateIndo } from "@/lib/utils";

interface UjianItem {
  id: string;
  namaUjian: string;
  mataPelajaran: string;
  kelasSasaran: "SD" | "SMP" | "SMA" | "UTBK";
  tanggal: string;
  jam: string;
  deskripsi: string;
  lokasi: string;
  pengajarId: string | null;
  pengajarNama: string;
  isPublished: boolean;
}

export default function PengajarKatalogUjianPage() {
  const [items, setItems] = React.useState<UjianItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [myPIC, setMyPIC] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const profile = await apiFetch<{ ok: boolean; user: { pengajar: { id: string } | null } }>("/api/profile");
        if (active && profile.user.pengajar?.id) setMyPIC(profile.user.pengajar.id);
      } catch {
        // profile feed unavailable
      }
      try {
        const response = await apiFetch<{ ok: boolean; data: UjianItem[] }>("/api/ujian");
        if (active && response.ok) {
          const list = response.data.filter((u) => u.isPublished).sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jam.localeCompare(b.jam));
          setItems(list);
        }
      } catch {
        // catalog feed unavailable
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const picItems = items.filter((u) => u.pengajarId === myPIC);
  const otherItems = items.filter((u) => u.pengajarId !== myPIC && !(myPIC && picItems.some((p) => p.id === u.id)));

  const renderCard = (item: UjianItem) => (
    <Card key={item.id}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="secondary">{item.kelasSasaran}</Badge>
            <h2 className="mt-3 font-heading text-lg font-bold">{item.namaUjian}</h2>
            <p className="text-sm text-muted-foreground">
              {item.mataPelajaran} · PIC {item.pengajarNama || "-"}
            </p>
          </div>
          <Badge variant={item.pengajarId === myPIC ? "success" : "default"}>
            {item.pengajarId === myPIC ? "Ujian Saya" : "Terbit"}
          </Badge>
        </div>
        <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <CalendarDays size={16} className="text-primary" /> {formatDateIndo(item.tanggal)} pukul {item.jam} WIB
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={16} className="text-primary" /> {item.lokasi}
          </span>
        </div>
        <p className="mt-4 text-sm">{item.deskripsi}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Informasi akademik</p>
        <h1 className="mt-1 font-heading text-3xl font-extrabold">Katalog Ujian</h1>
        <p className="mt-2 text-muted-foreground">Pantau agenda ujian yang terbit agar siap mengajar dan mengingatkan muridmu.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat katalog ujian…
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Belum ada ujian yang terbit. Admin akan menambahkan agenda ujian di sini.</CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {picItems.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-heading text-lg font-bold">Ujian yang Saya Pegang (PIC)</h2>
              <div className="grid gap-4 md:grid-cols-2">{picItems.map(renderCard)}</div>
            </div>
          )}
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-bold">Agenda Ujian Terbit Lainnya</h2>
            <div className="grid gap-4 md:grid-cols-2">{otherItems.map(renderCard)}</div>
          </div>
        </div>
      )}
    </div>
  );
}