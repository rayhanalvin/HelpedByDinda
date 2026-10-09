"use client";

import * as React from "react";
import { CalendarDays, MapPin, Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";

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

const KELAS_OPTIONS = ["SD", "SMP", "SMA", "UTBK"] as const;

const emptyForm = {
  namaUjian: "",
  mataPelajaran: "",
  kelasSasaran: "SMA" as UjianItem["kelasSasaran"],
  tanggal: "",
  jam: "16:00",
  deskripsi: "",
  lokasi: "",
  pengajarNama: "",
  isPublished: false,
};

export default function PengajarKatalogUjianPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<UjianItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [myPIC, setMyPIC] = React.useState<string | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);

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
          const list = response.data.sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jam.localeCompare(b.jam));
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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (item: UjianItem) => {
    setEditingId(item.id);
    setForm({
      namaUjian: item.namaUjian,
      mataPelajaran: item.mataPelajaran,
      kelasSasaran: item.kelasSasaran,
      tanggal: item.tanggal.slice(0, 10),
      jam: item.jam,
      deskripsi: item.deskripsi,
      lokasi: item.lokasi,
      pengajarNama: item.pengajarNama,
      isPublished: item.isPublished,
    });
    setFormOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await apiFetch<{ ok: boolean; message?: string; data?: UjianItem }>(editingId ? `/api/ujian/${editingId}` : "/api/ujian", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error(response.message || "Gagal menyimpan ujian.");
      if (editingId && response.data) {
        setItems((cur) => cur.map((item) => (item.id === editingId ? response.data! : item)));
      } else if (response.data) {
        setItems((cur) => [response.data!, ...cur]);
      }
      setFormOpen(false);
      toast(editingId ? "Ujian berhasil diperbarui." : "Ujian berhasil ditambahkan.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan ujian.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus ujian ini?")) return;
    try {
      const response = await apiFetch<{ ok: boolean; message?: string }>(`/api/ujian/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(response.message || "Gagal menghapus ujian.");
      setItems((cur) => cur.filter((item) => item.id !== id));
      toast("Ujian berhasil dihapus.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menghapus ujian.", "error");
    }
  };

  const togglePublish = async (item: UjianItem) => {
    try {
      const response = await apiFetch<{ ok: boolean; message?: string; data?: UjianItem }>(`/api/ujian/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaUjian: item.namaUjian,
          mataPelajaran: item.mataPelajaran,
          kelasSasaran: item.kelasSasaran,
          tanggal: item.tanggal,
          jam: item.jam,
          deskripsi: item.deskripsi,
          lokasi: item.lokasi,
          pengajarId: item.pengajarId || "",
          pengajarNama: item.pengajarNama,
          isPublished: !item.isPublished,
        }),
      });
      if (!response.ok) throw new Error(response.message || "Gagal memperbarui status.");
      if (response.data) setItems((cur) => cur.map((it) => (it.id === item.id ? response.data! : it)));
      toast("Status publikasi diperbarui.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memperbarui status.", "error");
    }
  };

  const otherItems = items.filter((u) => u.pengajarId !== myPIC);
  const myDraftItems = items.filter((u) => u.pengajarId === myPIC && !u.isPublished);
  const myPublishedItems = items.filter((u) => u.pengajarId === myPIC && u.isPublished);

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
        {item.pengajarId === myPIC && (
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button size="sm" variant="outline" onClick={() => togglePublish(item)}>
              {item.isPublished ? "Tarik dari terbit" : "Terbitkan"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
              <Pencil size={14} /> Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
              <Trash2 size={14} /> Hapus
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Informasi akademik</p>
        <h1 className="mt-1 font-heading text-3xl font-extrabold">Katalog Ujian</h1>
        <p className="mt-2 text-muted-foreground">Atur agenda ujian sendiri, edit, dan terbitkan langsung untuk muridmu.</p>
      </div>
      <div className="flex justify-end">
        <Button variant="accent" onClick={openCreate}>
          <Plus size={17} /> Tambah ujian
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat katalog ujian…
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Belum ada ujian. Klik “Tambah ujian” untuk membuat agenda baru.</CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {myDraftItems.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-heading text-lg font-bold">Ujian Draft Saya (Belum Terbit)</h2>
              <div className="grid gap-4 md:grid-cols-2">{myDraftItems.map(renderCard)}</div>
            </div>
          )}
          {myPublishedItems.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-heading text-lg font-bold">Ujian Terbit Saya</h2>
              <div className="grid gap-4 md:grid-cols-2">{myPublishedItems.map(renderCard)}</div>
            </div>
          )}
          {otherItems.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-heading text-lg font-bold">Agenda Ujian Lainnya</h2>
              <div className="grid gap-4 md:grid-cols-2">{otherItems.map(renderCard)}</div>
            </div>
          )}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={() => setFormOpen(false)}>
          <form onSubmit={handleSubmit} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg space-y-4 rounded-2xl bg-card p-6 shadow-xl">
            <h2 className="text-xl font-bold">{editingId ? "Edit Ujian" : "Tambah Ujian"}</h2>
            <Input required placeholder="Nama ujian (cth: Try Out UTBK #1)" value={form.namaUjian} onChange={(event) => setForm({ ...form, namaUjian: event.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input required placeholder="Mata pelajaran" value={form.mataPelajaran} onChange={(event) => setForm({ ...form, mataPelajaran: event.target.value })} />
              <select required className="rounded-xl border border-input bg-card px-3 py-2 text-sm" value={form.kelasSasaran} onChange={(event) => setForm({ ...form, kelasSasaran: event.target.value as UjianItem["kelasSasaran"] })}>
                {KELAS_OPTIONS.map((kelas) => (
                  <option key={kelas} value={kelas}>
                    {kelas}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input required type="date" value={form.tanggal} onChange={(event) => setForm({ ...form, tanggal: event.target.value })} />
              <Input required type="time" value={form.jam} onChange={(event) => setForm({ ...form, jam: event.target.value })} />
            </div>
            <Input placeholder="Lokasi (cth: Ruang 2 / Google Meet)" value={form.lokasi} onChange={(event) => setForm({ ...form, lokasi: event.target.value })} />
            <textarea required className="min-h-24 w-full rounded-xl border border-input bg-card p-3 text-sm" placeholder="Deskripsi ujian" value={form.deskripsi} onChange={(event) => setForm({ ...form, deskripsi: event.target.value })} />
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} className="size-4" />
              Terbitkan langsung (terlihat murid & pengajar)
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="accent" disabled={saving}>
                {saving ? "Menyimpan…" : editingId ? "Simpan Perubahan" : "Simpan Ujian"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
