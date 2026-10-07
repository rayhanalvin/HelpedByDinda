"use client";

import * as React from "react";
import { Calendar, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatDateIndo } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { getKelasLabel } from "@/lib/kelas";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type APIJadwal = {
  id: string;
  pengajarId: string;
  muridId: string;
  kelompokId?: string | null;
  kelompokNama?: string | null;
  mataPelajaran: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  mode: "ONLINE" | "OFFLINE";
  ruangan: string | null;
  catatan: string | null;
  startedAt?: string | null;
  status: string;
  pengajar: string;
  murid: string;
};

type SimpleUserOpt = {
  id: string;
  name: string;
  info?: string;
  kelas?: string;
};

export default function AdminJadwalPage() {
  const { toast } = useToast();
  const [jadwalList, setJadwalList] = React.useState<APIJadwal[]>([]);
  const [pengajarList, setPengajarList] = React.useState<SimpleUserOpt[]>([]);
  const [muridList, setMuridList] = React.useState<SimpleUserOpt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterMode, setFilterMode] = React.useState<string>("ALL");
  const [calendarView, setCalendarView] = React.useState<"harian" | "mingguan">("mingguan");
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    pengajarId: "",
    muridId: "",
    muridIds: [] as string[],
    kelompokNama: "",
    mataPelajaran: "Matematika SMA",
    tanggal: "2025-07-21",
    jamMulai: "16:00",
    jamSelesai: "17:30",
    mode: "ONLINE" as "ONLINE" | "OFFLINE",
    ruangan: "Google Meet Room Bimbel",
    catatan: "",
    startedAt: "",
  });

  const fetchAllData = React.useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        if (silent) setIsRefreshing(true);
        const [resJadwal, resPengajar, resMurid] = await Promise.all([
          apiFetch<{ ok: boolean; data: APIJadwal[] }>("/api/admin/jadwal"),
          apiFetch<{ ok: boolean; data: { id: string; name: string; spesialisasi: string }[] }>("/api/admin/pengajar"),
          apiFetch<{ ok: boolean; data: { id: string; name: string; kelas: string }[] }>("/api/admin/murid"),
        ]);

        if (resJadwal.ok) setJadwalList(resJadwal.data);
        if (resPengajar.ok) {
          setPengajarList(resPengajar.data.map((p) => ({ id: p.id, name: p.name, info: p.spesialisasi })));
        }
        if (resMurid.ok) {
          setMuridList(resMurid.data.map((m) => ({ id: m.id, name: m.name, info: getKelasLabel(m.kelas), kelas: m.kelas })));
        }
      } catch {
        if (!silent) toast("Gagal sinkronisasi data jadwal.", "error");
      } finally {
        if (!silent) setLoading(false);
        if (silent) {
          setTimeout(() => setIsRefreshing(false), 1000);
        }
      }
    },
    [toast],
  );

  React.useEffect(() => {
    void fetchAllData();
  }, [fetchAllData]);
  useVisiblePolling(() => fetchAllData(true), 30000);

  const handleOpenAdd = React.useCallback(() => {
    setEditingId(null);
    setFormData({
      pengajarId: pengajarList[0]?.id || "",
      muridId: muridList[0]?.id || "",
      muridIds: muridList[0]?.id ? [muridList[0].id] : [],
      kelompokNama: "",
      mataPelajaran: "Matematika SMA",
      tanggal: new Date().toISOString().substring(0, 10),
      jamMulai: "16:00",
      jamSelesai: "17:30",
      mode: "ONLINE",
      ruangan: "Google Meet Room Bimbel",
      catatan: "",
      startedAt: "",
    });
    setIsModalOpen(true);
  }, [pengajarList, muridList]);

  const handleOpenEdit = (j: APIJadwal) => {
    setEditingId(j.id);
    const groupMuridIds = j.kelompokId ? jadwalList.filter((item) => item.kelompokId === j.kelompokId).map((item) => item.muridId) : [j.muridId];
    const startedAtValue = (j as unknown as { startedAt?: string | null }).startedAt;
    setFormData({
      pengajarId: j.pengajarId,
      muridId: groupMuridIds[0] || j.muridId,
      muridIds: groupMuridIds,
      kelompokNama: j.kelompokNama || "",
      mataPelajaran: j.mataPelajaran,
      tanggal: new Date(j.tanggal).toISOString().substring(0, 10),
      jamMulai: j.jamMulai,
      jamSelesai: j.jamSelesai,
      mode: j.mode,
      ruangan: j.ruangan || "",
      catatan: j.catatan || "",
      startedAt: startedAtValue ? new Date(startedAtValue).toISOString().substring(0, 16) : "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const schedule = jadwalList.find((item) => item.id === id);
    const message = schedule?.kelompokId ? "Hapus seluruh jadwal dan peserta dalam kelompok ini?" : "Apakah Anda yakin ingin menghapus jadwal ini?";
    if (confirm(message)) {
      try {
        await apiFetch(`/api/admin/jadwal/${id}`, { method: "DELETE" });
        toast("Jadwal berhasil dihapus.", "success");
        fetchAllData();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Gagal menghapus jadwal.", "error");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiFetch(`/api/admin/jadwal/${editingId}`, { method: "PUT", body: JSON.stringify(formData) });
        toast("Jadwal berhasil diperbarui!", "success");
      } else {
        await apiFetch("/api/admin/jadwal", { method: "POST", body: JSON.stringify(formData) });
        toast("Jadwal baru berhasil dibuat!", "success");
      }
      setIsModalOpen(false);
      fetchAllData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menyimpan jadwal.", "error");
    }
  };

  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
  const filtered = jadwalList.filter((j) => {
    const inPeriod = calendarView === "harian" ? j.tanggal.slice(0, 10) === selectedDate : weekDates.includes(j.tanggal.slice(0, 10));
    return inPeriod && (filterMode === "ALL" ? true : j.mode === filterMode);
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Kelola Jadwal Mengajar</h1>
            <Badge variant="outline" className={`text-[10px] gap-1 px-2.5 transition-all ${isRefreshing ? "border-primary text-primary" : "text-muted-foreground"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isRefreshing ? "bg-primary animate-ping" : "bg-emerald-500"}`} />
              {isRefreshing ? "Menyinkronkan..." : "Real-time aktif"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Atur sesi belajar dengan rapi dan pantau perubahan yang langsung tersinkron ke pengajar serta murid.</p>
        </div>

        <Button onClick={handleOpenAdd} variant="accent" className="font-bold gap-2">
          <Plus className="h-4 w-4" /> Buat Jadwal Baru
        </Button>
      </div>

      {/* Mode Filter */}
      <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl max-w-xs">
        {["ALL", "ONLINE", "OFFLINE"].map((mode) => (
          <button key={mode} onClick={() => setFilterMode(mode)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterMode === mode ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"}`}>
            {mode === "ALL" ? "Semua" : mode}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={calendarView === "harian" ? "default" : "outline"} size="sm" onClick={() => setCalendarView("harian")}>
          Harian
        </Button>
        <Button variant={calendarView === "mingguan" ? "default" : "outline"} size="sm" onClick={() => setCalendarView("mingguan")}>
          Mingguan
        </Button>
        <Input type="date" className="w-auto" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        <span className="text-xs text-muted-foreground">Menampilkan {filtered.length} sesi pada periode terpilih.</span>
      </div>

      {/* Schedule Cards / Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Menyiapkan jadwal...
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((j) => (
            <Card key={j.id} className="border-border hover:border-primary/40 transition-all shadow-xs">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={j.mode === "ONLINE" ? "default" : "secondary"}>{j.mode.toUpperCase()}</Badge>
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateIndo(j.tanggal)}
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      {j.jamMulai} – {j.jamSelesai} WIB
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground">{j.mataPelajaran}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground pt-1">
                    <div>
                      Tutor: <strong className="text-foreground">{j.pengajar}</strong>
                    </div>
                    <div>
                      Murid: <strong className="text-foreground">{j.murid}</strong>
                    </div>
                    <div>
                      Ruang: <strong className="text-foreground">{j.ruangan || "—"}</strong>
                    </div>
                    {j.kelompokNama && <div className="text-primary font-semibold sm:col-span-3">Kelompok: {j.kelompokNama} · {jadwalList.filter((item) => item.kelompokId === j.kelompokId).map((item) => item.murid).join(", ")}</div>}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(j)} className="text-xs">
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      // trigger start: set startedAt to now and create initial absensi for murid & pengajar
                      try {
                        const now = new Date().toISOString();
                        await apiFetch(`/api/admin/jadwal/${j.id}`, { method: "PUT", body: JSON.stringify({ ...j, startedAt: now }) });
                        // create absensi for both pengajar and murid via portal absensi endpoint (server will verify)
                        await apiFetch(`/api/absensi`, { method: "POST", body: JSON.stringify({ action: "start", jadwalId: j.id, location: { latitude: 0, longitude: 0, accuracy: 0 } }) });
                        toast("Sesi dimulai dan absensi awal dicatat.", "success");
                        fetchAllData();
                      } catch (e) {
                        toast(e instanceof Error ? e.message : "Gagal memulai sesi.", "error");
                      }
                    }}
                    className="text-xs"
                  >
                    Mulai
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(j.id)} className="text-xs text-rose-600 hover:bg-rose-50">
                    Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Buat/Ubah Jadwal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Ubah Jadwal Mengajar" : "Buat Jadwal Mengajar Baru"} description="Sinkronkan jadwal langsung dengan basis data bimbingan.">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Pengajar (Tutor)</label>
              <select
                className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={formData.pengajarId}
                onChange={(e) => setFormData({ ...formData, pengajarId: e.target.value })}
              >
                {pengajarList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.info})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Murid</label>
              <div className="grid max-h-48 gap-1 overflow-y-auto rounded-xl border border-border p-2 sm:grid-cols-2">
                {muridList.map((murid) => (
                  <label key={murid.id} className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-xs hover:bg-muted">
                    <input type="checkbox" checked={formData.muridIds.includes(murid.id)} onChange={(event) => {
                      const ids = event.target.checked ? [...formData.muridIds, murid.id] : formData.muridIds.filter((id) => id !== murid.id);
                      setFormData({ ...formData, muridIds: ids, muridId: ids[0] || "" });
                    }} />
                    <span className="truncate">{murid.name} ({murid.info})</span>
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">Pilih beberapa murid untuk menggabungkan jadwal menjadi satu sesi kelompok.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Nama Kelompok (opsional)</label>
            <Input value={formData.kelompokNama} onChange={(e) => setFormData({ ...formData, kelompokNama: e.target.value })} placeholder="Contoh: Kelompok Matematika SMA" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Mata Pelajaran & Topik</label>
            <Input required value={formData.mataPelajaran} onChange={(e) => setFormData({ ...formData, mataPelajaran: e.target.value })} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Tanggal</label>
              <Input type="date" required value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Jam Mulai</label>
              <Input type="time" required value={formData.jamMulai} onChange={(e) => setFormData({ ...formData, jamMulai: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Jam Selesai</label>
              <Input type="time" required value={formData.jamSelesai} onChange={(e) => setFormData({ ...formData, jamSelesai: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Waktu Mulai Sesi (opsional)</label>
              <Input type="datetime-local" value={formData.startedAt} onChange={(e) => setFormData({ ...formData, startedAt: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Mode Kelas</label>
              <select
                className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value as "ONLINE" | "OFFLINE" })}
              >
                <option value="ONLINE">Online (Google Meet / Zoom)</option>
                <option value="OFFLINE">Offline (Tatap Muka di Bimbel)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Ruangan / Tautan Sesi</label>
              <Input value={formData.ruangan} onChange={(e) => setFormData({ ...formData, ruangan: e.target.value })} />
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="accent" className="font-bold">
              Simpan Jadwal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
