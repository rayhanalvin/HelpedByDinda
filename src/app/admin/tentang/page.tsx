"use client";

import * as React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  Heart,
  Sparkles,
  Target,
  BookOpen,
  School,
  Calendar,
  Star,
  Award,
  TrendingUp,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { TENTANG_KATEGORI, TENTANG_IKON } from "@/lib/tentang-constants";

type SectionRow = {
  id: string;
  slug: string;
  kategori: string;
  judul: string;
  ringkasan: string | null;
  isi: string;
  imageUrl: string | null;
  isPublished: boolean;
  urutan: number;
};

type StatistikRow = {
  id: string;
  label: string;
  nilai: string;
  ikon: string;
  urutan: number;
};

const KATEGORI_LABEL = Object.fromEntries(TENTANG_KATEGORI.map((item) => [item.value, item.label]));

const emptySection = {
  kategori: "profil",
  judul: "",
  slug: "",
  ringkasan: "",
  isi: "",
  imageUrl: "",
  isPublished: true,
  urutan: 0,
};

const emptyStatistik = { label: "", nilai: "", ikon: "GraduationCap", urutan: 0 };

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  Users,
  Heart,
  Sparkles,
  Target,
  BookOpen,
  School,
  Calendar,
  Star,
  Award,
  TrendingUp,
  CheckCircle2,
};

function SectionField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

export default function AdminTentangPage() {
  const { toast } = useToast();
  const [sections, setSections] = React.useState<SectionRow[]>([]);
  const [statistik, setStatistik] = React.useState<StatistikRow[]>([]);
  const [activeTab, setActiveTab] = React.useState<"bagian" | "statistik">("bagian");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState(emptySection);
  const [statistikForm, setStatistikForm] = React.useState(emptyStatistik);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      const [sectionResult, statistikResult] = await Promise.all([
        apiFetch<{ ok: boolean; data: SectionRow[] }>("/api/admin/tentang/sections"),
        apiFetch<{ ok: boolean; data: StatistikRow[] }>("/api/admin/tentang/statistik"),
      ]);
      setSections(sectionResult.data || []);
      setStatistik(statistikResult.data || []);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memuat data Tentang Kami.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddSection = () => {
    setEditingId(null);
    setFormData({ ...emptySection, urutan: sections.length + 1 });
    setIsModalOpen(true);
  };

  const openEditSection = (item: SectionRow) => {
    setEditingId(item.id);
    setFormData({
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

  const openEditStatistik = (item: StatistikRow) => {
    setEditingId(item.id);
    setStatistikForm({ label: item.label, nilai: item.nilai, ikon: item.ikon, urutan: item.urutan });
    setIsModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const result = await apiFetch<{ ok: boolean; data: SectionRow }>(`/api/admin/tentang/sections/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        setSections((current) => current.map((item) => (item.id === editingId ? result.data : item)));
        toast("Bagian Tentang Kami berhasil diperbarui.", "success");
      } else {
        const result = await apiFetch<{ ok: boolean; data: SectionRow }>("/api/admin/tentang/sections", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        setSections((current) => [...current, result.data]);
        toast("Bagian Tentang Kami berhasil ditambahkan.", "success");
      }
      setIsModalOpen(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan bagian.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStatistik = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const result = await apiFetch<{ ok: boolean; data: StatistikRow }>(`/api/admin/tentang/statistik/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(statistikForm),
        });
        setStatistik((current) => current.map((item) => (item.id === editingId ? result.data : item)));
        toast("Statistik berhasil diperbarui.", "success");
      } else {
        const result = await apiFetch<{ ok: boolean; data: StatistikRow }>("/api/admin/tentang/statistik", {
          method: "POST",
          body: JSON.stringify(statistikForm),
        });
        setStatistik((current) => [...current, result.data]);
        toast("Statistik berhasil ditambahkan.", "success");
      }
      setIsModalOpen(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan statistik.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm("Hapus bagian ini dari halaman Tentang Kami?")) return;
    try {
      await apiFetch(`/api/admin/tentang/sections/${id}`, { method: "DELETE" });
      setSections((current) => current.filter((item) => item.id !== id));
      toast("Bagian berhasil dihapus.", "info");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menghapus bagian.", "error");
    }
  };

  const handleDeleteStatistik = async (id: string) => {
    if (!confirm("Hapus statistik ini dari halaman Tentang Kami?")) return;
    try {
      await apiFetch(`/api/admin/tentang/statistik/${id}`, { method: "DELETE" });
      setStatistik((current) => current.filter((item) => item.id !== id));
      toast("Statistik berhasil dihapus.", "info");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menghapus statistik.", "error");
    }
  };

  const togglePublish = async (item: SectionRow) => {
    try {
      const result = await apiFetch<{ ok: boolean; data: SectionRow }>(`/api/admin/tentang/sections/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...item, isPublished: !item.isPublished, slug: item.slug }),
      });
      setSections((current) => current.map((entry) => (entry.id === item.id ? result.data : entry)));
      toast(`Bagian ${result.data.isPublished ? "dipublikasikan" : "disimpan sebagai draft"}.`, "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mengubah status publikasi.", "error");
    }
  };

  const moveSection = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setSections(next);
    try {
      for (let i = 0; i < next.length; i++) {
        await apiFetch(`/api/admin/tentang/sections/${next[i].id}`, {
          method: "PUT",
          body: JSON.stringify({ ...next[i], urutan: i + 1 }),
        });
      }
      toast("Urutan bagian berhasil disimpan.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan urutan.", "error");
      loadData();
    }
  };

  const moveStatistik = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= statistik.length) return;
    const next = [...statistik];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setStatistik(next);
    try {
      for (let i = 0; i < next.length; i++) {
        await apiFetch(`/api/admin/tentang/statistik/${next[i].id}`, {
          method: "PUT",
          body: JSON.stringify({ ...next[i], urutan: i + 1 }),
        });
      }
      toast("Urutan statistik berhasil disimpan.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan urutan.", "error");
      loadData();
    }
  };

  const sortedSections = [...sections].sort((a, b) => a.urutan - b.urutan);
  const sortedStatistik = [...statistik].sort((a, b) => a.urutan - b.urutan);

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Konten Publik</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">Kelola Halaman Tentang Kami</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Atur setiap bagian halaman Tentang Kami secara terpisah. Perubahan teks dan gambar langsung tampil di halaman publik.
          </p>
        </div>
        <Button onClick={activeTab === "bagian" ? openAddSection : () => { setEditingId(null); setStatistikForm(emptyStatistik); setIsModalOpen(true); }} variant="accent" className="font-bold gap-2">
          <Plus className="h-4 w-4" /> {activeTab === "bagian" ? "Tambah Bagian" : "Tambah Statistik"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2">
        <button
          type="button"
          onClick={() => setActiveTab("bagian")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === "bagian" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}
        >
          Bagian Halaman ({sections.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("statistik")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === "statistik" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}
        >
          Kartu Statistik ({statistik.length})
        </button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">Memuat konten...</CardContent>
        </Card>
      ) : activeTab === "bagian" ? (
        <div className="grid gap-4">
          {sortedSections.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">Belum ada bagian. Klik &ldquo;Tambah Bagian&rdquo; untuk memulai.</CardContent>
            </Card>
          )}
          {sortedSections.map((item, index) => {
            const kategori = KATEGORI_LABEL[item.kategori] || item.kategori;
            return (
              <Card key={item.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center gap-1 rounded-2xl border border-primary/20 bg-primary/5 text-primary">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.judul} className="h-full w-full rounded-2xl object-cover" />
                        ) : (
                          <ImageIcon className="h-6 w-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="default">{kategori}</Badge>
                          <Badge variant={item.isPublished ? "success" : "secondary"}>{item.isPublished ? "Dipublikasikan" : "Draft"}</Badge>
                        </div>
                        <h2 className="mt-2 text-lg font-bold text-foreground">{item.judul}</h2>
                        {item.ringkasan && <p className="mt-1 max-w-2xl text-sm text-muted-foreground line-clamp-2">{item.ringkasan}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 lg:shrink-0">
                      <div className="flex flex-col gap-0.5">
                        <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30" title="Pindah ke atas">
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => moveSection(index, 1)} disabled={index === sortedSections.length - 1} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30" title="Pindah ke bawah">
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openEditSection(item)} className="gap-2">
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => togglePublish(item)} className="gap-2">
                        {item.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {item.isPublished ? "Jadikan Draft" : "Terbitkan"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteSection(item.id)} className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                        <Trash2 className="h-4 w-4" /> Hapus
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedStatistik.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">Belum ada statistik. Klik &ldquo;Tambah Statistik&rdquo; untuk menambahkan kartu angka.</CardContent>
            </Card>
          )}
          {sortedStatistik.map((item, index) => {
            const Icon = ICON_MAP[item.ikon] || GraduationCap;
            return (
              <Card key={item.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="grid size-12 place-items-center rounded-2xl border border-primary/20 bg-primary/5 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold text-foreground">{item.nilai}</p>
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-0.5">
                        <button type="button" onClick={() => moveStatistik(index, -1)} disabled={index === 0} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30" title="Pindah ke atas">
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => moveStatistik(index, 1)} disabled={index === sortedStatistik.length - 1} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30" title="Pindah ke bawah">
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openEditStatistik(item)} className="gap-2">
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteStatistik(item.id)} className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                        <Trash2 className="h-4 w-4" /> Hapus
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          activeTab === "bagian"
            ? editingId
              ? "Edit Bagian Tentang Kami"
              : "Tambah Bagian Tentang Kami"
            : editingId
              ? "Edit Kartu Statistik"
              : "Tambah Kartu Statistik"
        }
        description="Konten akan langsung tersinkronisasi ke halaman Tentang Kami di situs publik."
      >
        {activeTab === "bagian" ? (
          <form onSubmit={handleSaveSection} className="space-y-4">
            <SectionField label="Bagian Halaman / Kategori">
              <select
                className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground"
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
              >
                {TENTANG_KATEGORI.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </SectionField>

            <div className="grid gap-3 sm:grid-cols-2">
              <SectionField label="Judul Bagian">
                <Input required value={formData.judul} onChange={(e) => setFormData({ ...formData, judul: e.target.value })} placeholder="contoh: Perjalanan Kami" />
              </SectionField>
              <SectionField label="Slug URL (opsional)">
                <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="otomatis dari judul" />
              </SectionField>
            </div>

            <SectionField label="Ringkasan Singkat">
              <Input value={formData.ringkasan} onChange={(e) => setFormData({ ...formData, ringkasan: e.target.value })} placeholder="Deskripsi singkat di bawah judul" />
            </SectionField>

            <SectionField label="Isi Konten">
              <textarea
                required
                rows={8}
                value={formData.isi}
                onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                placeholder={"Tulis isi bagian di sini...\n\nBaris baru = paragraf baru.\n## Judul Bagian untuk judul tingkat dua.\n![Gambar](url-gambar) untuk menyisipkan gambar."}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </SectionField>

            <ImageUploader
              label="Gambar Bagian"
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              placeholder="Upload atau tempel URL gambar bagian"
              compact
            />

            <div className="grid grid-cols-2 gap-3">
              <SectionField label="Urutan">
                <Input type="number" value={formData.urutan} onChange={(e) => setFormData({ ...formData, urutan: Number(e.target.value) })} />
              </SectionField>
              <SectionField label="Status Publikasi">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-semibold ${formData.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-muted text-foreground"}`}
                >
                  {formData.isPublished ? "Dipublikasikan" : "Draft"}
                </button>
              </SectionField>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="accent" isLoading={saving}>
                {editingId ? "Simpan Perubahan" : "Buat Bagian"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSaveStatistik} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <SectionField label="Label Statistik">
                <Input required value={statistikForm.label} onChange={(e) => setStatistikForm({ ...statistikForm, label: e.target.value })} placeholder="contoh: Siswa yang Dibimbing" />
              </SectionField>
              <SectionField label="Nilai / Angka">
                <Input required value={statistikForm.nilai} onChange={(e) => setStatistikForm({ ...statistikForm, nilai: e.target.value })} placeholder="contoh: 100+" />
              </SectionField>
            </div>
            <SectionField label="Ikon">
              <div className="grid grid-cols-6 gap-2">
                {TENTANG_IKON.map((ikon) => {
                  const Icon = ICON_MAP[ikon.value] || GraduationCap;
                  const active = statistikForm.ikon === ikon.value;
                  return (
                    <button
                      key={ikon.value}
                      type="button"
                      title={ikon.label}
                      onClick={() => setStatistikForm({ ...statistikForm, ikon: ikon.value })}
                      className={`grid aspect-square place-items-center rounded-xl border transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </SectionField>
            <SectionField label="Urutan">
              <Input type="number" value={statistikForm.urutan} onChange={(e) => setStatistikForm({ ...statistikForm, urutan: Number(e.target.value) })} />
            </SectionField>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="accent" isLoading={saving}>
                {editingId ? "Simpan Perubahan" : "Tambah Statistik"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </main>
  );
}