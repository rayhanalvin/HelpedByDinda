"use client";

import * as React from "react";
import { CalendarDays, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { DUMMY_KATALOG_UJIAN, KatalogUjian } from "@/lib/dummy-data";

export default function AdminKatalogUjianPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<KatalogUjian[]>(DUMMY_KATALOG_UJIAN);
  const remove = (id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
    toast("Ujian dihapus dari katalog.", "info");
  };
  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Informasi akademik</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold">Katalog Pengingat Ujian</h1>
          <p className="mt-2 text-muted-foreground">Atur agenda ujian dan pengingat untuk kelas sasaran.</p>
        </div>
        <Button variant="accent">
          <Plus size={17} /> Tambah ujian
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="secondary">{item.kelasSasaran}</Badge>
                  <h2 className="mt-3 font-heading text-lg font-bold">{item.namaUjian}</h2>
                  <p className="text-sm text-muted-foreground">
                    {item.mataPelajaran} · PIC {item.pengajarPic}
                  </p>
                </div>
                <Badge variant={item.isPublished ? "success" : "warning"}>{item.isPublished ? "Terbit" : "Draft"}</Badge>
              </div>
              <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-primary" /> {item.tanggal} pukul {item.jam} WIB
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" /> {item.lokasi}
                </span>
              </div>
              <p className="mt-4 text-sm">{item.deskripsi}</p>
              <div className="mt-5 flex justify-end gap-2 border-t pt-4">
                <Button size="sm" variant="outline">
                  <Pencil size={14} /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => remove(item.id)}>
                  <Trash2 size={14} /> Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
