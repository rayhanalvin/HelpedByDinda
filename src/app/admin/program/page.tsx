"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

type Program = {
  id: string;
  code: string;
  category: string;
  title: string;
  target: string;
  price: number;
  description: string;
  subjects: string[];
  facilities: string[];
  popular: boolean;
  isPublished: boolean;
};

const emptyForm = { code: "", category: "SMA", title: "", target: "", price: 0, description: "", subjects: "", facilities: "", popular: false, isPublished: true };

export default function AdminProgramPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Program[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const result = await apiFetch<{ ok: boolean; data: Program[] }>("/api/admin/program");
      setItems(result.data || []);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memuat program.", "error");
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (item: Program) => {
    setEditingId(item.id);
    setForm({ ...item, subjects: item.subjects.join("\n"), facilities: item.facilities.join("\n") });
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { ...form, subjects: form.subjects.split("\n").map((item) => item.trim()).filter(Boolean), facilities: form.facilities.split("\n").map((item) => item.trim()).filter(Boolean) };
    try {
      const result = await apiFetch<{ ok: boolean; data: Program }>(editingId ? `/api/admin/program/${editingId}` : "/api/admin/program", { method: editingId ? "PUT" : "POST", body: JSON.stringify(payload) });
      setItems((current) => (editingId ? current.map((item) => (item.id === editingId ? result.data : item)) : [result.data, ...current]));
      setOpen(false);
      toast("Program belajar berhasil disimpan dan dipublikasikan.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan program.", "error");
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Hapus program ini dari katalog publik?")) return;
    try {
      await apiFetch(`/api/admin/program/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== id));
      toast("Program berhasil dihapus.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menghapus program.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Kelola Program Belajar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Perubahan program langsung tersinkron ke katalog publik dan pendaftaran murid.</p>
        </div>
        <Button variant="accent" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah Program</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader><CardTitle className="flex items-start justify-between gap-2"><span>{item.title}</span><span className="text-sm text-primary">{item.category}</span></CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{item.description}</p>
              <p className="font-bold">{formatRupiah(item.price)} / bulan</p>
              <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /> Edit</Button><Button variant="ghost" size="sm" className="text-rose-600" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4" /> Hapus</Button></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Modal isOpen={open} onClose={() => setOpen(false)} title={editingId ? "Edit Program" : "Tambah Program"} description="Program akan tersedia di halaman publik setelah disimpan.">
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3"><Input required placeholder="Kode unik, contoh: sma" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /><Input required placeholder="Kategori, contoh: SMA" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <Input required placeholder="Judul program" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Target peserta" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
          <Input required type="number" min="0" placeholder="Harga per bulan" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <textarea required rows={3} placeholder="Deskripsi program" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-input bg-card p-3 text-sm" />
          <textarea rows={3} placeholder="Mata pelajaran, satu per baris" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} className="w-full rounded-xl border border-input bg-card p-3 text-sm" />
          <textarea rows={3} placeholder="Fasilitas, satu per baris" value={form.facilities} onChange={(e) => setForm({ ...form, facilities: e.target.value })} className="w-full rounded-xl border border-input bg-card p-3 text-sm" />
          <div className="flex items-center gap-4 text-sm"><label><input type="checkbox" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} /> Rekomendasi</label><label><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Publik</label></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button type="submit" variant="accent">Simpan</Button></div>
        </form>
      </Modal>
    </div>
  );
}
