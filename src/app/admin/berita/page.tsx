"use client";

import * as React from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Quote,
  Newspaper,
  Info,
  BookOpen,
  Megaphone,
  LayoutGrid,
  Eye as PreviewIcon,
  ChevronUp,
  ChevronDown,
  User,
  Home as HomeIcon,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { PORTAL_CATEGORIES } from "@/lib/portal-categories";
import { HOME_KATEGORI, HOME_IKON } from "@/lib/home-constants";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { RichContent } from "@/components/shared/RichContent";
import { cn } from "@/lib/utils";

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

type TentangRow = {
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

type TentangForm = {
  slug: string;
  kategori: string;
  judul: string;
  ringkasan: string;
  isi: string;
  imageUrl: string;
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

type HomeRow = {
  id: string;
  slug: string;
  kategori: string;
  judul: string;
  ringkasan: string | null;
  isi: string;
  imageUrl: string | null;
  ikon: string | null;
  tombolTeks: string | null;
  tombolLink: string | null;
  isActive: boolean;
  urutan: number;
};

type HomeForm = {
  slug: string;
  kategori: string;
  judul: string;
  ringkasan: string;
  isi: string;
  imageUrl: string;
  ikon: string;
  tombolTeks: string;
  tombolLink: string;
  isActive: boolean;
  urutan: number;
};

const TABS = [
  { key: "berita", label: "Berita", icon: Newspaper, hint: "Artikel dan update publik" },
  { key: "tentang", label: "Tentang Kami", icon: Info, hint: "Bagian halaman Tentang Kami" },
  { key: "statistik", label: "Statistik", icon: LayoutGrid, hint: "Kartu angka di Tentang Kami" },
  { key: "beranda", label: "Beranda", icon: HomeIcon, hint: "Bagian halaman Beranda" },
  { key: "program", label: "Program Belajar", icon: BookOpen, hint: "Pengantar halaman Program" },
  { key: "banner", label: "Banner", icon: Megaphone, hint: "Banner login & register" },
  { key: "halaman", label: "Halaman Lain", icon: LayoutGrid, hint: "Beranda, Pengajar, Kontak" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STATISTIK_URUTAN_LABEL = ["Pertama", "Kedua", "Ketiga", "Keempat", "Kelima", "Keenam", "Ketujuh", "Kedelapan"];

const emptyBerita = {
  judul: "",
  slug: "",
  ringkasan: "",
  isi: "",
  thumbnailUrl: "",
  kategori: "Umum",
  authorName: "Helped By Dinda",
  isPublished: true,
};

const emptyTentang: TentangForm = {
  slug: "",
  kategori: "lainnya",
  judul: "",
  ringkasan: "",
  isi: "",
  imageUrl: "",
  isPublished: true,
  urutan: 0,
};

const emptyStatistik: StatistikRow = {
  id: "",
  label: "",
  nilai: "",
  ikon: "GraduationCap",
  urutan: 0,
};

type PortalForm = {
  kategori: string;
  judul: string;
  slug: string;
  ringkasan: string;
  isi: string;
  imageUrl: string;
  isPublished: boolean;
  urutan: number;
};

const emptyPortal: PortalForm = {
  kategori: PORTAL_CATEGORIES[0],
  judul: "",
  slug: "",
  ringkasan: "",
  isi: "",
  imageUrl: "",
  isPublished: true,
  urutan: 0,
};

const emptyHome: HomeForm = {
  slug: "",
  kategori: "hero",
  judul: "",
  ringkasan: "",
  isi: "",
  imageUrl: "",
  ikon: "Sparkles",
  tombolTeks: "",
  tombolLink: "",
  isActive: true,
  urutan: 0,
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export default function AdminBeritaPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<TabKey>("berita");
  const [berita, setBerita] = React.useState<BeritaRow[]>([]);
  const [sections, setSections] = React.useState<TentangRow[]>([]);
  const [statistik, setStatistik] = React.useState<StatistikRow[]>([]);
  const [portalItems, setPortalItems] = React.useState<PortalRow[]>([]);
  const [homeSections, setHomeSections] = React.useState<HomeRow[]>([]);
  const [query, setQuery] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [beritaForm, setBeritaForm] = React.useState(emptyBerita);
  const [tentangForm, setTentangForm] = React.useState<TentangForm>(emptyTentang);
  const [statistikForm, setStatistikForm] = React.useState<StatistikRow>(emptyStatistik);
  const [portalForm, setPortalForm] = React.useState<PortalForm>(emptyPortal);
  const [homeForm, setHomeForm] = React.useState<HomeForm>(emptyHome);

  const loadData = React.useCallback(async () => {
    try {
      const [beritaResult, sectionsResult, statistikResult, portalResult, homeResult] = await Promise.all([
        apiFetch<{ ok: boolean; data: BeritaRow[] }>("/api/admin/berita"),
        apiFetch<{ ok: boolean; data: TentangRow[] }>("/api/admin/tentang/sections"),
        apiFetch<{ ok: boolean; data: StatistikRow[] }>("/api/admin/tentang/statistik"),
        apiFetch<{ ok: boolean; data: PortalRow[] }>("/api/admin/portal"),
        apiFetch<{ ok: boolean; data: HomeRow[] }>("/api/admin/home/sections"),
      ]);
      setBerita(beritaResult.data || []);
      setSections(sectionsResult.data || []);
      setStatistik(statistikResult.data || []);
      setPortalItems(portalResult.data || []);
      setHomeSections(homeResult.data || []);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memuat konten.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------- Modal helpers ----------
  const closeModal = () => {
    setIsModalOpen(false);
    setIsPreviewOpen(false);
    setEditingId(null);
  };

  const openAddBerita = () => {
    setEditingId(null);
    setBeritaForm(emptyBerita);
    setActiveTab("berita");
    setIsModalOpen(true);
  };

  const openEditBerita = (item: BeritaRow) => {
    setEditingId(item.id);
    setBeritaForm({
      judul: item.judul,
      slug: item.slug,
      ringkasan: item.ringkasan || "",
      isi: item.isi,
      thumbnailUrl: item.thumbnailUrl || "",
      kategori: item.kategori,
      authorName: item.authorName,
      isPublished: item.isPublished,
    });
    setActiveTab("berita");
    setIsModalOpen(true);
  };

  const openAddTentang = () => {
    setEditingId(null);
    setTentangForm({ ...emptyTentang });
    setActiveTab("tentang");
    setIsModalOpen(true);
  };

  const openEditTentang = (item: TentangRow) => {
    setEditingId(item.id);
    setTentangForm({ ...item, ringkasan: item.ringkasan || "", imageUrl: item.imageUrl || "" });
    setActiveTab("tentang");
    setIsModalOpen(true);
  };

  const openAddStatistik = () => {
    setEditingId(null);
    setStatistikForm({ ...emptyStatistik });
    setActiveTab("statistik");
    setIsModalOpen(true);
  };

  const openEditStatistik = (item: StatistikRow) => {
    setEditingId(item.id);
    setStatistikForm({ ...item });
    setActiveTab("statistik");
    setIsModalOpen(true);
  };

  const openAddPortal = (kategori: string) => {
    setEditingId(null);
    setPortalForm({ ...emptyPortal, kategori });
    setActiveTab(kategori === "Program Belajar" ? "program" : kategori === "Beranda" || kategori === "Daftar Pengajar" || kategori === "Kontak" ? "halaman" : "halaman");
    setIsModalOpen(true);
  };

  const openEditPortal = (item: PortalRow) => {
    setEditingId(item.id);
    setPortalForm({
      kategori: item.kategori,
      judul: item.judul,
      slug: item.slug,
      ringkasan: item.ringkasan || "",
      isi: item.isi,
      imageUrl: item.imageUrl || "",
      isPublished: item.isPublished,
      urutan: item.urutan,
    });
    setActiveTab(item.kategori === "Program Belajar" ? "program" : item.kategori === "Beranda" || item.kategori === "Daftar Pengajar" || item.kategori === "Kontak" ? "halaman" : "halaman");
    setIsModalOpen(true);
  };

  const openAddHome = () => {
    setEditingId(null);
    setHomeForm({ ...emptyHome });
    setActiveTab("beranda");
    setIsModalOpen(true);
  };

  const openEditHome = (item: HomeRow) => {
    setEditingId(item.id);
    setHomeForm({
      slug: item.slug,
      kategori: item.kategori,
      judul: item.judul,
      ringkasan: item.ringkasan || "",
      isi: item.isi,
      imageUrl: item.imageUrl || "",
      ikon: item.ikon || "",
      tombolTeks: item.tombolTeks || "",
      tombolLink: item.tombolLink || "",
      isActive: item.isActive,
      urutan: item.urutan,
    });
    setActiveTab("beranda");
    setIsModalOpen(true);
  };

  // ---------- Save handlers ----------
  const handleSaveTentang = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const result = await apiFetch<{ ok: boolean; data: TentangRow }>(`/api/admin/tentang/sections/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(tentangForm),
        });
        setSections((current) => current.map((item) => (item.id === editingId ? result.data : item)));
        toast("Bagian Tentang Kami berhasil diperbarui.", "success");
      } else {
        const result = await apiFetch<{ ok: boolean; data: TentangRow }>("/api/admin/tentang/sections", {
          method: "POST",
          body: JSON.stringify(tentangForm),
        });
        setSections((current) => [result.data, ...current]);
        toast("Bagian Tentang Kami berhasil ditambahkan.", "success");
      }
      closeModal();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan bagian.", "error");
    }
  };

  const handleSaveStatistik = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setStatistik((current) => [result.data, ...current]);
        toast("Statistik berhasil ditambahkan.", "success");
      }
      closeModal();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan statistik.", "error");
    }
  };

  const handleSaveBerita = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...beritaForm,
        slug: beritaForm.slug || slugify(beritaForm.judul),
      };
      if (editingId) {
        const result = await apiFetch<{ ok: boolean; data: BeritaRow }>(`/api/admin/berita/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setBerita((current) => current.map((item) => (item.id === editingId ? result.data : item)));
        toast("Berita berhasil diperbarui.", "success");
      } else {
        const result = await apiFetch<{ ok: boolean; data: BeritaRow }>("/api/admin/berita", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setBerita((current) => [result.data, ...current]);
        toast("Berita baru berhasil dibuat.", "success");
      }
      closeModal();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan berita.", "error");
    }
  };

  const handleSavePortal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...portalForm,
        slug: portalForm.slug || slugify(portalForm.judul),
      };
      if (editingId) {
        const result = await apiFetch<{ ok: boolean; data: PortalRow }>(`/api/admin/portal/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setPortalItems((current) => current.map((item) => (item.id === editingId ? result.data : item)));
        toast("Konten halaman berhasil diperbarui.", "success");
      } else {
        const result = await apiFetch<{ ok: boolean; data: PortalRow }>("/api/admin/portal", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setPortalItems((current) => [result.data, ...current]);
        toast("Konten halaman berhasil ditambahkan.", "success");
      }
      closeModal();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan konten halaman.", "error");
    }
  };

  const handleSaveHome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...homeForm,
        slug: homeForm.slug || slugify(homeForm.judul),
      };
      if (editingId) {
        const result = await apiFetch<{ ok: boolean; data: HomeRow }>(`/api/admin/home/sections/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setHomeSections((current) => current.map((item) => (item.id === editingId ? result.data : item)));
        toast("Bagian Beranda berhasil diperbarui.", "success");
      } else {
        const result = await apiFetch<{ ok: boolean; data: HomeRow }>("/api/admin/home/sections", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setHomeSections((current) => [...current, result.data]);
        toast("Bagian Beranda berhasil ditambahkan.", "success");
      }
      closeModal();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan bagian Beranda.", "error");
    }
  };

  // ---------- Delete / publish ----------
  const handleDelete = async (source: "berita" | "tentang" | "statistik" | "portal" | "home", id: string) => {
    const label = source === "berita" ? "berita" : source === "tentang" ? "bagian Tentang Kami" : source === "statistik" ? "statistik" : source === "home" ? "bagian Beranda" : "konten halaman";
    if (!confirm(`Hapus ${label} ini dari halaman publik?`)) return;
    try {
      const endpoint =
        source === "berita"
          ? `/api/admin/berita/${id}`
          : source === "tentang"
            ? `/api/admin/tentang/sections/${id}`
            : source === "statistik"
              ? `/api/admin/tentang/statistik/${id}`
              : source === "home"
                ? `/api/admin/home/sections/${id}`
              : `/api/admin/portal/${id}`;
      await apiFetch(endpoint, { method: "DELETE" });
      if (source === "berita") setBerita((current) => current.filter((item) => item.id !== id));
      if (source === "tentang") setSections((current) => current.filter((item) => item.id !== id));
      if (source === "statistik") setStatistik((current) => current.filter((item) => item.id !== id));
      if (source === "home") setHomeSections((current) => current.filter((item) => item.id !== id));
      if (source === "portal") setPortalItems((current) => current.filter((item) => item.id !== id));
      toast(`${label.charAt(0).toUpperCase() + label.slice(1)} berhasil dihapus.`, "info");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menghapus konten.", "error");
    }
  };

  const togglePublish = async (source: "berita" | "tentang" | "portal" | "home", item: BeritaRow | TentangRow | PortalRow | HomeRow) => {
    try {
      if (source === "berita") {
        const beritaItem = item as BeritaRow;
        const result = await apiFetch<{ ok: boolean; data: BeritaRow }>(`/api/admin/berita/${item.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...beritaItem, isPublished: !beritaItem.isPublished, slug: beritaItem.slug }),
        });
        setBerita((current) => current.map((entry) => (entry.id === item.id ? (result.data as BeritaRow) : entry)));
        toast(`Konten ${result.data.isPublished ? "dipublikasikan" : "disimpan sebagai draft"}.`, "success");
      } else if (source === "tentang") {
        const tentangItem = item as TentangRow;
        const result = await apiFetch<{ ok: boolean; data: TentangRow }>(`/api/admin/tentang/sections/${item.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...tentangItem, isPublished: !tentangItem.isPublished, slug: tentangItem.slug }),
        });
        setSections((current) => current.map((entry) => (entry.id === item.id ? (result.data as TentangRow) : entry)));
        toast(`Konten ${result.data.isPublished ? "dipublikasikan" : "disimpan sebagai draft"}.`, "success");
      } else if (source === "home") {
        const homeItem = item as HomeRow;
        const result = await apiFetch<{ ok: boolean; data: HomeRow }>(`/api/admin/home/sections/${item.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...homeItem, isActive: !homeItem.isActive }),
        });
        setHomeSections((current) => current.map((entry) => (entry.id === item.id ? (result.data as HomeRow) : entry)));
        toast(`Bagian Beranda ${result.data.isActive ? "diaktifkan" : "dinonaktifkan"}.`, "success");
      } else {
        const portalItem = item as PortalRow;
        const result = await apiFetch<{ ok: boolean; data: PortalRow }>(`/api/admin/portal/${item.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...portalItem, isPublished: !portalItem.isPublished }),
        });
        setPortalItems((current) => current.map((entry) => (entry.id === item.id ? (result.data as PortalRow) : entry)));
        toast(`Konten ${result.data.isPublished ? "dipublikasikan" : "disimpan sebagai draft"}.`, "success");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mengubah status publikasi.", "error");
    }
  };

  const moveItem = async (source: "tentang" | "statistik" | "home", index: number, direction: -1 | 1) => {
    if (source === "tentang") {
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
      return;
    }

    if (source === "home") {
      const target = index + direction;
      if (target < 0 || target >= homeSections.length) return;
      const next = [...homeSections];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      setHomeSections(next);
      try {
        for (let i = 0; i < next.length; i++) {
          await apiFetch(`/api/admin/home/sections/${next[i].id}`, {
            method: "PUT",
            body: JSON.stringify({ ...next[i], urutan: i + 1 }),
          });
        }
        toast("Urutan bagian Beranda berhasil disimpan.", "success");
      } catch (error) {
        toast(error instanceof Error ? error.message : "Gagal menyimpan urutan.", "error");
        loadData();
      }
      return;
    }

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

  // ---------- Derived lists ----------
  const queryLower = query.toLowerCase();
  const filteredBerita = berita.filter((item) => item.judul.toLowerCase().includes(queryLower) || item.kategori.toLowerCase().includes(queryLower) || item.authorName.toLowerCase().includes(queryLower));
  const filteredSections = sections.filter((item) => item.judul.toLowerCase().includes(queryLower) || item.kategori.toLowerCase().includes(queryLower));
  const sortedSections = [...filteredSections].sort((a, b) => a.urutan - b.urutan);
  const sortedStatistik = [...statistik].sort((a, b) => a.urutan - b.urutan);
  const sortedHome = [...homeSections].sort((a, b) => a.urutan - b.urutan).filter((item) => item.judul.toLowerCase().includes(queryLower));

  const programItems = portalItems
    .filter((item) => item.kategori === "Program Belajar")
    .sort((a, b) => a.urutan - b.urutan)
    .filter((item) => item.judul.toLowerCase().includes(queryLower));
  const bannerItems = portalItems
    .filter((item) => ["login-banner", "register-banner"].includes(item.slug))
    .filter((item) => item.judul.toLowerCase().includes(queryLower));
  const halamanItems = portalItems
    .filter((item) => item.kategori !== "Program Belajar" && !["login-banner", "register-banner"].includes(item.slug))
    .sort((a, b) => a.urutan - b.urutan)
    .filter((item) => item.judul.toLowerCase().includes(queryLower));

  const currentTabConfig = TABS.find((tab) => tab.key === activeTab)!;

  const renderPreview = () => {
    if (activeTab === "beranda") {
      return (
        <div className="space-y-4 text-foreground">
          <h3 className="text-2xl font-extrabold">{homeForm.judul || "Judul Bagian"}</h3>
          {homeForm.ringkasan && <p className="text-sm text-muted-foreground">{homeForm.ringkasan}</p>}
          {homeForm.imageUrl && <img src={homeForm.imageUrl} alt="Pratinjau" className="max-h-72 w-full rounded-2xl border border-border object-cover" />}
          <RichContent content={homeForm.isi} className="text-sm sm:text-base" />
          {homeForm.tombolTeks && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white">
              {homeForm.tombolTeks}
              {homeForm.tombolLink && <span className="text-white/70">({homeForm.tombolLink})</span>}
            </div>
          )}
        </div>
      );
    }
    if (activeTab === "tentang" || activeTab === "halaman") {
      return (
        <div className="space-y-4 text-foreground">
          <h3 className="text-2xl font-extrabold">{tentangForm.judul || portalForm.judul || "Judul"}</h3>
          {(tentangForm.ringkasan || portalForm.ringkasan) && <p className="text-sm text-muted-foreground">{tentangForm.ringkasan || portalForm.ringkasan}</p>}
          {(tentangForm.imageUrl || portalForm.imageUrl) && (
            <img src={tentangForm.imageUrl || portalForm.imageUrl} alt="Pratinjau" className="max-h-72 w-full rounded-2xl border border-border object-cover" />
          )}
          <RichContent content={tentangForm.isi || portalForm.isi} className="text-sm sm:text-base" />
        </div>
      );
    }
    if (activeTab === "berita") {
      return (
        <div className="space-y-4 text-foreground">
          <div className="flex items-center gap-3">
            {beritaForm.thumbnailUrl && <img src={beritaForm.thumbnailUrl} alt="Thumbnail" className="h-24 w-32 rounded-xl border border-border object-cover" />}
            <div className="flex-1">
              <Badge variant="secondary" className="mb-1">{beritaForm.kategori || "Umum"}</Badge>
              <h3 className="text-xl font-extrabold">{beritaForm.judul || "Judul Berita"}</h3>
              <p className="text-xs text-muted-foreground">{beritaForm.authorName}</p>
            </div>
          </div>
          {beritaForm.ringkasan && <p className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed">{beritaForm.ringkasan}</p>}
          <RichContent content={beritaForm.isi} className="text-sm sm:text-base" />
        </div>
      );
    }
    if (activeTab === "statistik") {
      return (
        <div className="grid grid-cols-3 gap-3 text-foreground">
          <div className="rounded-2xl border border-border bg-muted/30 p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{statistikForm.nilai || "0"}</p>
            <p className="text-xs text-muted-foreground">{statistikForm.label || "Label"}</p>
          </div>
        </div>
      );
    }
    // program / banner
    return (
      <div className="space-y-4 text-foreground">
        <h3 className="text-2xl font-extrabold">{portalForm.judul || "Judul"}</h3>
        {portalForm.ringkasan && <p className="text-sm text-muted-foreground">{portalForm.ringkasan}</p>}
        {portalForm.imageUrl && <img src={portalForm.imageUrl} alt="Pratinjau" className="max-h-72 w-full rounded-2xl border border-border object-cover" />}
        <RichContent content={portalForm.isi} className="text-sm sm:text-base" />
      </div>
    );
  };

  const emptyMessage = (label: string) => `Belum ada ${label}. Klik “Tambah” untuk membuat konten baru.`;

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Konten Publik</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">Kelola Konten Website</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Kelola berita, halaman Tentang Kami, program belajar, dan banner dalam satu tempat. Perubahan langsung tersinkronisasi ke halaman publik.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(activeTab === "program" || activeTab === "halaman") && (
            <Button onClick={() => openAddPortal(activeTab === "program" ? "Program Belajar" : "Beranda")} variant="accent" className="font-bold gap-2">
              <Plus className="h-4 w-4" /> Tambah Konten Halaman
            </Button>
          )}
          {activeTab === "tentang" && (
            <Button onClick={openAddTentang} variant="accent" className="font-bold gap-2">
              <Plus className="h-4 w-4" /> Tambah Bagian
            </Button>
          )}
          {activeTab === "statistik" && (
            <Button onClick={openAddStatistik} variant="accent" className="font-bold gap-2">
              <Plus className="h-4 w-4" /> Tambah Statistik
            </Button>
          )}
          {activeTab === "beranda" && (
            <Button onClick={openAddHome} variant="accent" className="font-bold gap-2">
              <Plus className="h-4 w-4" /> Tambah Bagian Beranda
            </Button>
          )}
          {activeTab === "berita" && (
            <Button onClick={openAddBerita} variant="accent" className="font-bold gap-2">
              <Plus className="h-4 w-4" /> Tambah Berita
            </Button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const countMap: Record<TabKey, number> = {
            berita: berita.length,
            tentang: sections.length,
            statistik: statistik.length,
            beranda: homeSections.length,
            program: programItems.length,
            banner: bannerItems.length,
            halaman: halamanItems.length,
          };
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setQuery("");
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
                active ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted"
              )}
              title={tab.hint}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground")}>{countMap[tab.key]}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      {activeTab !== "statistik" && (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder={`Cari ${currentTabConfig.label.toLowerCase()}...`} value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">Memuat konten...</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {/* ===== TAB BERITA ===== */}
          {activeTab === "berita" &&
            (filteredBerita.length === 0 ? (
              <EmptyState message={emptyMessage("berita")} />
            ) : (
              filteredBerita.map((item) => (
                <Card key={item.id} className="group">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-linear-to-br from-primary/10 via-accent/10 to-secondary">
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt={item.judul} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase text-primary">{item.kategori}</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold text-foreground">{item.judul}</h2>
                            <Badge variant={item.isPublished ? "success" : "secondary"}>{item.isPublished ? "Dipublikasikan" : "Draft"}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            <User className="mr-1 inline h-3 w-3" />
                            {item.authorName} • {item.kategori}
                          </p>
                          <p className="mt-2 max-w-2xl text-sm text-muted-foreground line-clamp-2">{item.ringkasan || item.isi.slice(0, 180)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditBerita(item)} className="gap-2">
                          <Pencil className="h-4 w-4" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => togglePublish("berita", item)} className="gap-2">
                          {item.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {item.isPublished ? "Jadikan Draft" : "Terbitkan"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete("berita", item.id)} className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                          <Trash2 className="h-4 w-4" /> Hapus
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ))}

          {/* ===== TAB TENTANG KAMI ===== */}
          {activeTab === "tentang" &&
            (sortedSections.length === 0 ? (
              <EmptyState message={emptyMessage("bagian Tentang Kami")} />
            ) : (
              sortedSections.map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 text-primary">
                          {item.imageUrl ? <img src={item.imageUrl} alt={item.judul} className="h-full w-full object-cover" /> : <Info className="h-6 w-6" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="default">{item.kategori}</Badge>
                            <Badge variant={item.isPublished ? "success" : "secondary"}>{item.isPublished ? "Dipublikasikan" : "Draft"}</Badge>
                          </div>
                          <h2 className="mt-2 text-lg font-bold text-foreground">{item.judul}</h2>
                          {item.ringkasan && <p className="mt-1 max-w-2xl text-sm text-muted-foreground line-clamp-2">{item.ringkasan}</p>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveItem("tentang", index, -1)}
                            disabled={index === 0}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                            title="Pindah ke atas"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem("tentang", index, 1)}
                            disabled={index === sortedSections.length - 1}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                            title="Pindah ke bawah"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => openEditTentang(item)} className="gap-2">
                          <Pencil className="h-4 w-4" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => togglePublish("tentang", item)} className="gap-2">
                          {item.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {item.isPublished ? "Jadikan Draft" : "Terbitkan"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete("tentang", item.id)} className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                          <Trash2 className="h-4 w-4" /> Hapus
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ))}

          {/* ===== TAB STATISTIK ===== */}
          {activeTab === "statistik" &&
            (sortedStatistik.length === 0 ? (
              <EmptyState message={emptyMessage("kartu statistik")} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {sortedStatistik.map((item, index) => (
                  <Card key={item.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/5 text-primary">
                              <LayoutGrid className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-2xl font-extrabold text-foreground">{item.nilai}</p>
                              <p className="truncate text-sm text-muted-foreground">{item.label}</p>
                            </div>
                          </div>
                          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Urutan {STATISTIK_URUTAN_LABEL[index] || index + 1}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveItem("statistik", index, -1)}
                              disabled={index === 0}
                              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                              title="Pindah ke atas"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItem("statistik", index, 1)}
                              disabled={index === sortedStatistik.length - 1}
                              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                              title="Pindah ke bawah"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => openEditStatistik(item)} className="gap-2">
                            <Pencil className="h-4 w-4" /> Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete("statistik", item.id)} className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                            <Trash2 className="h-4 w-4" /> Hapus
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}

          {/* ===== TAB BERANDA ===== */}
          {activeTab === "beranda" &&
            (sortedHome.length === 0 ? (
              <EmptyState message={emptyMessage("bagian Beranda")} />
            ) : (
              sortedHome.map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 text-primary">
                          {item.imageUrl ? <img src={item.imageUrl} alt={item.judul} className="h-full w-full object-cover" /> : <HomeIcon className="h-6 w-6" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="default">{HOME_KATEGORI.find((k) => k.value === item.kategori)?.label || item.kategori}</Badge>
                            <Badge variant={item.isActive ? "success" : "secondary"}>{item.isActive ? "Aktif" : "Nonaktif"}</Badge>
                          </div>
                          <h2 className="mt-2 text-lg font-bold text-foreground">{item.judul}</h2>
                          {item.ringkasan && <p className="mt-1 max-w-2xl text-sm text-muted-foreground line-clamp-2">{item.ringkasan}</p>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveItem("home", index, -1)}
                            disabled={index === 0}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                            title="Pindah ke atas"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem("home", index, 1)}
                            disabled={index === sortedHome.length - 1}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                            title="Pindah ke bawah"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => openEditHome(item)} className="gap-2">
                          <Pencil className="h-4 w-4" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => togglePublish("home", item)} className="gap-2">
                          {item.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {item.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete("home", item.id)} className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                          <Trash2 className="h-4 w-4" /> Hapus
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ))}

          {/* ===== TAB PROGRAM BELAJAR ===== */}
          {activeTab === "program" &&
            (programItems.length === 0 ? (
              <EmptyState message={emptyMessage("konten Program Belajar")} />
            ) : (
              programItems.map((item) => (
                <PortalCard key={item.id} item={item} onEdit={() => openEditPortal(item)} onToggle={() => togglePublish("portal", item)} onDelete={() => handleDelete("portal", item.id)} />
              ))
            ))}

          {/* ===== TAB BANNER ===== */}
          {activeTab === "banner" &&
            (bannerItems.length === 0 ? (
              <EmptyState message={emptyMessage("banner")} />
            ) : (
              bannerItems.map((item) => (
                <PortalCard key={item.id} item={item} onEdit={() => openEditPortal(item)} onToggle={() => togglePublish("portal", item)} onDelete={() => handleDelete("portal", item.id)} />
              ))
            ))}

          {/* ===== TAB HALAMAN LAIN ===== */}
          {activeTab === "halaman" &&
            (halamanItems.length === 0 ? (
              <EmptyState message={emptyMessage("konten halaman")} />
            ) : (
              halamanItems.map((item) => (
                <PortalCard key={item.id} item={item} onEdit={() => openEditPortal(item)} onToggle={() => togglePublish("portal", item)} onDelete={() => handleDelete("portal", item.id)} />
              ))
            ))}
        </div>
      )}

      {/* ===== MODAL TAMBAH/EDIT ===== */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          activeTab === "berita"
            ? editingId
              ? "Edit Berita"
              : "Tambah Berita"
            : activeTab === "tentang"
              ? editingId
                ? "Edit Bagian Tentang Kami"
                : "Tambah Bagian Tentang Kami"
              : activeTab === "statistik"
                ? editingId
                  ? "Edit Kartu Statistik"
                  : "Tambah Kartu Statistik"
                : activeTab === "beranda"
                  ? editingId
                    ? "Edit Bagian Beranda"
                    : "Tambah Bagian Beranda"
                : editingId
                  ? "Edit Konten Halaman"
                  : "Tambah Konten Halaman"
        }
        description="Konten yang dipublikasikan akan langsung tampil di halaman publik website."
        className="max-w-3xl"
      >
        {activeTab === "berita" ? (
          <form onSubmit={handleSaveBerita} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Judul Berita">
                <Input
                  required
                  value={beritaForm.judul}
                  onChange={(e) => setBeritaForm({ ...beritaForm, judul: e.target.value, slug: beritaForm.slug || slugify(e.target.value) })}
                  placeholder="Judul berita"
                />
              </Field>
              <Field label="Slug URL (opsional)">
                <Input value={beritaForm.slug} onChange={(e) => setBeritaForm({ ...beritaForm, slug: e.target.value })} placeholder="otomatis dari judul" />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Kategori">
                <Input value={beritaForm.kategori} onChange={(e) => setBeritaForm({ ...beritaForm, kategori: e.target.value })} placeholder="contoh: Prestasi, Kegiatan" />
              </Field>
              <Field label="Penulis / Author">
                <Input value={beritaForm.authorName} onChange={(e) => setBeritaForm({ ...beritaForm, authorName: e.target.value })} />
              </Field>
            </div>
            <Field label="Ringkasan">
              <Input value={beritaForm.ringkasan} onChange={(e) => setBeritaForm({ ...beritaForm, ringkasan: e.target.value })} placeholder="Ringkasan singkat untuk tampilan kartu" />
            </Field>
            <EditorToolbar value={beritaForm.isi} onChange={(isi) => setBeritaForm({ ...beritaForm, isi })} placeholder="Tulis isi berita di sini..." />
            <ImageUploader label="Thumbnail Berita" value={beritaForm.thumbnailUrl} onChange={(url) => setBeritaForm({ ...beritaForm, thumbnailUrl: url })} placeholder="Tempel URL gambar atau unggah dari perangkat" compact />
            <PublishToggle published={beritaForm.isPublished} onChange={(v) => setBeritaForm({ ...beritaForm, isPublished: v })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(!isPreviewOpen)} className="gap-2">
                <PreviewIcon className="h-4 w-4" /> {isPreviewOpen ? "Tutup Pratinjau" : "Pratinjau"}
              </Button>
              <Button type="submit" variant="accent">
                {editingId ? "Simpan Perubahan" : "Buat Berita"}
              </Button>
            </div>
            {isPreviewOpen && (
              <div className="rounded-2xl border border-border bg-muted/20 p-5">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Pratinjau Berita</p>
                {renderPreview()}
              </div>
            )}
          </form>
        ) : activeTab === "tentang" ? (
          <form onSubmit={handleSaveTentang} className="space-y-4">
            <Field label="Bagian / Kategori Halaman">
              <select
                className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground"
                value={tentangForm.kategori}
                onChange={(e) => setTentangForm({ ...tentangForm, kategori: e.target.value })}
              >
                {[
                  { value: "profil", label: "Tentang Helped by Dinda" },
                  { value: "perjalanan", label: "Perjalanan Kami" },
                  { value: "pencapaian", label: "Pencapaian Kami" },
                  { value: "program", label: "Program Pembelajaran" },
                  { value: "pendekatan", label: "Pendekatan Pembelajaran" },
                  { value: "tutor", label: "Tutor dan Pendampingan Akademik" },
                  { value: "visi", label: "Visi dan Misi" },
                  { value: "komitmen", label: "Komitmen Kami" },
                  { value: "lainnya", label: "Bagian Lainnya" },
                ].map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Judul Bagian">
                <Input required value={tentangForm.judul} onChange={(e) => setTentangForm({ ...tentangForm, judul: e.target.value, slug: tentangForm.slug || slugify(e.target.value) })} placeholder="contoh: Perjalanan Kami" />
              </Field>
              <Field label="Slug URL (opsional)">
                <Input value={tentangForm.slug} onChange={(e) => setTentangForm({ ...tentangForm, slug: e.target.value })} placeholder="otomatis dari judul" />
              </Field>
            </div>
            <Field label="Ringkasan Singkat">
              <Input value={tentangForm.ringkasan} onChange={(e) => setTentangForm({ ...tentangForm, ringkasan: e.target.value })} placeholder="Deskripsi singkat di bawah judul" />
            </Field>
            <EditorToolbar value={tentangForm.isi} onChange={(isi) => setTentangForm({ ...tentangForm, isi })} placeholder="Tulis isi bagian di sini..." />
            <ImageUploader label="Gambar Bagian" value={tentangForm.imageUrl} onChange={(url) => setTentangForm({ ...tentangForm, imageUrl: url })} placeholder="Upload atau tempel URL gambar" compact />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Urutan">
                <Input type="number" value={tentangForm.urutan} onChange={(e) => setTentangForm({ ...tentangForm, urutan: Number(e.target.value) })} />
              </Field>
              <Field label="Status Publikasi">
                <PublishToggle published={tentangForm.isPublished} onChange={(v) => setTentangForm({ ...tentangForm, isPublished: v })} />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(!isPreviewOpen)} className="gap-2">
                <PreviewIcon className="h-4 w-4" /> {isPreviewOpen ? "Tutup Pratinjau" : "Pratinjau"}
              </Button>
              <Button type="submit" variant="accent">
                {editingId ? "Simpan Perubahan" : "Buat Bagian"}
              </Button>
            </div>
            {isPreviewOpen && (
              <div className="rounded-2xl border border-border bg-muted/20 p-5">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Pratinjau Bagian</p>
                {renderPreview()}
              </div>
            )}
          </form>
        ) : activeTab === "statistik" ? (
          <form onSubmit={handleSaveStatistik} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Label Statistik">
                <Input required value={statistikForm.label} onChange={(e) => setStatistikForm({ ...statistikForm, label: e.target.value })} placeholder="contoh: Siswa yang Dibimbing" />
              </Field>
              <Field label="Nilai / Angka">
                <Input required value={statistikForm.nilai} onChange={(e) => setStatistikForm({ ...statistikForm, nilai: e.target.value })} placeholder="contoh: 100+" />
              </Field>
            </div>
            <Field label="Urutan">
              <Input type="number" value={statistikForm.urutan} onChange={(e) => setStatistikForm({ ...statistikForm, urutan: Number(e.target.value) })} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(!isPreviewOpen)} className="gap-2">
                <PreviewIcon className="h-4 w-4" /> {isPreviewOpen ? "Tutup Pratinjau" : "Pratinjau"}
              </Button>
              <Button type="submit" variant="accent">
                {editingId ? "Simpan Perubahan" : "Tambah Statistik"}
              </Button>
            </div>
            {isPreviewOpen && (
              <div className="rounded-2xl border border-border bg-muted/20 p-5">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Pratinjau Kartu</p>
                {renderPreview()}
              </div>
            )}
          </form>
        ) : activeTab === "beranda" ? (
          <form onSubmit={handleSaveHome} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Bagian / Kategori Beranda">
                <select
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground"
                  value={homeForm.kategori}
                  onChange={(e) => setHomeForm({ ...homeForm, kategori: e.target.value })}
                >
                  {HOME_KATEGORI.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ikon Bagian">
                <select
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground"
                  value={homeForm.ikon}
                  onChange={(e) => setHomeForm({ ...homeForm, ikon: e.target.value })}
                >
                  {HOME_IKON.map((ikon) => (
                    <option key={ikon} value={ikon}>
                      {ikon}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Judul Bagian">
                <Input required value={homeForm.judul} onChange={(e) => setHomeForm({ ...homeForm, judul: e.target.value, slug: homeForm.slug || slugify(e.target.value) })} placeholder="contoh: Keunggulan Kami" />
              </Field>
              <Field label="Slug URL (opsional)">
                <Input value={homeForm.slug} onChange={(e) => setHomeForm({ ...homeForm, slug: e.target.value })} placeholder="otomatis dari judul" />
              </Field>
            </div>
            <Field label="Ringkasan Singkat">
              <Input value={homeForm.ringkasan} onChange={(e) => setHomeForm({ ...homeForm, ringkasan: e.target.value })} placeholder="Deskripsi singkat di bawah judul" />
            </Field>
            <EditorToolbar value={homeForm.isi} onChange={(isi) => setHomeForm({ ...homeForm, isi })} placeholder="Tulis isi bagian Beranda di sini..." />

            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Format Isi yang Didukung</p>
              <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="font-bold text-foreground">Statistik Beranda</p>
                  <p className="mt-1">Setiap baris: <code className="font-mono">Angka|Keterangan|NamaIkon</code></p>
                  <p className="mt-1"><code className="font-mono">100%|Absensi Digital Akurat|CalendarCheck</code></p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="font-bold text-foreground">Keunggulan Kami</p>
                  <p className="mt-1">Setiap baris: <code className="font-mono">Judul|Deskripsi|NamaIkon</code></p>
                  <p className="mt-1"><code className="font-mono">Absensi Digital Realtime|Deskripsi di sini|CalendarCheck</code></p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Teks Tombol (opsional)">
                <Input value={homeForm.tombolTeks} onChange={(e) => setHomeForm({ ...homeForm, tombolTeks: e.target.value })} placeholder="contoh: Daftar Murid Baru" />
              </Field>
              <Field label="Tautan Tombol (opsional)">
                <Input value={homeForm.tombolLink} onChange={(e) => setHomeForm({ ...homeForm, tombolLink: e.target.value })} placeholder="contoh: /register" />
              </Field>
            </div>
            <ImageUploader label="Gambar Bagian (opsional)" value={homeForm.imageUrl} onChange={(url) => setHomeForm({ ...homeForm, imageUrl: url })} placeholder="Upload atau tempel URL gambar" compact />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Urutan">
                <Input type="number" value={homeForm.urutan} onChange={(e) => setHomeForm({ ...homeForm, urutan: Number(e.target.value) })} />
              </Field>
              <Field label="Status Bagian">
                <PublishToggle published={homeForm.isActive} onChange={(v) => setHomeForm({ ...homeForm, isActive: v })} />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(!isPreviewOpen)} className="gap-2">
                <PreviewIcon className="h-4 w-4" /> {isPreviewOpen ? "Tutup Pratinjau" : "Pratinjau"}
              </Button>
              <Button type="submit" variant="accent">
                {editingId ? "Simpan Perubahan" : "Buat Bagian Beranda"}
              </Button>
            </div>
            {isPreviewOpen && (
              <div className="rounded-2xl border border-border bg-muted/20 p-5">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Pratinjau Bagian Beranda</p>
                {renderPreview()}
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleSavePortal} className="space-y-4">
            {(portalForm.slug === "login-banner" || portalForm.slug === "register-banner") && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary space-y-1">
                <p className="font-bold">Tips Kustomisasi Banner {portalForm.slug === "login-banner" ? "Login" : "Register"}:</p>
                <ul className="list-disc pl-4 space-y-0.5 font-medium">
                  <li>
                    <strong>Judul:</strong> kutipan utama banner (contoh: “Bimbingan Belajar Modern dan Terarah”).
                  </li>
                  <li>
                    <strong>Ringkasan:</strong> format <code>[Nama]||[Jabatan]||[Sub-Judul]</code> (contoh: <code>Dinda Rizky Febriyanti||Pendiri & Direktur Akademik||Bimbingan Belajar Modern dan Terarah</code>).
                  </li>
                  <li>
                    <strong>Isi Konten:</strong> setiap baris menjadi poin keunggulan pada banner.
                  </li>
                </ul>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Kategori Halaman">
                <select
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground"
                  value={portalForm.kategori}
                  onChange={(e) => setPortalForm({ ...portalForm, kategori: e.target.value })}
                >
                  {PORTAL_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Slug URL">
                <Input value={portalForm.slug} onChange={(e) => setPortalForm({ ...portalForm, slug: e.target.value })} placeholder="contoh: beranda" />
              </Field>
            </div>
            <Field label="Judul Halaman">
              <Input required value={portalForm.judul} onChange={(e) => setPortalForm({ ...portalForm, judul: e.target.value })} placeholder="Judul halaman" />
            </Field>
            <Field label="Ringkasan">
              <Input value={portalForm.ringkasan} onChange={(e) => setPortalForm({ ...portalForm, ringkasan: e.target.value })} placeholder="Deskripsi singkat di bawah judul" />
            </Field>
            <EditorToolbar value={portalForm.isi} onChange={(isi) => setPortalForm({ ...portalForm, isi })} placeholder="Tulis isi halaman di sini..." />
            <div className="grid grid-cols-2 gap-3">
              <ImageUploader label="Gambar Halaman" value={portalForm.imageUrl} onChange={(url) => setPortalForm({ ...portalForm, imageUrl: url })} placeholder="Upload atau tempel URL gambar" compact />
              <Field label="Urutan">
                <Input type="number" value={portalForm.urutan} onChange={(e) => setPortalForm({ ...portalForm, urutan: Number(e.target.value) })} />
              </Field>
            </div>
            <PublishToggle published={portalForm.isPublished} onChange={(v) => setPortalForm({ ...portalForm, isPublished: v })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(!isPreviewOpen)} className="gap-2">
                <PreviewIcon className="h-4 w-4" /> {isPreviewOpen ? "Tutup Pratinjau" : "Pratinjau"}
              </Button>
              <Button type="submit" variant="accent">
                {editingId ? "Simpan Perubahan" : "Buat Konten"}
              </Button>
            </div>
            {isPreviewOpen && (
              <div className="rounded-2xl border border-border bg-muted/20 p-5">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Pratinjau Halaman</p>
                {renderPreview()}
              </div>
            )}
          </form>
        )}
      </Modal>
    </main>
  );
}

// ---------- Tiny helpers ----------
function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-center text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

function PublishToggle({ published, onChange }: { published: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!published)}
      className={`flex w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${published ? "bg-emerald-100 text-emerald-700" : "bg-muted text-foreground"}`}
    >
      {published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      {published ? "Dipublikasikan" : "Draft"}
    </button>
  );
}

function EditorToolbar({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const insert = (snippet: string) => onChange(`${value}\n${snippet}`);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground">Isi Konten</label>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 px-2 py-1.5">
          <button type="button" title="Sisipkan Heading 2" onClick={() => insert("## Judul Bagian")} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <Heading1 className="h-4 w-4" />
          </button>
          <button type="button" title="Sisipkan Heading 3" onClick={() => insert("### Sub Judul")} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <Heading2 className="h-4 w-4" />
          </button>
          <button type="button" title="Sisipkan kutipan" onClick={() => insert("> Kutipan penting")} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Tambahkan gambar"
            onClick={() => {
              const url = window.prompt("Tempel URL gambar (atau unggah dulu melalui form):");
              if (url && url.trim()) onChange(`${value}\n![Gambar](${url.trim()})`);
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
          rows={8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:border-primary"
        />
      </div>
    </div>
  );
}

function PortalCard({ item, onEdit, onToggle, onDelete }: { item: PortalRow; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 text-primary">
              {item.imageUrl ? <img src={item.imageUrl} alt={item.judul} className="h-full w-full object-cover" /> : <LayoutGrid className="h-6 w-6" />}
            </div>
            <div className="min-w-0">
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
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={onToggle} className="gap-2">
              {item.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {item.isPublished ? "Jadikan Draft" : "Terbitkan"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
              <Trash2 className="h-4 w-4" /> Hapus
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}