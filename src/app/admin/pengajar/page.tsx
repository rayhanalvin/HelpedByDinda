"use client";

import * as React from "react";
import { Users, Plus, Search, Edit, Trash2, Clock, CheckCircle2, Coins, Briefcase, RefreshCw, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ProfileAvatarPreview, ProfileNamePreview } from "@/components/shared/ProfileAvatarUploader";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type PengajarRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  spesialisasi: string;
  nominalPerJam: number;
  ratePerSession: number;
  money: string | null;
  bio: string | null;
  isActive: boolean;
  totalJamBulanIni: number;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  rateSessions: { kelasGroup: string; mode: "ONLINE" | "OFFLINE"; rate: number }[];
  createdAt: string;
};

const RATE_GROUPS = [
  { value: "SD", label: "SD Kelas 1–6" },
  { value: "SMP", label: "SMP Kelas 7–9" },
  { value: "SMA_SMK", label: "SMA/SMK Kelas 10–12" },
  { value: "MAHASISWA", label: "Mahasiswa Semester 1–8" },
  { value: "UTBK", label: "UTBK / Persiapan" },
];

const RATE_MODES = ["ONLINE", "OFFLINE"] as const;

export default function AdminPengajarPage() {
  const { toast } = useToast();
  const [pengajarList, setPengajarList] = React.useState<PengajarRow[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const loadPengajar = React.useCallback(
    async (silent = false) => {
      if (silent) setIsRefreshing(true);
      try {
        if (!silent) setLoading(true);
        const result = await apiFetch<{ ok: boolean; data: PengajarRow[] }>("/api/admin/pengajar");
        setPengajarList(result.data || []);
      } catch (error) {
        if (!silent) toast(error instanceof Error ? error.message : "Gagal memuat data pengajar.", "error");
      } finally {
        if (!silent) setLoading(false);
        if (silent) setIsRefreshing(false);
      }
    },
    [toast],
  );

  React.useEffect(() => {
    void loadPengajar();
  }, [loadPengajar]);
  useVisiblePolling(() => loadPengajar(true), 30000);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    nama: "",
    email: "",
    phone: "",
    spesialisasi: "",
    nominalPerJam: 75000,
    ratePerSession: 75000,
    money: "",
    bio: "",
    password: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
    rateSessions: [] as { kelasGroup: string; mode: "ONLINE" | "OFFLINE"; rate: number }[],
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      nama: "",
      email: "",
      phone: "",
      spesialisasi: "",
      nominalPerJam: 75000,
      ratePerSession: 75000,
      money: "",
      bio: "",
      password: "",
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: "",
      rateSessions: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PengajarRow) => {
    setEditingId(p.id);
    setFormData({
      nama: p.name,
      email: p.email,
      phone: p.phone || "",
      spesialisasi: p.spesialisasi,
      nominalPerJam: p.nominalPerJam,
      ratePerSession: p.ratePerSession || p.nominalPerJam,
      money: p.money || "",
      bio: p.bio || "",
      password: "",
      bankName: p.bankName || "",
      bankAccountNumber: p.bankAccountNumber || "",
      bankAccountName: p.bankAccountName || "",
      rateSessions: p.rateSessions || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus tutor pengajar ini?")) return;

    try {
      await apiFetch(`/api/admin/pengajar/${id}`, { method: "DELETE" });
      setPengajarList((prev) => prev.filter((p) => p.id !== id));
      toast("Pengajar berhasil dihapus dari sistem.", "info");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menghapus pengajar.", "error");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const result = await apiFetch<{ ok: boolean; data: PengajarRow }>(`/api/admin/pengajar/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: formData.nama,
            email: formData.email,
            phone: formData.phone,
            spesialisasi: formData.spesialisasi,
            nominalPerJam: formData.nominalPerJam,
            ratePerSession: formData.ratePerSession,
            money: formData.money,
            bio: formData.bio,
            password: formData.password || undefined,
            bankName: formData.bankName,
            bankAccountNumber: formData.bankAccountNumber,
            bankAccountName: formData.bankAccountName,
            rateSessions: formData.rateSessions,
          }),
        });

        setPengajarList((prev) => prev.map((p) => (p.id === editingId ? result.data : p)));
        toast("Data pengajar dan tarif fee berhasil diperbarui!", "success");
      } else {
        const result = await apiFetch<{ ok: boolean; data: PengajarRow }>("/api/admin/pengajar", {
          method: "POST",
          body: JSON.stringify({
            name: formData.nama,
            email: formData.email,
            phone: formData.phone,
            spesialisasi: formData.spesialisasi,
            nominalPerJam: formData.nominalPerJam,
            ratePerSession: formData.ratePerSession,
            money: formData.money,
            bio: formData.bio,
            password: formData.password || "teacher123",
            avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            bankName: formData.bankName,
            bankAccountNumber: formData.bankAccountNumber,
            bankAccountName: formData.bankAccountName,
            rateSessions: formData.rateSessions,
          }),
        });

        setPengajarList((prev) => [result.data, ...prev]);
        toast("Tutor pengajar baru berhasil ditambahkan!", "success");
      }
      setIsModalOpen(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan data pengajar.", "error");
    }
  };

  const filtered = pengajarList.filter((p) => {
    const query = search.toLowerCase();
    return (p.name || "").toLowerCase().includes(query) || (p.email || "").toLowerCase().includes(query) || (p.phone || "").toLowerCase().includes(query) || (p.spesialisasi || "").toLowerCase().includes(query);
  });
  const activeCount = pengajarList.filter((p) => p.isActive).length;
  const inactiveCount = pengajarList.length - activeCount;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Data & Tarif Pengajar</h1>
            <Badge variant="outline" className={`gap-1.5 text-[10px] ${isRefreshing ? "border-primary text-primary" : "text-emerald-700"}`}>
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Menyinkronkan" : "Data live"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Atur nominal rate fee per jam untuk setiap pengajar dan kelola profil tutor.</p>
        </div>

        <Button onClick={handleOpenAdd} variant="accent" className="font-bold gap-2">
          <Plus className="h-4 w-4" /> Tambah Pengajar Baru
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="text-primary" size={20} />
            <div>
              <p className="text-xs text-muted-foreground">Total pengajar</p>
              <p className="font-heading text-xl font-bold">{pengajarList.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserCheck className="text-emerald-600" size={20} />
            <div>
              <p className="text-xs text-muted-foreground">Pengajar aktif</p>
              <p className="font-heading text-xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserX className="text-rose-600" size={20} />
            <div>
              <p className="text-xs text-muted-foreground">Nonaktif</p>
              <p className="font-heading text-xl font-bold">{inactiveCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-md">
        <Input placeholder="Cari nama pengajar atau spesialisasi..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table & Cards */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-0">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase font-semibold text-muted-foreground bg-muted/30">
                <tr>
                  <th className="py-3.5 px-4">Pengajar</th>
                  <th className="py-3.5 px-4">Spesialisasi Mapel</th>
                  <th className="py-3.5 px-4">Kontak Telepon</th>
                  <th className="py-3.5 px-4">Tarif Fee / Sesi</th>
                  <th className="py-3.5 px-4">Jam Mengajar Bulan Ini</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Terdaftar</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <ProfileAvatarPreview
                          role="pengajar"
                          defaultAvatarUrl={p.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"}
                          name={p.name}
                          userId={p.userId}
                          className="h-10 w-10 rounded-xl object-cover border border-border"
                        />
                        <div>
                          <ProfileNamePreview role="pengajar" defaultName={p.name} userId={p.userId} className="font-bold text-foreground" />
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">{p.spesialisasi}</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{p.phone}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-emerald-700 tabular-nums">{formatRupiah(p.ratePerSession || p.nominalPerJam)} / sesi</div>
                      {p.rateSessions && p.rateSessions.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.rateSessions.slice(0, 3).map((rate) => (
                            <span key={`${rate.kelasGroup}-${rate.mode}`} className="rounded-md bg-muted px-1.5 py-0.5 text-[9.5px] font-medium text-muted-foreground">
                              {rate.kelasGroup} • {formatRupiah(rate.rate)}
                            </span>
                          ))}
                          {p.rateSessions.length > 3 && <span className="text-[9.5px] text-muted-foreground">+{p.rateSessions.length - 3}</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-foreground">{p.totalJamBulanIni} Jam</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={p.isActive ? "success" : "secondary"}>{p.isActive ? "AKTIF" : "NONAKTIF"}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{p.createdAt ? formatDateIndo(p.createdAt) : "-"}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(p)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
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
            {filtered.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl border border-border bg-card space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={p.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"} alt={p.name} className="h-10 w-10 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{p.name}</h4>
                    </div>
                  </div>
                  <Badge variant={p.isActive ? "success" : "secondary"}>{p.isActive ? "AKTIF" : "NONAKTIF"}</Badge>
                </div>

                <div className="text-xs text-muted-foreground border-t border-border pt-2 space-y-1">
                  <p>
                    Rate Sesi: <strong className="text-emerald-700">{formatRupiah(p.ratePerSession || p.nominalPerJam)}/sesi</strong>
                  </p>
                  {p.rateSessions && p.rateSessions.length > 0 && (
                    <p className="flex flex-wrap gap-1">
                      {p.rateSessions.slice(0, 3).map((rate) => (
                        <span key={`${rate.kelasGroup}-${rate.mode}`} className="rounded-md bg-muted px-1.5 py-0.5 text-[9.5px] font-medium text-muted-foreground">
                          {rate.kelasGroup} {rate.mode === "OFFLINE" ? "Off" : "On"} {formatRupiah(rate.rate)}
                        </span>
                      ))}
                    </p>
                  )}
                  <p>
                    Total Jam Mengajar: <strong className="text-foreground">{p.totalJamBulanIni} Jam</strong>
                  </p>
                  <p>Terdaftar sejak {p.createdAt ? formatDateIndo(p.createdAt) : "-"}</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(p)} className="text-xs">
                    Atur Rate & Profil
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-xs text-rose-600 hover:bg-rose-50">
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal Tambah / Edit Pengajar */}
      {loading && <div className="text-sm text-muted-foreground">Memuat data pengajar...</div>}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Ubah Data Pengajar & Rate" : "Tambah Pengajar Baru"} description="Pengaturan rate honor per jam dan keahlian mengajar tutor.">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Nama Pengajar & Gelar</label>
            <Input required placeholder="Contoh: Budi Santoso, S.Si." value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email</label>
              <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">WhatsApp</label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Spesialisasi Mapel</label>
              <Input required placeholder="Contoh: Matematika SMA & UTBK" value={formData.spesialisasi} onChange={(e) => setFormData({ ...formData, spesialisasi: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Tarif Standar / Sesi (Rp)</label>
              <Input type="number" required value={formData.ratePerSession} onChange={(e) => setFormData({ ...formData, ratePerSession: Number(e.target.value) })} />
            </div>
          </div>

          <div className="space-y-3 border border-border rounded-2xl bg-muted/20 p-4">
            <div>
              <p className="text-sm font-bold text-foreground">Tarif Mengajar per Kelas & Mode</p>
              <p className="text-xs text-muted-foreground">Setel rate honor berbeda untuk setiap kombinasi jenjang kelas (SD, SMP, SMA, Mahasiswa, UTBK) dan mode (Online / Offline). Tarif ini digunakan untuk sinkronisasi fee pengajar.</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {RATE_GROUPS.map((group) => (
                <div key={group.value} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2.5">
                  <span className="w-40 shrink-0 text-xs font-semibold text-foreground truncate">{group.label}</span>
                  {RATE_MODES.map((mode) => {
                    const current = formData.rateSessions.find((rate) => rate.kelasGroup === group.value && rate.mode === mode);
                    const value = current?.rate ?? formData.ratePerSession;
                    return (
                      <div key={mode} className="flex items-center gap-1.5 flex-1">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase w-14">{mode === "ONLINE" ? "Online" : "Offline"}</span>
                        <Input
                          type="number"
                          min={0}
                          step={5000}
                          value={value}
                          className="h-8 text-xs"
                          onChange={(e) => {
                            const next = [...formData.rateSessions];
                            const index = next.findIndex((rate) => rate.kelasGroup === group.value && rate.mode === mode);
                            const rateValue = Number(e.target.value);
                            if (index >= 0) {
                              next[index] = { ...next[index], rate: rateValue };
                            } else {
                              next.push({ kelasGroup: group.value, mode, rate: rateValue });
                            }
                            setFormData({ ...formData, rateSessions: next });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Gelar / Honor (opsional)</label>
            <Input placeholder="Contoh: Rp 1.250.000 / bulan" value={formData.money} onChange={(e) => setFormData({ ...formData, money: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Password Login Pengajar</label>
            <PasswordInput required={!editingId} placeholder="Masukkan password untuk login pengajar" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Bio Pengajar Singkat</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-3 border-t border-border pt-3">
            <p className="text-xs font-bold text-foreground">Rekening Penerimaan Fee</p>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Nama bank" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} />
              <Input placeholder="Nomor rekening" value={formData.bankAccountNumber} onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })} />
              <Input placeholder="Nama pemilik rekening" value={formData.bankAccountName} onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })} />
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="accent" className="font-bold">
              Simpan Data Pengajar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
