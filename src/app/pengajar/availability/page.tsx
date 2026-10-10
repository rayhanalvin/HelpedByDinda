"use client";

import * as React from "react";
import { CalendarClock, Plus, Pencil, Trash2, Loader2, Repeat, CalendarDays, Clock, MapPin, Video } from "lucide-react";
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
  const [loading, setLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [ruleForm, setRuleForm] = React.useState({
    jenis: "RUTINE",
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
        const result = await apiFetch<{ ok: boolean; data: AvailabilityRule[] }>("/api/pengajar/availability");
        if (result.ok) setRules(result.data);
      } catch (error) {
        if (!silent) toast(error instanceof Error ? error.message : "Gagal memuat tersediaan jadwal.", "error");
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
        toast("Rule tersediaan diperbarui!", "success");
      } else {
        await apiFetch("/api/pengajar/availability", { method: "POST", body: JSON.stringify(ruleForm) });
        toast("Rule tersediaan baru dibuat!", "success");
      }
      setModalOpen(false);
      void loadRules();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menyimpan rule tersediaan.", "error");
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Hapus rule tersediaan ini?")) return;
    apiFetch(`/api/pengajar/availability/${id}`, { method: "DELETE" })
      .then(() => {
        toast("Rule tersediaan dihapus.", "success");
        void loadRules();
      })
      .catch((err) => toast(err instanceof Error ? err.message : "Gagal menghapus rule.", "error"));
  };

  const toggleActive = (rule: AvailabilityRule) => {
    apiFetch(`/api/pengajar/availability/${rule.id}`, { method: "PUT", body: JSON.stringify({ isActive: !rule.isActive }) })
      .then(() => {
        toast(rule.isActive ? "Rule dihapus dari tersediaan aktif." : "Rule teraktif dijadwal publik.", "success");
        void loadRules();
      })
      .catch((err) => toast(err instanceof Error ? err.message : "Gagal mengganti status rule.", "error"));
  };

  const sortedRules = [...rules].sort((a, b) => {
    if (a.jenis !== b.jenis) return a.jenis === "RUTINE" ? -1 : 1;
    const aKey = a.jenis === "RUTINE" ? String(a.hari) : String(a.tanggal);
    const bKey = b.jenis === "RUTINE" ? String(b.hari) : String(b.tanggal);
    return aKey.localeCompare(bKey);
  });

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Tersediaan Jadwal Saya</h1>
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
          <Plus className="h-4 w-4" /> Buat Rule Jadwal
        </Button>
        <span className="text-xs text-muted-foreground">
          {rules.filter((rule) => rule.isActive).length} rule aktif · {rules.length} total
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Memuat tersediaan jadwal...
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground">Belum ada rule tersediaan</h3>
          <p className="text-xs text-muted-foreground mt-1">Buat aturan rutin (hari tertentu setiap minggu) atau khusus (tanggal spesial) agar murid dapat melihat jadwal tersedia Anda.</p>
          <Button variant="accent" size="sm" onClick={openAdd} className="mt-4">
            <Plus className="h-4 w-4" /> Buat pertama Rule Jadwal
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
                    <Button variant="outline" size="sm" onClick={() => openEdit(rule)} className="h-7 w-7 p-0" aria-label="Edit rule">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)} className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" aria-label="Hapus rule">
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
        title={editingId ? "Ubah Rule Tersediaan" : "Buat Rule Tersediaan Jadwal"}
        description="Rule RUTINE = tersedia setiap minggu pada hari yang sama. Rule SPECIFIK = tersedia hanya pada tanggal khusus."
        className="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Jenis Rule</label>
            <select
              className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={ruleForm.jenis}
              onChange={(e) => setRuleForm({ ...ruleForm, jenis: e.target.value, hari: e.target.value === "SPECIFIK" ? "" : ruleForm.hari || "MON" })}
            >
              <option value="RUTINE">Rutin — setiap minggu pada hari yang sama</option>
              <option value="SPECIFIK">Khusus — tanggal tertentu</option>
            </select>
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
              Simpan Rule
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