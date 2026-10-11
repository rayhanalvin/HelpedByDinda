"use client";

import * as React from "react";
import { CalendarDays, CalendarClock, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Repeat, Trash2, Clock, Video, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type AvailabilityRule = {
  id: string;
  pengajarId: string;
  pengajarNama?: string;
  jenis: "RUTINE" | "SPECIFIK";
  status: "TERSEDIA" | "TIDAK_TERSEDIA";
  hari: string | null;
  tanggal: string | null;
  jamMulai: string;
  jamSelesai: string;
  mode: "ONLINE" | "OFFLINE";
  ruangan: string | null;
  catatan: string | null;
  isActive: boolean;
};

type PengajarOpt = { id: string; name: string };

const HARI_OPTIONS = [
  { value: "MON", label: "Senin" },
  { value: "TUE", label: "Selasa" },
  { value: "WED", label: "Rabu" },
  { value: "THU", label: "Kamis" },
  { value: "FRI", label: "Jumat" },
  { value: "SAT", label: "Sabtu" },
  { value: "SUN", label: "Minggu" },
];

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateIndoShort(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

function buildCells(year: number, month: number): { key: string; inMonth: boolean }[] {
  const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const gridStart = new Date(Date.UTC(year, month, 1 - offset));
  const cells: { key: string; inMonth: boolean }[] = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    cells.push({ key: date.toISOString().slice(0, 10), inMonth: date.getUTCMonth() === month });
  }
  return cells;
}

type DayStatus = { status: "green" | "red" | "gray"; rules: AvailabilityRule[] };

export default function AdminAvailabilityPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [rules, setRules] = React.useState<AvailabilityRule[]>([]);
  const [jadwalMap, setJadwalMap] = React.useState<Record<string, number>>({});
  const [pengajarList, setPengajarList] = React.useState<PengajarOpt[]>([]);
  const [selectedPengajarId, setSelectedPengajarId] = React.useState("");
  const [monthKey, setMonthKey] = React.useState(() => monthKeyOf(new Date()));
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [form, setForm] = React.useState({
    pengajarId: "",
    jenis: "RUTINE" as "RUTINE" | "SPECIFIK",
    status: "TERSEDIA" as "TERSEDIA" | "TIDAK_TERSEDIA",
    hari: "MON",
    tanggal: "",
    jamMulai: "16:00",
    jamSelesai: "17:30",
    mode: "ONLINE" as "ONLINE" | "OFFLINE",
    ruangan: "",
    catatan: "",
  });

  const loadData = React.useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      if (silent) setIsRefreshing(true);
      try {
        const [resRules, resPengajar, resJadwal] = await Promise.all([
          apiFetch<{ ok: boolean; data: AvailabilityRule[] }>("/api/admin/pengajar-availability"),
          apiFetch<{ ok: boolean; data: { id: string; name: string }[] }>("/api/admin/pengajar"),
          apiFetch<{ ok: boolean; data: { pengajarId: string; tanggal: string; kelompokId: string | null }[] }>("/api/admin/jadwal"),
        ]);
        if (resRules.ok) setRules(resRules.data);
        if (resJadwal.ok) {
          const map: Record<string, number> = {};
          for (const item of resJadwal.data) {
            const key = `${item.pengajarId}:${item.tanggal.slice(0, 10)}`;
            map[key] = (map[key] || 0) + 1;
          }
          setJadwalMap(map);
        }
        if (resPengajar.ok) {
          setPengajarList(resPengajar.data);
          setSelectedPengajarId((current) => current || resPengajar.data[0]?.id || "");
        }
      } catch {
        if (!silent) toast("Gagal memuat data ketersediaan.", "error");
      } finally {
        if (!silent) setLoading(false);
        if (silent) setTimeout(() => setIsRefreshing(false), 800);
      }
    },
    [toast],
  );

  React.useEffect(() => {
    void loadData();
  }, [loadData]);
  useVisiblePolling(() => loadData(true), 30000);

  const openAdd = (pengajarId?: string) => {
    setEditingId(null);
    setForm({
      pengajarId: pengajarId || selectedPengajarId,
      jenis: "RUTINE",
      status: "TERSEDIA",
      hari: "MON",
      tanggal: "",
      jamMulai: "16:00",
      jamSelesai: "17:30",
      mode: "ONLINE",
      ruangan: "",
      catatan: "",
    });
    setModalOpen(true);
  };

  const openEdit = (rule: AvailabilityRule) => {
    setEditingId(rule.id);
    setForm({
      pengajarId: rule.pengajarId,
      jenis: rule.jenis,
      status: rule.status,
      hari: rule.hari || "MON",
      tanggal: rule.tanggal ? rule.tanggal.slice(0, 10) : "",
      jamMulai: rule.jamMulai,
      jamSelesai: rule.jamSelesai,
      mode: rule.mode,
      ruangan: rule.ruangan || "",
      catatan: rule.catatan || "",
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pengajarId) {
      toast("Pilih pengajar terlebih dahulu.", "error");
      return;
    }
    if (form.jamMulai >= form.jamSelesai) {
      toast("Jam mulai harus sebelum jam selesai.", "error");
      return;
    }
    try {
      if (editingId) {
        await apiFetch(`/api/admin/pengajar-availability/${editingId}`, { method: "PUT", body: JSON.stringify(form) });
        toast("Ketersediaan pengajar diperbarui.", "success");
      } else {
        await apiFetch("/api/admin/pengajar-availability", { method: "POST", body: JSON.stringify(form) });
        toast("Ketersediaan pengajar berhasil dibuat.", "success");
      }
      setModalOpen(false);
      void loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menyimpan ketersediaan.", "error");
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Hapus aturan ketersediaan ini?")) return;
    apiFetch(`/api/admin/pengajar-availability/${id}`, { method: "DELETE" })
      .then(() => {
        toast("Aturan ketersediaan dihapus.", "success");
        void loadData();
      })
      .catch((err) => toast(err instanceof Error ? err.message : "Gagal menghapus aturan.", "error"));
  };

  const toggleActive = (rule: AvailabilityRule) => {
    apiFetch(`/api/admin/pengajar-availability/${rule.id}`, { method: "PUT", body: JSON.stringify({ isActive: !rule.isActive }) })
      .then(() => {
        toast(rule.isActive ? "Aturan dinonaktifkan." : "Aturan diaktifkan kembali.", "success");
        void loadData();
      })
      .catch((err) => toast(err instanceof Error ? err.message : "Gagal mengubah status aturan.", "error"));
  };

  const [year, month] = monthKey.split("-").map(Number);
  const cells = buildCells(year, month);
  const pengajarRules = rules.filter((rule) => rule.pengajarId === selectedPengajarId && rule.isActive);
  const selectedPengajar = pengajarList.find((p) => p.id === selectedPengajarId);

  const dayStatusMap = React.useMemo(() => {
    const map = new Map<string, DayStatus>();
    for (const cell of cells) {
      if (!cell.inMonth) continue;
      const dayRules = pengajarRules.filter((rule) => {
        if (rule.status === "TIDAK_TERSEDIA" && rule.jenis === "SPECIFIK" && rule.tanggal === cell.key) return true;
        if (rule.jenis === "RUTINE") return rule.hari === DAY_LABELS_TO_CODE[new Date(`${cell.key}T00:00:00Z`).getUTCDay()];
        return false;
      });
      const hasJadwal = (jadwalMap[`${selectedPengajarId}:${cell.key}`] || 0) > 0;
      const hasUnavailable = dayRules.some((r) => r.status === "TIDAK_TERSEDIA");
      if (hasJadwal) map.set(cell.key, { status: "red", rules: dayRules });
      else if (hasUnavailable) map.set(cell.key, { status: "gray", rules: dayRules });
      else if (dayRules.length) map.set(cell.key, { status: "green", rules: dayRules });
      else map.set(cell.key, { status: "gray", rules: [] });
    }
    return map;
  }, [cells, pengajarRules, jadwalMap, selectedPengajarId]);

  const rotateMonth = (direction: number) => {
    const next = new Date(Date.UTC(year, month - 1 + direction, 1));
    setMonthKey(monthKeyOf(next));
  };

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Ketersediaan Jadwal Pengajar</h1>
            <Badge variant="outline" className={`text-[10px] gap-1 px-2.5 transition-all ${isRefreshing ? "border-primary text-primary" : "text-emerald-700"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isRefreshing ? "bg-primary animate-ping" : "bg-emerald-500"}`} />
              {isRefreshing ? "Menyinkronkan..." : "Real-time aktif"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kelola ketersediaan jadwal tiap pengajar. Jadwal mengajar yang sudah tercatat otomatis tampil sebagai Terisi — tidak perlu dimasukkan ulang.
          </p>
        </div>
        <Button variant="accent" onClick={() => openAdd()} className="font-bold gap-2">
          <Plus className="h-4 w-4" /> Tambah Ketersediaan
        </Button>
      </div>

      {/* Pilih pengajar */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-semibold text-foreground">Filter Pengajar:</label>
        <select
          value={selectedPengajarId}
          onChange={(e) => setSelectedPengajarId(e.target.value)}
          className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground shadow-sm flex-1 min-w-40 max-w-sm"
        >
          {pengajarList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Input type="month" className="w-auto" value={monthKey} onChange={(e) => e.target.value && setMonthKey(e.target.value)} />
      </div>

      {/* Kalender bulanan */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" /> Kalender {selectedPengajar?.name || "Pengajar"}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => rotateMonth(-1)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" aria-label="Bulan sebelumnya">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-foreground min-w-32 text-center capitalize">
              {new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1)))}
            </span>
            <button type="button" onClick={() => rotateMonth(1)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" aria-label="Bulan berikutnya">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1 text-center">
          {DAY_LABELS.map((label) => (
            <div key={label} className="text-[9px] font-bold uppercase text-muted-foreground py-1">
              {label}
            </div>
          ))}
          {cells.map((cell) => {
            if (!cell.inMonth) return <div key={cell.key} className="py-1.5" />;
            const day = dayStatusMap.get(cell.key);
            const isToday = cell.key === todayKey;
            return (
              <div
                key={cell.key}
                className={`relative flex min-h-9 flex-col items-center justify-center rounded-lg py-1 text-[10px] font-semibold ${
                  !day || (day.status === "gray" && !day.rules.length)
                    ? "bg-muted text-muted-foreground opacity-50"
                    : day.status === "green"
                      ? "bg-emerald-500/90 text-white"
                      : day.status === "red"
                        ? "bg-rose-500/90 text-white"
                        : "bg-slate-400/90 text-white"
                } ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}`}
                title={day?.rules.map((r) => `${r.status === "TIDAK_TERSEDIA" ? "Tidak tersedia" : "Tersedia"} ${r.jamMulai}-${r.jamSelesai}`).join("; ") || "Belum diatur"}
              >
                <span className="tabular-nums">{Number(cell.key.slice(8, 10))}</span>
                {day?.status === "red" && <span className="text-[8px] font-bold">{jadwalMap[`${selectedPengajarId}:${cell.key}`] || 0} sesi</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Tersedia diatur
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Terisi jadwal mengajar
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Tidak tersedia / Agenda lain
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-muted border border-border" /> Belum diatur
          </span>
        </div>
      </div>

      {/* Daftar aturan */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Memuat ketersediaan pengajar...
        </div>
      ) : pengajarRules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground">Belum ada aturan ketersediaan untuk pengajar ini</h3>
          <p className="text-xs text-muted-foreground mt-1">Tambah aturan rutin (hari tertentu tiap minggu) atau khusus (tanggal tertentu), termasuk status Tidak Tersedia untuk agenda lain.</p>
          <Button variant="accent" size="sm" onClick={() => openAdd()} className="mt-4">
            <Plus className="h-4 w-4" /> Tambah Ketersediaan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pengajarRules.map((rule) => (
            <Card key={rule.id} className={`border hover:border-primary/40 transition-all shadow-xs ${!rule.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={rule.jenis === "RUTINE" ? "default" : "secondary"}>{rule.jenis === "RUTINE" ? "Rutin" : "Khusus"}</Badge>
                    <Badge variant={rule.status === "TIDAK_TERSEDIA" ? "destructive" : "success"}>{rule.status === "TIDAK_TERSEDIA" ? "Tidak Tersedia" : "Tersedia"}</Badge>
                    <Badge variant={rule.mode === "ONLINE" ? "outline" : "secondary"}>{rule.mode === "ONLINE" ? "Online" : "Offline"}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(rule)} className="p-1 h-7 w-7" aria-label={rule.isActive ? "Nonaktifkan" : "Aktifkan"}>
                      <span className={`h-3.5 w-3.5 rounded-full ${rule.isActive ? "bg-emerald-500" : "bg-muted border border-border"}`} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(rule)} className="h-7 w-7 p-0" aria-label="Edit aturan">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)} className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" aria-label="Hapus aturan">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {rule.jenis === "RUTINE" ? <Repeat className="h-4 w-4 text-primary shrink-0" /> : <CalendarDays className="h-4 w-4 text-primary shrink-0" />}
                  <span className="text-sm font-bold text-foreground">
                    {rule.jenis === "RUTINE" ? `Hari ${HARI_OPTIONS.find((h) => h.value === rule.hari)?.label || rule.hari}` : `Tanggal ${formatDateIndoShort(rule.tanggal)}`}
                  </span>
                  <span className="text-xs text-primary font-semibold">
                    {rule.jamMulai} – {rule.jamSelesai}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Durasi {calcDuration(rule.jamMulai, rule.jamSelesai)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rule.mode === "ONLINE" ? <Video className="h-3.5 w-3.5 text-purple-600" /> : <MapPin className="h-3.5 w-3.5 text-rose-600" />}
                    <span>{rule.ruangan || (rule.mode === "ONLINE" ? "Google Meet / Zoom" : "Bimbel Dinda")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <Users className="h-3.5 w-3.5" /> {rule.pengajarNama || "Pengajar"}
                  </div>
                </div>
                {rule.catatan && <p className="text-[11px] text-muted-foreground italic mt-2">“{rule.catatan}”</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Ubah Ketersediaan Pengajar" : "Tambah Ketersediaan Pengajar"}
        description="Atur jam tersedia atau tidak tersedia (agenda lain). Jadwal mengajar yang sudah tercatat otomatis terisi dan tidak bisa ditimpa."
        className="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Pengajar</label>
            <select
              className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={form.pengajarId}
              onChange={(e) => setForm({ ...form, pengajarId: e.target.value })}
            >
              {pengajarList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Jenis Aturan</label>
              <select
                className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={form.jenis}
                onChange={(e) => setForm({ ...form, jenis: e.target.value as "RUTINE" | "SPECIFIK" })}
              >
                <option value="RUTINE">Rutin — setiap minggu</option>
                <option value="SPECIFIK">Khusus — tanggal tertentu</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Status</label>
              <select
                className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "TERSEDIA" | "TIDAK_TERSEDIA" })}
              >
                <option value="TERSEDIA">Tersedia mengajar</option>
                <option value="TIDAK_TERSEDIA">Tidak tersedia / Agenda lain</option>
              </select>
            </div>
          </div>

          {form.jenis === "RUTINE" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Hari Terulang</label>
              <div className="flex flex-wrap gap-1.5">
                {HARI_OPTIONS.map((hari) => (
                  <button
                    key={hari.value}
                    type="button"
                    onClick={() => setForm({ ...form, hari: hari.value })}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${form.hari === hari.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                  >
                    {hari.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Tanggal Khusus</label>
              <Input required type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Jam Mulai</label>
              <Input required type="time" value={form.jamMulai} onChange={(e) => setForm({ ...form, jamMulai: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Jam Selesai</label>
              <Input required type="time" value={form.jamSelesai} onChange={(e) => setForm({ ...form, jamSelesai: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Mode Kelas</label>
              <select
                className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value as "ONLINE" | "OFFLINE" })}
              >
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Ruangan / Tautan</label>
              <Input value={form.ruangan} onChange={(e) => setForm({ ...form, ruangan: e.target.value })} placeholder="Google Meet / Ruang X" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Catatan (opsional)</label>
            <Input value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} placeholder="Contoh: Tidak tersedia karena agenda keluarga" />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="accent" className="font-bold">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const DAY_LABELS_TO_CODE = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function calcDuration(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const minutes = (eh * 60 + em) - (sh * 60 + sm);
  if (minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return hours > 0 ? `${hours} jam ${rem > 0 ? `${rem} menit` : ""}`.trim() : `${rem} menit`;
}