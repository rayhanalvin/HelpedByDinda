"use client";

import * as React from "react";
import { Plus, Search, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { PORTAL_CATEGORIES } from "@/lib/portal-categories";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Image as ImageIcon, Heading1, Heading2, Quote, List, Bold, SeparatorHorizontal } from "lucide-react";

type BeritaRow = {
  id: string;
  judul: string;
  slug: string;
  ringkasan: string | null;
  isi: string;
  thumbnailUrl: string | null;
  kategori: string;
  authorName: string;
  isPublished: boolean;
  createdAt: string;
};

type PortalRow = {
  id: string;
  kategori: string;
  slug: string;
  judul: string;
  ringkasan: string | null;
  isi: string;
  imageUrl: string | null;
  isPublished: boolean;
  urutan: number;
};

const defaultForm = {
  judul: "",
  slug: "",
  ringkasan: "",
  isi: "",
  thumbnailUrl: "",
  kategori: "Umum",
  authorName: "Helped By Dinda",
  isPublished: true,
};

const defaultPortalForm: {
  kategori: string;
  judul: string;
  slug: string;
  ringkasan: string;
  isi: string;
  imageUrl: string;
  isPublished: boolean;
  urutan: number;
} = {
  kategori: PORTAL_CATEGORIES[0],
  judul: "",
  slug: "",
  ringkasan: "",
  isi: "",
  imageUrl: "",
  isPublished: true,
  urutan: 0,
};

export default function AdminBeritaPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<BeritaRow[]>([]);
  const [portalItems, setPortalItems] = React.useState<PortalRow[]>([]);
  const [query, setQuery] = React.useState("");
  const [activeSection, setActiveSection] = React.useState<"berita" | "portal">("berita");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingPortalId, setEditingPortalId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState(defaultForm);
  const [portalFormData, setPortalFormData] = React.useState(defaultPortalForm);

  const loadData = React.useCallback(async () => {
    try {
      const result = await apiFetch<{ ok: boolean; data: BeritaRow[] }>("/api/admin/berita");
      setItems(result.data || []);
      const portalResult = await apiFetch<{ ok: boolean; data: PortalRow[] }>("/api/admin/portal");
      setPortalItems(portalResult.data || []);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memuat berita.", "error");
    }
  }, [toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const openAdd = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setIsModalOpen(true);
  };

  const openAddPortal = () => {
    setEditingPortalId(null);
    setPortalFormData(defaultPortalForm);
    setIsModalOpen(true);
  };

  const openEdit = (item: BeritaRow) => {
    setEditingId(item.id);
    setFormData({
      judul: item.judul,
      slug: item.slug,
      ringkasan: item.ringkasan || "",
      isi: item.isi,
      thumbnailUrl: item.thumbnailUrl || "",
      kategori: item.kategori,
      authorName: item.authorName,
      isPublished: item.isPublished,
    });
    setIsModalOpen(true);
  };

  const openEditPortal = (item: PortalRow) => {
    setEditingPortalId(item.id);
    setPortalFormData({
      kategori: item.kategori,
      judul: item.judul,
      slug: item.slug,
      ringkasan: item.ringkasan || "",
      isi: item.isi,
      imageUrl: item.imageUrl || "",
      isPublished: item.isPublished,
      urutan: item.urutan,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (activeSection === "portal") {
        if (editingPortalId) {
          const result = await apiFetch<{ ok: boolean; data: PortalRow }>(`/api/admin/portal/${editingPortalId}`, {
            method: "PUT",
            body: JSON.stringify(portalFormData),
          });
          setPortalItems((current) => current.map((item) => (item.id === editingPortalId ? result.data : item)));
          toast("Konten portal berhasil diperbarui.", "success");
        } else {
          const result = await apiFetch<{ ok: boolean; data: PortalRow }>("/api/admin/portal", {
            method: "POST",
            body: JSON.stringify(portalFormData),
          });
          setPortalItems((current) => [result.data, ...current]);
          toast("Konten portal berhasil ditambahkan.", "success");
        }
        setIsModalOpen(false);
        return;
      }

      if (editingId) {
        const result = await apiFetch<{ ok: boolean; data: BeritaRow }>(`/api/admin/berita/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        setItems((current) => current.map((item) => (item.id === editingId ? result.data : item)));
        toast("Berita berhasil diperbarui.", "success");
      } else {
        const result = await apiFetch<{ ok: boolean; data: BeritaRow }>("/api/admin/berita", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        setItems((current) => [result.data, ...current]);
        toast("Berita baru berhasil dibuat.", "success");
      }

      setIsModalOpen(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan berita.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus berita ini dari halaman publik?")) return;

    try {
      await apiFetch(`/api/admin/berita/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== id));
      toast("Berita berhasil dihapus.", "info");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menghapus berita.", "error");
    }
  };

  const handleDeletePortal = async (id: string) => {
    if (!confirm("Hapus konten portal ini dari halaman publik?")) return;

    try {
      await apiFetch(`/api/admin/portal/${id}`, { method: "DELETE" });
      setPortalItems((current) => current.filter((item) => item.id !== id));
      toast("Konten portal berhasil dihapus.", "info");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menghapus konten portal.", "error");
    }
  };

  const filtered = items.filter((item) => item.judul.toLowerCase().includes(query.toLowerCase()) || item.kategori.toLowerCase().includes(query.toLowerCase()) || item.authorName.toLowerCase().includes(query.toLowerCase()));

  const filteredPortal = portalItems.filter((item) => item.judul.toLowerCase().includes(query.toLowerCase()) || item.kategori.toLowerCase().includes(query.toLowerCase()) || item.slug.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Konten Publik</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">Kelola Berita</h1>
        </div>
        <Button onClick={activeSection === "berita" ? openAdd : openAddPortal} variant="accent" className="font-bold gap-2">
          <Plus className="h-4 w-4" /> {activeSection === "berita" ? "Tambah Berita" : "Tambah Konten Portal"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2">
        <button
          type="button"
          onClick={() => {
            setActiveSection("berita");
            setQuery("");
          }}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeSection === "berita" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}
        >
          Portal Berita
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSection("portal");
            setQuery("");
          }}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeSection === "portal" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}
        >
          Halaman Portal Publik
        </button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={activeSection === "berita" ? "Cari judul, kategori, atau penulis..." : "Cari kategori, judul, atau slug..."} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {activeSection === "berita" &&
          filtered.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-18 w-24 overflow-hidden rounded-xl border border-border bg-linear-to-br from-primary/10 via-accent/10 to-secondary">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.judul} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-primary uppercase">{item.kategori}</div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-foreground">{item.judul}</h2>
                        <Badge variant={item.isPublished ? "success" : "secondary"}>{item.isPublished ? "Dipublikasikan" : "Draft"}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.authorName} • {item.kategori}
                      </p>
                      <p className="mt-2 max-w-2xl text-sm text-muted-foreground line-clamp-2">{item.ringkasan || item.isi.slice(0, 160)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)} className="gap-2">
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const result = await apiFetch<{ ok: boolean; data: BeritaRow }>(`/api/admin/berita/${item.id}`, {
                            method: "PUT",
                            body: JSON.stringify({ ...item, isPublished: !item.isPublished, slug: item.slug }),
                          });
                          setItems((current) => current.map((entry) => (entry.id === item.id ? result.data : entry)));
                          toast(`Berita ${result.data.isPublished ? "dipublikasikan" : "disimpan sebagai draft"}.`, "success");
                        } catch (error) {
                          toast(error instanceof Error ? error.message : "Gagal mengubah status publikasi.", "error");
                        }
                      }}
                      className="gap-2"
                    >
                      {item.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {item.isPublished ? "Draft" : "Publish"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                      <Trash2 className="h-4 w-4" /> Hapus
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

        {activeSection === "portal" &&
          filteredPortal.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="default">{item.kategori}</Badge>
                      <Badge variant={item.isPublished ? "success" : "secondary"}>{item.isPublished ? "Dipublikasikan" : "Draft"}</Badge>
                    </div>
                    <h2 className="mt-2 text-lg font-bold text-foreground">{item.judul}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      /{item.slug} • Urutan {item.urutan}
                    </p>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground line-clamp-2">{item.ringkasan || item.isi}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditPortal(item)} className="gap-2">
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const result = await apiFetch<{ ok: boolean; data: PortalRow }>(`/api/admin/portal/${item.id}`, {
                            method: "PUT",
                            body: JSON.stringify({ ...item, isPublished: !item.isPublished }),
                          });
                          setPortalItems((current) => current.map((entry) => (entry.id === item.id ? result.data : entry)));
                          toast(`Konten portal ${result.data.isPublished ? "dipublikasikan" : "disimpan sebagai draft"}.`, "success");
                        } catch (error) {
                          toast(error instanceof Error ? error.message : "Gagal mengubah status portal.", "error");
                        }
                      }}
                      className="gap-2"
                    >
                      {item.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {item.isPublished ? "Draft" : "Publish"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeletePortal(item.id)} className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                      <Trash2 className="h-4 w-4" /> Hapus
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

        {((activeSection === "berita" && filtered.length === 0) || (activeSection === "portal" && filteredPortal.length === 0)) && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">Belum ada berita yang cocok dengan pencarian.</CardContent>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeSection === "portal" ? (editingPortalId ? "Edit Halaman Portal" : "Tambah Halaman Portal") : editingId ? "Edit Berita Publik" : "Tambah Berita Baru"}
        description="Konten ini akan tersinkronisasi ke portal publik website Helped By Dinda."
      >
        {activeSection === "portal" ? (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Special Instructions for login/register banner overrides */}
            {(portalFormData.slug === "login-banner" || portalFormData.slug === "register-banner") && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary space-y-1">
                <p className="font-bold">Tips Kustomisasi Banner {portalFormData.slug === "login-banner" ? "Login" : "Register"}:</p>
                <ul className="list-disc pl-4 space-y-0.5 font-medium">
                  <li>
                    <strong>Judul Halaman:</strong> Kutipan/tagline utama banner (contoh: &ldquo;Bimbingan Belajar Modern dan Terarah&rdquo;).
                  </li>
                  <li>
                    <strong>URL Gambar:</strong> Ganti foto profil pendiri (misal isi <code>/helpedd.jpeg</code> atau path eksternal).
                  </li>
                  <li>
                    <strong>Ringkasan:</strong> Tulis dengan format: <code>[Nama]||[Jabatan]||[Sub-Judul Label]</code> (contoh: <code>Dinda Rizky Febriyanti, S.A.B.||Founder & Academic Director||Bimbingan Belajar Modern dan Terarah</code>).
                  </li>
                  <li>
                    <strong>Isi Konten:</strong> Berisi poin keyakinan/checklist dipisahkan berdasarkan baris baru (Enter).
                  </li>
                </ul>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Kategori Portal</label>
              <select
                className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground"
                value={portalFormData.kategori}
                onChange={(e) => setPortalFormData({ ...portalFormData, kategori: e.target.value })}
              >
                {PORTAL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Judul Halaman</label>
              <Input required value={portalFormData.judul} onChange={(e) => setPortalFormData({ ...portalFormData, judul: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Slug URL</label>
              <Input value={portalFormData.slug} onChange={(e) => setPortalFormData({ ...portalFormData, slug: e.target.value })} placeholder="contoh: beranda" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Ringkasan</label>
              <Input value={portalFormData.ringkasan} onChange={(e) => setPortalFormData({ ...portalFormData, ringkasan: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Isi Konten</label>
              <textarea
                required
                rows={8}
                value={portalFormData.isi}
                onChange={(e) => setPortalFormData({ ...portalFormData, isi: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ImageUploader
                label="Gambar Halaman"
                value={portalFormData.imageUrl}
                onChange={(url) => setPortalFormData({ ...portalFormData, imageUrl: url })}
                placeholder="Upload atau tempel URL gambar"
                compact
              />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Urutan</label>
                <Input type="number" value={portalFormData.urutan} onChange={(e) => setPortalFormData({ ...portalFormData, urutan: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2">
              <span className="text-sm font-medium text-foreground">Status publikasi</span>
              <button
                type="button"
                onClick={() => setPortalFormData({ ...portalFormData, isPublished: !portalFormData.isPublished })}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${portalFormData.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-muted text-foreground"}`}
              >
                {portalFormData.isPublished ? "Dipublikasikan" : "Draft"}
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="accent">
                {editingPortalId ? "Simpan Perubahan" : "Buat Konten"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Judul Berita</label>
              <Input required value={formData.judul} onChange={(e) => setFormData({ ...formData, judul: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Slug URL</label>
              <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="opsional; akan dibuat otomatis" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Ringkasan</label>
              <Input value={formData.ringkasan} onChange={(e) => setFormData({ ...formData, ringkasan: e.target.value })} placeholder="Ringkasan singkat untuk preview" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Kategori</label>
              <Input value={formData.kategori} onChange={(e) => setFormData({ ...formData, kategori: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Penulis / Author</label>
              <Input value={formData.authorName} onChange={(e) => setFormData({ ...formData, authorName: e.target.value })} />
            </div>

            <ImageUploader
              label="Thumbnail Berita"
              value={formData.thumbnailUrl}
              onChange={(url) => setFormData({ ...formData, thumbnailUrl: url })}
              placeholder="Tempel URL gambar atau unggah dari perangkat"
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Isi Berita</label>
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 px-2 py-1.5">
                  <button
                    type="button"
                    title="Sisipkan Heading 1"
                    onClick={() => setFormData({ ...formData, isi: `${formData.isi}\n## Judul Bagian` })}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Heading1 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Sisipkan Heading 2"
                    onClick={() => setFormData({ ...formData, isi: `${formData.isi}\n### Sub Judul` })}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Heading2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Sisipkan kutipan"
                    onClick={() => setFormData({ ...formData, isi: `${formData.isi}\n> Kutipan penting` })}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Quote className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Tambahkan gambar"
                    onClick={() => {
                      const url = window.prompt("Tempel URL gambar (atau unggah dulu melalui Thumbnail di atas):");
                      if (url && url.trim()) {
                        setFormData({ ...formData, isi: `${formData.isi}\n![Gambar](${url.trim()})` });
                      }
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>
                  <span className="mx-1 h-4 w-px bg-border" />
                  <span className="text-[10px] text-muted-foreground">Baris baru = paragraf baru</span>
                </div>
                <textarea
                  required
                  rows={10}
                  value={formData.isi}
                  onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                  placeholder={"Tulis isi berita di sini...\n\n## Judul Bagian\n\nTulis paragraf di baris sendiri.\n\n![Gambar](url-gambar) untuk menyisipkan gambar."}
                  className="w-full bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2">
              <span className="text-sm font-medium text-foreground">Status publikasi</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${formData.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-muted text-foreground"}`}
              >
                {formData.isPublished ? "Dipublikasikan" : "Draft"}
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="accent">
                {editingId ? "Simpan Perubahan" : "Buat Berita"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </main>
  );
}
