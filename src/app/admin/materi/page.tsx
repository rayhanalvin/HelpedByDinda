"use client";

import * as React from "react";
import { Check, FileText, Search, Video, X, Plus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-fetch";

type Item = {
  id: string;
  judul: string;
  deskripsi: string;
  mataPelajaran: string;
  kelasLabel: string;
  pengajarNama: string;
  isPublished: boolean;
  bunnyVideoId?: string | null;
  fileUrl?: string | null;
};

export default function AdminMateriPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Item[]>([]);
  const [query, setQuery] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ judul: "", deskripsi: "", mataPelajaran: "Umum", kelasSasaran: "SMA", pengajarId: "" });
  const [teachers, setTeachers] = React.useState<Array<{ id: string; name: string }>>([]);
  React.useEffect(() => {
    let mounted = true;
    apiFetch("/api/materi")
      .then((r) => r.json())
      .then((res) => {
        if (!mounted) return;
        if (res.ok) setItems(res.data);
      })
      .catch(() => toast("Gagal mengambil daftar materi.", "error"));
    return () => {
      mounted = false;
    };
  }, [toast]);

  React.useEffect(() => {
    apiFetch("/api/admin/pengajar")
      .then((response) => response.json())
      .then((result) => {
        if (result.ok) setTeachers(result.data || []);
      })
      .catch(() => undefined);
  }, []);

  // Admin can delete or edit materials; publish action remains gated to admin only in API
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus materi ini?")) return;
    try {
      const res = await apiFetch(`/api/materi/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "error");
      setItems((cur) => cur.filter((it) => it.id !== id));
      toast("Materi berhasil dihapus.", "success");
    } catch (err) {
      toast("Gagal menghapus materi.", "error");
    }
  };

  const filtered = items.filter((item) => item.judul.toLowerCase().includes(query.toLowerCase()) || item.pengajarNama.toLowerCase().includes(query.toLowerCase()));

  const togglePublish = async (id: string, publish: boolean) => {
    try {
      const res = await apiFetch("/api/materi", { method: "PATCH", body: JSON.stringify({ id, isPublished: publish }), headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "error");
      setItems((cur) => cur.map((it) => (it.id === id ? { ...it, isPublished: publish } : it)));
      toast("Status publikasi materi diperbarui.", "success");
    } catch (err) {
      toast("Gagal memperbarui status publikasi.", "error");
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ judul: "", deskripsi: "", mataPelajaran: "Umum", kelasSasaran: "SMA", pengajarId: "" });
    setFormOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingId(item.id);
    setForm({ judul: item.judul, deskripsi: item.deskripsi || "", mataPelajaran: item.mataPelajaran, kelasSasaran: item.kelasLabel, pengajarId: "" });
    setFormOpen(true);
  };

  const saveMaterial = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await apiFetch(editingId ? "/api/materi" : "/api/materi", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editingId, isPublished: false }),
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.message || "Gagal menyimpan materi.");
      if (editingId) setItems((current) => current.map((item) => (item.id === editingId ? result.data : item)));
      else setItems((current) => [result.data, ...current]);
      setFormOpen(false);
      toast("Materi berhasil disimpan sebagai draft.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan materi.", "error");
    }
  };

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Moderasi konten</p>
        <h1 className="mt-1 font-heading text-3xl font-extrabold">Kelola Materi</h1>
        <p className="mt-2 text-muted-foreground">Admin dapat menambah, mengedit, menghapus, dan mempublikasikan materi.</p>
        <Button className="mt-4" variant="accent" onClick={openCreate}>
          <Plus size={16} /> Tambah Materi
        </Button>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Cari judul atau pengajar..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">{item.bunnyVideoId ? <Video size={19} /> : <FileText size={19} />}</div>
                  <div>
                    <h2 className="font-heading font-bold">{item.judul}</h2>
                    <p className="text-sm text-muted-foreground">
                      {item.mataPelajaran} · {item.kelasLabel}
                    </p>
                  </div>
                </div>
                <Badge variant={item.isPublished ? "success" : "warning"}>{item.isPublished ? "Terbit" : "Review"}</Badge>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{item.deskripsi}</p>
              <div className="mt-5 flex items-center justify-between border-t pt-4">
                <span className="text-xs text-muted-foreground">Oleh {item.pengajarNama}</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                    <Pencil size={15} /> Edit
                  </Button>
                  <Button size="sm" variant={"outline"} onClick={() => togglePublish(item.id, !item.isPublished)}>
                    {item.isPublished ? (
                      <>
                        <X size={15} /> Unpublish
                      </>
                    ) : (
                      <>
                        <Check size={15} /> Publish
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                    <X size={15} /> Hapus
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {formOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form onSubmit={saveMaterial} className="w-full max-w-lg space-y-4 rounded-2xl bg-card p-6 shadow-xl">
            <h2 className="text-xl font-bold">{editingId ? "Edit Materi" : "Tambah Materi"}</h2>
            <Input required placeholder="Judul materi" value={form.judul} onChange={(event) => setForm({ ...form, judul: event.target.value })} />
            <textarea required className="min-h-24 w-full rounded-xl border border-input bg-card p-3 text-sm" placeholder="Deskripsi" value={form.deskripsi} onChange={(event) => setForm({ ...form, deskripsi: event.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Mata pelajaran" value={form.mataPelajaran} onChange={(event) => setForm({ ...form, mataPelajaran: event.target.value })} />
              <select className="rounded-xl border border-input bg-card px-3 text-sm" value={form.kelasSasaran} onChange={(event) => setForm({ ...form, kelasSasaran: event.target.value })}>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="UTBK">UTBK</option>
              </select>
            </div>
            {!editingId && (
              <select required className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm" value={form.pengajarId} onChange={(event) => setForm({ ...form, pengajarId: event.target.value })}>
                <option value="">Pilih pengajar</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="accent">
                Simpan Draft
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
