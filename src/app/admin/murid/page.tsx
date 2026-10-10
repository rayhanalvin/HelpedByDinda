"use client";

import * as React from "react";
import { Search, Edit, Trash2, Phone, School, CheckCircle2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ProfileAvatarPreview, ProfileNamePreview } from "@/components/shared/ProfileAvatarUploader";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { KELAS_GROUPS, KELAS_OPTIONS, getKelasGroup, getKelasLabel, getKelasValue } from "@/lib/kelas";
import { useVisiblePolling } from "@/lib/use-visible-polling";
import { KeyRound, UserPlus } from "lucide-react";
import { PasswordInput } from "@/components/shared/PasswordInput";

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
  createdAt: string;
  idSiswa?: string | null;
  pengelompokan?: string | null;
  namaPanggilan?: string | null;
  jurusan?: string | null;
  kampus?: string | null;
  alamatRumah?: string | null;
  jenisKelas?: string | null;
  metodeBimbel?: string | null;
  jenisBimbingan?: string | null;
  tanggalMulai?: string | null;
  lokasiBimbel?: string | null;
  alamatBimbel?: string | null;
  pengajarId?: string | null;
  catatan?: string | null;
  hargaPendaftaran?: number | null;
  diskonPendaftaran?: number | null;
  defaultPassword?: string | null;
  enrolledKelas?: { id: string; kelas: string; mataPelajaran: string | null; programNama: string | null; isActive: boolean }[];
};

export default function AdminMuridPage() {
  const { toast } = useToast();
  const [muridList, setMuridList] = React.useState<MuridRow[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedKelas, setSelectedKelas] = React.useState<string>("SEMUA");
  const [loading, setLoading] = React.useState(false);
  const defaultKelas = KELAS_OPTIONS.find((option) => option.value.startsWith("SMA"))?.value || "SMA10";
  const [pengajarOptions, setPengajarOptions] = React.useState<{ id: string; name: string }[]>([]);

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
  React.useEffect(() => {
    apiFetch<{ ok: boolean; data: { id: string; name: string }[] }>("/api/admin/pengajar")
      .then((result) => setPengajarOptions(result.data || []))
      .catch(() => undefined);
  }, []);
  useVisiblePolling(() => loadMurid(true), 30000);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [createAccountMode, setCreateAccountMode] = React.useState(false);
  const [formData, setFormData] = React.useState({
    nama: "",
    email: "",
    phone: "",
    kelas: defaultKelas,
    sekolah: "",
    idSiswa: "",
    pengelompokan: "",
    namaPanggilan: "",
    jurusan: "",
    kampus: "",
    alamatRumah: "",
    jenisKelas: "PRIVATE",
    metodeBimbel: "ONLINE",
    jenisBimbingan: "REGULER",
    tanggalMulai: "",
    lokasiBimbel: "",
    alamatBimbel: "",
    pengajarId: "",
    catatan: "",
    hargaPendaftaran: 0,
    diskonPendaftaran: 0,
    enrolledKelas: [] as string[],
    namaWali: "",
    phoneWali: "",
    paketBulanan: 900000,
    password: "",
  });
  const [showDetail, setShowDetail] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importSummary, setImportSummary] = React.useState("");
  const [importing, setImporting] = React.useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = React.useState(false);
  const [accountTarget, setAccountTarget] = React.useState<MuridRow | null>(null);
  const [newPassword, setNewPassword] = React.useState("");
  const [savingPassword, setSavingPassword] = React.useState(false);

  const handleOpenAdd = () => {
    setEditingId(null);
    setCreateAccountMode(false);
    setFormData({
      nama: "",
      email: "",
      phone: "",
      kelas: defaultKelas,
      sekolah: "",
      idSiswa: "",
      pengelompokan: "",
      namaPanggilan: "",
      jurusan: "",
      kampus: "",
      alamatRumah: "",
      jenisKelas: "PRIVATE",
      metodeBimbel: "ONLINE",
      jenisBimbingan: "REGULER",
      tanggalMulai: "",
      lokasiBimbel: "",
      alamatBimbel: "",
      pengajarId: "",
      catatan: "",
      hargaPendaftaran: 0,
      diskonPendaftaran: 0,
      enrolledKelas: [defaultKelas],
      namaWali: "",
      phoneWali: "",
      paketBulanan: 900000,
      password: "",
    });
    setShowDetail(false);
    setIsModalOpen(true);
  };

  const handleOpenAddAccount = () => {
    setEditingId(null);
    setCreateAccountMode(true);
    setFormData({
      nama: "",
      email: "",
      phone: "",
      kelas: defaultKelas,
      sekolah: "",
      idSiswa: "",
      pengelompokan: "",
      namaPanggilan: "",
      jurusan: "",
      kampus: "",
      alamatRumah: "",
      jenisKelas: "PRIVATE",
      metodeBimbel: "ONLINE",
      jenisBimbingan: "REGULER",
      tanggalMulai: "",
      lokasiBimbel: "",
      alamatBimbel: "",
      pengajarId: "",
      catatan: "",
      hargaPendaftaran: 0,
      diskonPendaftaran: 0,
      enrolledKelas: [defaultKelas],
      namaWali: "",
      phoneWali: "",
      paketBulanan: 900000,
      password: "",
    });
    setShowDetail(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: MuridRow) => {
    setEditingId(m.id);
    setCreateAccountMode(false);
    setFormData({
      nama: m.name,
      email: m.email,
      phone: m.phone || "",
      kelas: getKelasValue(m.kelas),
      sekolah: m.sekolah,
      idSiswa: m.idSiswa || "",
      pengelompokan: m.pengelompokan || "",
      namaPanggilan: m.namaPanggilan || "",
      jurusan: m.jurusan || "",
      kampus: m.kampus || "",
      alamatRumah: m.alamatRumah || "",
      jenisKelas: m.jenisKelas || "PRIVATE",
      metodeBimbel: m.metodeBimbel || "ONLINE",
      jenisBimbingan: m.jenisBimbingan || "REGULER",
      tanggalMulai: m.tanggalMulai ? m.tanggalMulai.slice(0, 10) : "",
      lokasiBimbel: m.lokasiBimbel || "",
      alamatBimbel: m.alamatBimbel || "",
      pengajarId: m.pengajarId || "",
      catatan: m.catatan || "",
      hargaPendaftaran: m.hargaPendaftaran || 0,
      diskonPendaftaran: m.diskonPendaftaran || 0,
      enrolledKelas: (m.enrolledKelas || []).map((k) => k.kelas),
      namaWali: m.namaWali || "",
      phoneWali: m.phoneWali || "",
      paketBulanan: m.paketBulanan,
      password: "",
    });
    setShowDetail(true);
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

  const handleOpenAccount = (m: MuridRow) => {
    setAccountTarget(m);
    setNewPassword("");
    setIsAccountModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountTarget || !newPassword.trim()) return;
    setSavingPassword(true);
    try {
      const result = await apiFetch<{ ok: boolean; data: MuridRow }>(`/api/admin/murid/${accountTarget.id}`, {
        method: "PUT",
        body: JSON.stringify({ password: newPassword }),
      });
      setMuridList((prev) => prev.map((m) => (m.id === accountTarget.id ? result.data : m)));
      toast(`Password akun ${accountTarget.name} berhasil diperbarui.`, "success");
      setIsAccountModalOpen(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memperbarui password.", "error");
    } finally {
      setSavingPassword(false);
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
            idSiswa: formData.idSiswa,
            pengelompokan: formData.pengelompokan,
            namaPanggilan: formData.namaPanggilan,
            jurusan: formData.jurusan,
            kampus: formData.kampus,
            alamatRumah: formData.alamatRumah,
            jenisKelas: formData.jenisKelas,
            metodeBimbel: formData.metodeBimbel,
            jenisBimbingan: formData.jenisBimbingan,
            tanggalMulai: formData.tanggalMulai,
            lokasiBimbel: formData.lokasiBimbel,
            alamatBimbel: formData.alamatBimbel,
            pengajarId: formData.pengajarId,
            catatan: formData.catatan,
            hargaPendaftaran: formData.hargaPendaftaran,
            diskonPendaftaran: formData.diskonPendaftaran,
            enrolledKelas: formData.enrolledKelas,
            namaWali: formData.namaWali,
            phoneWali: formData.phoneWali,
            paketBulanan: formData.paketBulanan,
            password: formData.password || undefined,
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
            idSiswa: formData.idSiswa,
            pengelompokan: formData.pengelompokan,
            namaPanggilan: formData.namaPanggilan,
            jurusan: formData.jurusan,
            kampus: formData.kampus,
            alamatRumah: formData.alamatRumah,
            jenisKelas: formData.jenisKelas,
            metodeBimbel: formData.metodeBimbel,
            jenisBimbingan: formData.jenisBimbingan,
            tanggalMulai: formData.tanggalMulai,
            lokasiBimbel: formData.lokasiBimbel,
            alamatBimbel: formData.alamatBimbel,
            pengajarId: formData.pengajarId,
            catatan: formData.catatan,
            hargaPendaftaran: formData.hargaPendaftaran,
            diskonPendaftaran: formData.diskonPendaftaran,
            enrolledKelas: formData.enrolledKelas,
            namaWali: formData.namaWali,
            phoneWali: formData.phoneWali,
            paketBulanan: formData.paketBulanan,
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            password: formData.password || "student123",
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

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleOpenAddAccount} variant="outline" className="font-bold gap-2">
            <UserPlus className="h-4 w-4" /> Buat Akun Murid
          </Button>
          <Button onClick={() => setImportOpen(true)} variant="outline" className="font-bold gap-2">
            <Upload className="h-4 w-4" /> Impor Excel
          </Button>
        </div>
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
                  <th className="py-3.5 px-4">Akun Login</th>
                  <th className="py-3.5 px-4">Terdaftar</th>
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
                          userId={m.userId}
                          className="h-10 w-10 rounded-xl object-cover border border-border"
                        />
                        <div>
                          <ProfileNamePreview role="murid" defaultName={m.name} userId={m.userId} className="font-bold text-foreground" />
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
                    <td className="py-3.5 px-4">
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Aktif
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{m.createdAt ? formatDateIndo(m.createdAt) : "-"}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleOpenAccount(m)} className="h-8 gap-1 text-[11px]">
                          <KeyRound className="h-3.5 w-3.5" /> Akun
                        </Button>
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
                  <p>Terdaftar sejak {m.createdAt ? formatDateIndo(m.createdAt) : "-"}</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => handleOpenAccount(m)} className="text-xs">
                    <KeyRound className="h-3.5 w-3.5" /> Akun
                  </Button>
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
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Ubah Data Murid" : createAccountMode ? "Buat Akun Murid" : "Data Murid Baru"}
        description={createAccountMode ? "Buat akun login murid secara langsung dari admin. Password awal akan digunakan murid untuk login ke portal." : "Lengkapi seluruh data siswa untuk administrasi bimbel. ID Siswa akan dibuat otomatis."}
        className="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
            {editingId ? "Edit data murid lengkap. Semua perubahan tersimpan otomatis ke portal murid dan sinkronisasi jadwal." : "Buat kartu murid lengkap — ID Siswa dibuat otomatis dari system."}
          </div>

          {/* Seksi 1: Identitas Murid */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 bg-muted/40">
              <h4 className="text-xs font-bold text-foreground">Identitas Murid</h4>
              <span className="text-[10px] text-muted-foreground">{formData.idSiswa ? `ID: ${formData.idSiswa}` : "ID otomatis"}</span>
            </div>
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Nama Lengkap *</label>
                  <Input required placeholder="Nama lengkap murid" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Nama Panggilan</label>
                  <Input placeholder="Nama panggilan murid" value={formData.namaPanggilan} onChange={(e) => setFormData({ ...formData, namaPanggilan: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Pengelompokan</label>
                  <Input placeholder="Contoh: SD, SMP, SMA, Mahasiswa" value={formData.pengelompokan} onChange={(e) => setFormData({ ...formData, pengelompokan: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Kelas / Semester</label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-card px-2.5 py-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.kelas}
                    onChange={(e) => {
                      const next = e.target.value;
                      const enrolled = formData.enrolledKelas.includes(next) ? formData.enrolledKelas : [...formData.enrolledKelas, next];
                      setFormData({ ...formData, kelas: next, enrolledKelas: enrolled });
                    }}
                  >
                    {KELAS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Jurusan</label>
                  <Input placeholder="Contoh: IPA, IPS, orali, terbangkan" value={formData.jurusan} onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Sekolah / Kampus</label>
                  <Input placeholder="Nama sekolah atuh kampus" value={formData.sekolah} onChange={(e) => setFormData({ ...formData, sekolah: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Alamat Rumah</label>
                <Input placeholder="Alamat rumah murid" value={formData.alamatRumah} onChange={(e) => setFormData({ ...formData, alamatRumah: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Nomor WhatsApp *</label>
                  <Input placeholder="08xx-xxxx-xxxx" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Email *</label>
                  <Input type="email" required placeholder="email@murid.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          {/* Seksi 2: Informasi Bimbingan */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 bg-muted/40">
              <h4 className="text-xs font-bold text-foreground">Informasi Bimbingan</h4>
            </div>
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Jenis Kelas</label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-card px-2.5 py-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.jenisKelas}
                    onChange={(e) => setFormData({ ...formData, jenisKelas: e.target.value })}
                  >
                    <option value="PRIVATE">Private (1-1)</option>
                    <option value="GROUP">Group (Kelompok)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Metode Bimbel</label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-card px-2.5 py-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.metodeBimbel}
                    onChange={(e) => setFormData({ ...formData, metodeBimbel: e.target.value })}
                  >
                    <option value="ONLINE">Online</option>
                    <option value="OFFLINE">Offline</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Jenis Bimbingan</label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-card px-2.5 py-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.jenisBimbingan}
                    onChange={(e) => setFormData({ ...formData, jenisBimbingan: e.target.value })}
                  >
                    <option value="REGULER">Reguler</option>
                    <option value="TKA">TKA</option>
                    <option value="UTBK">UTBK</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Tanggal Mulai Bimbel</label>
                  <Input type="date" value={formData.tanggalMulai} onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Lokasi Bimbel</label>
                  <Input placeholder="Contoh: Bimbel Dinda, Kampus Utama" value={formData.lokasiBimbel} onChange={(e) => setFormData({ ...formData, lokasiBimbel: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Alamat Bimbel</label>
                <Input placeholder="Alamat lokasi bimbel" value={formData.alamatBimbel} onChange={(e) => setFormData({ ...formData, alamatBimbel: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Pengajar Bimbingan</label>
                <select
                  className="flex h-10 w-full rounded-xl border border-input bg-card px-2.5 py-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={formData.pengajarId}
                  onChange={(e) => setFormData({ ...formData, pengajarId: e.target.value })}
                >
                  <option value="">— Pilih Pengajar —</option>
                  {pengajarOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Catatan admin / pengajar tentang murid..."
                />
              </div>
            </div>
          </div>

          {/* Seksi 3: Enrolment Kelas */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 bg-muted/40">
              <h4 className="text-xs font-bold text-foreground">Kelas / Program Terdaftar</h4>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-[10px] text-muted-foreground">Satu murid dapat mengikuti lebih dari satu kelas tanpa buat akun baru.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto border border-border rounded-xl p-2">
                {KELAS_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={formData.enrolledKelas.includes(option.value)}
                      onChange={(e) => {
                        const classes = e.target.checked ? [...formData.enrolledKelas, option.value] : formData.enrolledKelas.filter((k) => k !== option.value);
                        setFormData({ ...formData, enrolledKelas: classes });
                      }}
                    />
                    <span className="truncate">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Seksi 4: Informasi Biaya + Wali */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 bg-muted/40">
              <h4 className="text-xs font-bold text-foreground">Biaya & Kontak Wali</h4>
            </div>
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Special Diskon Pendaftaran (Rp)</label>
                  <Input type="number" min={0} value={formData.diskonPendaftaran} onChange={(e) => setFormData({ ...formData, diskonPendaftaran: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Harga Pendaftaran (Rp)</label>
                  <Input type="number" min={0} value={formData.hargaPendaftaran} onChange={(e) => setFormData({ ...formData, hargaPendaftaran: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Harga / Bulan SPP (Rp)</label>
                  <Input type="number" min={0} value={formData.paketBulanan} onChange={(e) => setFormData({ ...formData, paketBulanan: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Nama Wali</label>
                  <Input value={formData.namaWali} onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">WhatsApp Wali</label>
                  <Input value={formData.phoneWali} onChange={(e) => setFormData({ ...formData, phoneWali: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          {createAccountMode && (
            <div className="space-y-1.5 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <label className="text-xs font-semibold text-foreground">Password Awal Login</label>
              <PasswordInput
                required
                placeholder="Minimal 8 karakter"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">Murid dapat mengganti password sendiri setelah login melalui menu profil. Password ini disimpan sebagai Password Awal.</p>
            </div>
          )}

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="accent" className="font-bold">
              {createAccountMode ? "Buat Akun & Simpan" : "Simpan Data Murid"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Reset Password */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={`Akun Login ${accountTarget?.name || "Murid"}`}
        description={accountTarget ? `Email login: ${accountTarget.email}. Gunakan form ini untuk mereset password murid.` : ""}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
            Akun ini dapat digunakan murid untuk login ke portal murid. Password akan disimpan secara aman (terenkripsi).
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Password Baru</label>
            <PasswordInput required minLength={8} placeholder="Minimal 8 karakter" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAccountModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="accent" isLoading={savingPassword}>
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Impor Excel */}
      <Modal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Impor Data Murid dari Excel"
        description="Load file .xlsx/.xls dengan kolom sesuai basis data poslalu. Kolom yang dipahami: Nama Lengkap, Email, WhatsApp, Kelas, Sekolah, Nama Wali, WhatsApp Wali, Harga/Bulan, ID Siswa, Jurusan, Kampus, Pengajar, Catatan, Harga Pendaftaran, Diskon Pendaftaran, Password Awal."
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
            Jika email belum terdaftar, murid baru akan dibuat otomatis dengan Password Awal default <strong>student123</strong> (atau kolom Password Awal bila ada).
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">File Excel (.xlsx / .xls)</label>
            <input
              type="file"
              id="excel-import-file"
              accept=".xlsx,.xls"
              className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm file-input"
            />
          </div>
          {importSummary && (
            <div className={`rounded-xl border p-3 text-xs ${importSummary.startsWith("Impor berhasil") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              {importSummary}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
              Batal
            </Button>
            <Button
              variant="accent"
              isLoading={importing}
              onClick={async () => {
                const fileInput = document.getElementById("excel-import-file") as HTMLInputElement | null;
                if (!fileInput?.files?.length) {
                  toast("Pilih file Excel dahulu.", "error");
                  return;
                }
                setImporting(true);
                setImportSummary("");
                try {
                  const file = fileInput.files[0];
                  const buffer = await file.arrayBuffer();
                  const bytes = new Uint8Array(buffer);
                  let binary = "";
                  const chunk = 0x8000;
                  for (let i = 0; i < bytes.length; i += chunk) {
                    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
                  }
                  const base64 = `data:${file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"};base64,${btoa(binary)}`;
                  const result = await apiFetch<{ ok: boolean; message: string }>("/api/admin/murid/import", {
                    method: "POST",
                    body: JSON.stringify({ file: base64 }),
                  });
                  setImportSummary(result.message);
                  void loadMurid(true);
                  if (result.message.startsWith("Impor berhasil")) toast(result.message, "success");
                  else toast(result.message, "info");
                } catch (error) {
                  setImportSummary(error instanceof Error ? error.message : "Impor Excel gagal.");
                } finally {
                  setImporting(false);
                }
              }}
              className="font-bold gap-2"
            >
              <Upload className="h-4 w-4" /> Impor Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
