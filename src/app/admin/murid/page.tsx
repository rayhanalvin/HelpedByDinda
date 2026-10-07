"use client";

import * as React from "react";
import { GraduationCap, Plus, Search, Edit, Trash2, Phone, School, CheckCircle2, AlertCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ProfileAvatarPreview, ProfileNamePreview } from "@/components/shared/ProfileAvatarUploader";
import { formatRupiah } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { KELAS_GROUPS, KELAS_OPTIONS, getKelasGroup, getKelasLabel, getKelasValue } from "@/lib/kelas";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type MuridRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  kelas: string;
  sekolah: string;
  namaWali: string | null;
  phoneWali: string | null;
  paketBulanan: number;
  statusBayarBulanIni: string;
  isActive: boolean;
};

export default function AdminMuridPage() {
  const { toast } = useToast();
  const [muridList, setMuridList] = React.useState<MuridRow[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedKelas, setSelectedKelas] = React.useState<string>("SEMUA");
  const [loading, setLoading] = React.useState(false);
  const defaultKelas = KELAS_OPTIONS.find((option) => option.value.startsWith("SMA"))?.value || "SMA10";

  const loadMurid = React.useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const result = await apiFetch<{ ok: boolean; data: MuridRow[] }>("/api/admin/murid");
        setMuridList(result.data || []);
      } catch (error) {
        if (!silent) toast(error instanceof Error ? error.message : "Gagal memuat data murid.", "error");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [toast],
  );
  React.useEffect(() => {
    void loadMurid();
  }, [loadMurid]);
  useVisiblePolling(() => loadMurid(true), 30000);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    nama: "",
    email: "",
    phone: "",
    kelas: defaultKelas,
    sekolah: "",
    namaWali: "",
    phoneWali: "",
    paketBulanan: 900000,
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      nama: "",
      email: "",
      phone: "",
      kelas: defaultKelas,
      sekolah: "",
      namaWali: "",
      phoneWali: "",
      paketBulanan: 900000,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: MuridRow) => {
    setEditingId(m.id);
    setFormData({
      nama: m.name,
      email: m.email,
      phone: m.phone || "",
      kelas: getKelasValue(m.kelas),
      sekolah: m.sekolah,
      namaWali: m.namaWali || "",
      phoneWali: m.phoneWali || "",
      paketBulanan: m.paketBulanan,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data murid ini?")) return;

    try {
      await apiFetch(`/api/admin/murid/${id}`, { method: "DELETE" });
      setMuridList((prev) => prev.filter((m) => m.id !== id));
      toast("Data murid berhasil dihapus.", "info");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menghapus murid.", "error");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const result = await apiFetch<{ ok: boolean; data: MuridRow }>(`/api/admin/murid/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: formData.nama,
            email: formData.email,
            phone: formData.phone,
            kelas: formData.kelas,
            sekolah: formData.sekolah,
            namaWali: formData.namaWali,
            phoneWali: formData.phoneWali,
            paketBulanan: formData.paketBulanan,
          }),
        });

        setMuridList((prev) => prev.map((m) => (m.id === editingId ? result.data : m)));
        toast("Data murid berhasil diperbarui!", "success");
      } else {
        const result = await apiFetch<{ ok: boolean; data: MuridRow }>("/api/admin/murid", {
          method: "POST",
          body: JSON.stringify({
            name: formData.nama,
            email: formData.email,
            phone: formData.phone,
            kelas: formData.kelas,
            sekolah: formData.sekolah,
            namaWali: formData.namaWali,
            phoneWali: formData.phoneWali,
            paketBulanan: formData.paketBulanan,
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            password: "student123",
          }),
        });

        setMuridList((prev) => [result.data, ...prev]);
        toast("Murid baru berhasil ditambahkan!", "success");
      }
      setIsModalOpen(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan data murid.", "error");
    }
  };

  const filtered = muridList.filter((m) => {
    const matchKelas = selectedKelas === "SEMUA" || getKelasGroup(m.kelas) === selectedKelas;
    const matchSearch = (m.name || "").toLowerCase().includes(search.toLowerCase()) || (m.sekolah || "").toLowerCase().includes(search.toLowerCase()) || (m.email || "").toLowerCase().includes(search.toLowerCase());
    return matchKelas && matchSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Kelola Data Murid</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Data lengkap seluruh siswa bimbingan belajar, informasi sekolah, dan kontak wali.</p>
        </div>

        <Button onClick={handleOpenAdd} variant="accent" className="font-bold gap-2">
          <Plus className="h-4 w-4" /> Tambah Murid Baru
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Input placeholder="Cari murid, sekolah, atau email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {["SEMUA", ...KELAS_GROUPS.map((group) => group.value)].map((k) => (
            <button
              key={k}
              onClick={() => setSelectedKelas(k)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${selectedKelas === k ? "bg-primary text-white shadow-xs" : "bg-muted text-muted-foreground hover:bg-border"}`}
            >
              {k === "SEMUA" ? "Semua Jenjang" : KELAS_GROUPS.find((group) => group.value === k)?.label || k}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Students */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase font-semibold text-muted-foreground bg-muted/30">
                <tr>
                  <th className="py-3.5 px-4">Murid</th>
                  <th className="py-3.5 px-4">Jenjang & Sekolah</th>
                  <th className="py-3.5 px-4">Kontak Wali</th>
                  <th className="py-3.5 px-4">Paket SPP</th>
                  <th className="py-3.5 px-4">Status Bayar</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <ProfileAvatarPreview
                          role="murid"
                          defaultAvatarUrl={m.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                          name={m.name}
                          userId={Number(m.userId)}
                          className="h-10 w-10 rounded-xl object-cover border border-border"
                        />
                        <div>
                          <ProfileNamePreview role="murid" defaultName={m.name} userId={Number(m.userId)} className="font-bold text-foreground" />
                          <p className="text-xs text-muted-foreground">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="secondary" className="text-xs mb-0.5">
                        {getKelasLabel(m.kelas)}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{m.sekolah}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <p className="font-semibold text-foreground">{m.namaWali}</p>
                      <p className="text-muted-foreground">{m.phoneWali}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground tabular-nums text-xs">{formatRupiah(m.paketBulanan)}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={m.statusBayarBulanIni === "dibayar" ? "success" : "warning"}>{m.statusBayarBulanIni.toUpperCase()}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(m)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)} className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
            {filtered.map((m) => (
              <div key={m.id} className="p-4 rounded-2xl border border-border bg-card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img src={m.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} alt={m.name} className="h-10 w-10 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{m.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {getKelasLabel(m.kelas)} • {m.sekolah}
                      </p>
                    </div>
                  </div>
                  <Badge variant={m.statusBayarBulanIni === "SUCCESS" || m.statusBayarBulanIni === "dibayar" ? "success" : "warning"}>{String(m.statusBayarBulanIni).toUpperCase()}</Badge>
                </div>

                <div className="text-xs text-muted-foreground border-t border-border pt-2 space-y-1">
                  <p>
                    Wali: <strong className="text-foreground">{m.namaWali}</strong> ({m.phoneWali})
                  </p>
                  <p>
                    Paket SPP: <strong className="text-foreground">{formatRupiah(m.paketBulanan)}/bln</strong>
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(m)} className="text-xs">
                    Edit Data
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)} className="text-xs text-rose-600 hover:bg-rose-50">
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading && <div className="text-sm text-muted-foreground">Memuat data murid...</div>}

      {/* Modal Tambah / Edit Murid */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Ubah Data Murid" : "Tambah Murid Baru"} description="Lengkapi data siswa dan kontak wali untuk administrasi bimbel.">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Nama Lengkap Murid</label>
            <Input required placeholder="Contoh: Rizky Maulana" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email Murid</label>
              <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">WhatsApp Murid</label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Jenjang Kelas</label>
              <select
                className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={formData.kelas}
                onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
              >
                {KELAS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Asal Sekolah</label>
              <Input value={formData.sekolah} onChange={(e) => setFormData({ ...formData, sekolah: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Nama Wali Murid</label>
              <Input value={formData.namaWali} onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">WhatsApp Wali</label>
              <Input value={formData.phoneWali} onChange={(e) => setFormData({ ...formData, phoneWali: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Biaya Paket Bulanan (Rp)</label>
            <Input type="number" value={formData.paketBulanan} onChange={(e) => setFormData({ ...formData, paketBulanan: Number(e.target.value) })} />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="accent" className="font-bold">
              Simpan Data Murid
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
