"use client";

import * as React from "react";
import { CalendarClock, Plus, Pencil, Trash2, Loader2, Repeat, CalendarDays, Clock, MapPin, Video, ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react";
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

const HARI_OPTIONS = [
  { value: "MON", label: "Senin" },
  { value: "TUE", label: "Selasa" },
  { value: "WED", label: "Rabu" },
  { value: "THU", label: "Kamis" },
  { value: "FRI", label: "Jumat" },
  { value: "SAT", label: "Sabtu" },
  { value: "SUN", label: "Minggu" },
];

const CAL_DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const CAL_DAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateIndoShort(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

export default function PengajarAvailabilityPage() {
  const { toast } = useToast();
  const [rules, setRules] = React.useState<AvailabilityRule[]>([]);
  const [jadwalMap, setJadwalMap] = React.useState<Record<string, number>>({});
  const [calMonthKey, setCalMonthKey] = React.useState(() => monthKeyOf(new Date()));
  const [loading, setLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [ruleForm, setRuleForm] = React.useState({
    jenis: "RUTINE",
    status: "TERSEDIA",
    hari: "MON",
    tanggal: "",
    jamMulai: "16:00",
    jamSelesai: "17:30",
    mode: "ONLINE",
    ruangan: "",
    catatan: "",
    isActive: true,
  });

  const loadRules = React.useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      if (silent) setIsRefreshing(true);
      try {
        const [resRules, resJadwal] = await Promise.all([
          apiFetch<{ ok: boolean; data: AvailabilityRule[] }>("/api/pengajar/availability"),
          apiFetch<{ ok: boolean; data: { tanggal: string; kelompokId: string | null }[] }>("/api/pengajar/jadwal"),
        ]);
        if (resRules.ok) setRules(resRules.data);
        if (resJadwal.ok) {
          const map: Record<string, number> = {};
          for (const item of resJadwal.data) {
            const key = String(item.tanggal).slice(0, 10);
            map[key] = (map[key] || 0) + 1;
          }
          setJadwalMap(map);
        }
      } catch (error) {
        if (!silent) toast(error instanceof Error ? error.message : "Gagal memuat ketersediaan jadwal.", "error");
      } finally {
        if (!silent) setLoading(false);
        if (silent) setTimeout(() => setIsRefreshing(false), 800);
      }
    },
    [toast],
  );

  React.useEffect(() => {
    void loadRules();
  }, [loadRules]);
  useVisiblePolling(() => loadRules(true), 30000);

  const openAdd = () => {
    setEditingId(null);
    setRuleForm({
      jenis: "RUTINE",
      status: "TERSEDIA",
      hari: "MON",
      tanggal: "",
      jamMulai: "16:00",
      jamSelesai: "17:30",
      mode: "ONLINE",
      ruangan: "",
      catatan: "",
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (rule: AvailabilityRule) => {
    setEditingId(rule.id);
    setRuleForm({
      jenis: rule.jenis,
      status: rule.status,
      hari: rule.hari || "MON",
      tanggal: rule.tanggal ? rule.tanggal.slice(0, 10) : "",
      jamMulai: rule.jamMulai,
      jamSelesai: rule.jamSelesai,
      mode: rule.mode,
      ruangan: rule.ruangan || "",
      catatan: rule.catatan || "",
      isActive: rule.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.jamMulai || !ruleForm.jamSelesai) {
      toast("Jam mulai dan selesai wajib.", "error");
      return;
    }
    if (ruleForm.jamMulai >= ruleForm.jamSelesai) {
      toast("Jam mulai harus sebelum jam selesai.", "error");
      return;
    }
    try {
      if (editingId) {
        await apiFetch(`/api/pengajar/availability/${editingId}`, { method: "PUT", body: JSON.stringify(ruleForm) });
        toast("Aturan ketersediaan diperbarui!", "success");
      } else {
        await apiFetch("/api/pengajar/availability", { method: "POST", body: JSON.stringify(ruleForm) });
        toast("Aturan ketersediaan baru dibuat!", "success");
      }
      setModalOpen(false);
      void loadRules();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menyimpan aturan ketersediaan.", "error");
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Hapus aturan ketersediaan ini?")) return;
    apiFetch(`/api/pengajar/availability/${id}`, { method: "DELETE" })
      .then(() => {
        toast("Aturan ketersediaan dihapus.", "success");
        void loadRules();
      })
      .catch((err) => toast(err instanceof Error ? err.message : "Gagal menghapus aturan.", "error"));
  };

  const toggleActive = (rule: AvailabilityRule) => {
    apiFetch(`/api/pengajar/availability/${rule.id}`, { method: "PUT", body: JSON.stringify({ isActive: !rule.isActive }) })
      .then(() => {
        toast(rule.isActive ? "Aturan dinonaktifkan dari jadwal publik." : "Aturan diaktifkan kembali di jadwal publik.", "success");
        void loadRules();
      })
      .catch((err) => toast(err instanceof Error ? err.message : "Gagal mengganti status aturan.", "error"));
  };

  const sortedRules = [...rules].sort((a, b) => {
    if (a.jenis !== b.jenis) return a.jenis === "RUTINE" ? -1 : 1;
    const aKey = a.jenis === "RUTINE" ? String(a.hari) : String(a.tanggal);
    const bKey = b.jenis === "RUTINE" ? String(b.hari) : String(b.tanggal);
    return aKey.localeCompare(bKey);
  });

  const activeRules = rules.filter((rule) => rule.isActive);
  const calCells = React.useMemo(() => {
    const [year, month] = calMonthKey.split("-").map(Number);
    const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
    const gridStart = new Date(Date.UTC(year, month - 1, 1 - offset));
    const cells: { key: string; inMonth: boolean }[] = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(gridStart);
      date.setUTCDate(gridStart.getUTCDate() + index);
      cells.push({ key: date.toISOString().slice(0, 10), inMonth: date.getUTCMonth() === month - 1 });
    }
    return cells.map((cell) => {
      if (!cell.inMonth) return { ...cell, status: "none" as const };
      const weekday = CAL_DAY_CODES[new Date(`${cell.key}T00:00:00Z`).getUTCDay()];
      const hasJadwal = (jadwalMap[cell.key] || 0) > 0;
      const unavailable = activeRules.some((rule) => rule.status === "TIDAK_TERSEDIA" && ((rule.jenis === "RUTINE" && rule.hari === weekday) || (rule.jenis === "SPECIFIK" && rule.tanggal === cell.key)));
      const available = activeRules.some((rule) => rule.status === "TERSEDIA" && ((rule.jenis === "RUTINE" && rule.hari === weekday) || (rule.jenis === "SPECIFIK" && rule.tanggal === cell.key)));
      if (hasJadwal) return { ...cell, status: "red" as const };
      if (unavailable) return { ...cell, status: "gray" as const };
      if (available) return { ...cell, status: "green" as const };
      return { ...cell, status: "none" as const };
    });
  }, [calMonthKey, activeRules, jadwalMap]);

  const rotateCalMonth = (direction: number) => {
    const [year, month] = calMonthKey.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1 + direction, 1));
    setCalMonthKey(monthKeyOf(next));
  };
  const calLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${calMonthKey}-01T00:00:00Z`));
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Ketersediaan Jadwal Saya</h1>
          <Badge variant="outline" className={`text-[10px] gap-1 px-2.5 transition-all ${isRefreshing ? "border-primary text-primary" : "text-emerald-700"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isRefreshing ? "bg-primary animate-ping" : "bg-emerald-500"}`} />
            {isRefreshing ? "Menyinkronkan..." : "Terpublik di sistem"}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Atur jadwal tersedia Anda untuk murid. Murid dan admin melihat langsung kapan Anda tersedia dan meminta reschedule sesuai jadwal ini.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="accent" onClick={openAdd} className="font-bold gap-2">
          <Plus className="h-4 w-4" /> Buat Aturan Ketersediaan
        </Button>
        <span className="text-xs text-muted-foreground">
          {rules.filter((rule) => rule.isActive).length} aturan aktif · {rules.length} total
        </span>
      </div>

      {/* Kalender bulanan */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4" /> Kalender Ketersediaan Saya
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => rotateCalMonth(-1)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" aria-label="Bulan sebelumnya">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-foreground min-w-32 text-center capitalize">{calLabel}</span>
            <button type="button" onClick={() => rotateCalMonth(1)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" aria-label="Bulan berikutnya">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button type="button" onClick={() => setCalMonthKey(monthKeyOf(new Date()))} className="mt-1 text-[10px] font-semibold text-primary hover:underline">
          Kembali ke bulan ini
        </button>
        <div className="mt-2 grid grid-cols-7 gap-1 text-center">
          {CAL_DAY_LABELS.map((label) => (
            <div key={label} className="text-[9px] font-bold uppercase text-muted-foreground py-1">
              {label}
            </div>
          ))}
          {calCells.map((cell) => {
            if (!cell.inMonth) return <div key={cell.key} className="py-1.5" />;
            const isToday = cell.key === todayKey;
            return (
              <div
                key={cell.key}
                className={`relative flex flex-col items-center justify-center rounded-lg py-1.5 text-[10px] font-semibold transition-all ${
                  cell.status === "green"
                    ? "bg-emerald-500/90 text-white shadow-sm"
                    : cell.status === "red"
                      ? "bg-rose-500/90 text-white shadow-sm"
                      : cell.status === "gray"
                        ? "bg-slate-400/90 text-white"
                        : "bg-muted text-muted-foreground opacity-60"
                } ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}`}
                title={cell.status === "green" ? "Tersedia" : cell.status === "red" ? "Terisi jadwal mengajar" : cell.status === "gray" ? "Tidak tersedia / Agenda lain" : "Belum diatur"}
              >
                <span className="tabular-nums">{Number(cell.key.slice(8, 10))}</span>
                {cell.status === "red" && <span className="text-[8px] font-bold">{jadwalMap[cell.key] || 0} sesi</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Tersedia
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

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Memuat ketersediaan jadwal...
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground">Belum ada aturan ketersediaan</h3>
          <p className="text-xs text-muted-foreground mt-1">Buat aturan rutin (hari tertentu setiap minggu) atau khusus (tanggal spesial) agar murid dapat melihat jadwal tersedia Anda.</p>
          <Button variant="accent" size="sm" onClick={openAdd} className="mt-4">
            <Plus className="h-4 w-4" /> Buat Aturan Ketersediaan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedRules.map((rule) => (
            <Card key={rule.id} className={`border hover:border-primary/40 transition-all shadow-xs ${!rule.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={rule.jenis === "RUTINE" ? "default" : "secondary"}>{rule.jenis === "RUTINE" ? "Rutin" : "Khusus"}</Badge>
                    <Badge variant={rule.status === "TIDAK_TERSEDIA" ? "destructive" : "success"}>{rule.status === "TIDAK_TERSEDIA" ? "Tidak Tersedia" : "Tersedia"}</Badge>
                    <Badge variant={rule.mode === "ONLINE" ? "outline" : "secondary"}>{rule.mode === "ONLINE" ? "Online" : "Offline"}</Badge>
                    {!rule.isActive && <Badge variant="destructive">Tidak Aktif</Badge>}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(rule)}
                      className="p-1 h-7 w-7"
                      aria-label={rule.isActive ? "Nonaktifkan" : "Aktifkan"}
                      title={rule.isActive ? "Nonaktifkan (hapus dari jadwal publik)" : "Aktifkan (menampilkan di jadwal publik)"}
                    >
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
                  {rule.jenis === "RUTINE" ? (
                    <Repeat className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                  )}
                  <span className="text-sm font-bold text-foreground">
                    {rule.jenis === "RUTINE" ? `Hari ${HARI_OPTIONS.find((h) => h.value === rule.hari)?.label || rule.hari}` : `Tanggal ${formatDateIndoShort(rule.tanggal)}`}
                  </span>
                  <span className="text-xs text-primary font-semibold">
                    {rule.jamMulai} – {rule.jamSelesai}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Durasi {calcDuration(rule.jamMulai, rule.jamSelesai)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rule.mode === "ONLINE" ? <Video className="h-3.5 w-3.5 text-purple-600" /> : <MapPin className="h-3.5 w-3.5 text-rose-600" />}
                    <span>{rule.ruangan || (rule.mode === "ONLINE" ? "Google Meet / Zoom" : "Bimbel Dinda")}</span>
                  </div>
                </div>
                {rule.catatan && <p className="text-[11px] text-muted-foreground italic mt-2">“{rule.catatan}”</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Buat / Edit Rule */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Ubah Aturan Ketersediaan" : "Buat Aturan Ketersediaan Jadwal"}
        description="Atur jam tersedia untuk mengajar atau tidak tersedia (agenda lain). Aturan Rutin berulang setiap minggu, Aturan Khusus hanya berlaku pada tanggal tertentu."
        className="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Jenis Aturan</label>
            <select
              className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={ruleForm.jenis}
              onChange={(e) => setRuleForm({ ...ruleForm, jenis: e.target.value, hari: e.target.value === "SPECIFIK" ? "" : ruleForm.hari || "MON" })}
            >
              <option value="RUTINE">Rutin — setiap minggu pada hari yang sama</option>
              <option value="SPECIFIK">Khusus — tanggal tertentu</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Status</label>
            <select
              className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={ruleForm.status}
              onChange={(e) => setRuleForm({ ...ruleForm, status: e.target.value })}
            >
              <option value="TERSEDIA">Tersedia untuk mengajar</option>
              <option value="TIDAK_TERSEDIA">Tidak tersedia / Agenda lain</option>
            </select>
            {ruleForm.status === "TIDAK_TERSEDIA" && (
              <p className="text-[11px] text-muted-foreground">Jam ini akan tampil abu-abu di kalender murid sebagai tidak tersedia (agenda lain).</p>
            )}
          </div>

          {ruleForm.jenis === "RUTINE" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Hari Terulang</label>
              <div className="flex flex-wrap gap-1.5">
                {HARI_OPTIONS.map((hari) => (
                  <button
                    key={hari.value}
                    type="button"
                    onClick={() => setRuleForm({ ...ruleForm, hari: hari.value })}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${ruleForm.hari === hari.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                  >
                    {hari.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Tanggal Khusus</label>
              <Input required type="date" value={ruleForm.tanggal} onChange={(e) => setRuleForm({ ...ruleForm, tanggal: e.target.value })} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Jam Mulai</label>
              <Input required type="time" value={ruleForm.jamMulai} onChange={(e) => setRuleForm({ ...ruleForm, jamMulai: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Jam Selesai</label>
              <Input required type="time" value={ruleForm.jamSelesai} onChange={(e) => setRuleForm({ ...ruleForm, jamSelesai: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Mode Kelas</label>
              <select
                className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={ruleForm.mode}
                onChange={(e) => setRuleForm({ ...ruleForm, mode: e.target.value })}
              >
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Ruangan / Tautan</label>
              <Input value={ruleForm.ruangan} onChange={(e) => setRuleForm({ ...ruleForm, ruangan: e.target.value })} placeholder="Google Meet / Ruang X" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Catatan (opsional)</label>
            <Input value={ruleForm.catatan} onChange={(e) => setRuleForm({ ...ruleForm, catatan: e.target.value })} placeholder="Contoh: Tersedia diprioritas untuk sesi Matematika" />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="accent" className="font-bold">
              Simpan Aturan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function calcDuration(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const minutes = (eh * 60 + em) - (sh * 60 + sm);
  if (minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return hours > 0 ? `${hours} jam ${rem > 0 ? `${rem} menit` : ""}`.trim() : `${rem} menit`;
}