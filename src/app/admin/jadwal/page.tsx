"use client";

import * as React from "react";
import { Calendar, Plus, Loader2, Search, CalendarClock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
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

type RescheduleRequest = {
  id: string;
  muridNama: string;
  pengajarNama: string;
  mataPelajaran: string;
  tanggalLama: string;
  jamMulaiLama: string;
  jamSelesaiLama: string;
  tanggalBaru: string;
  jamMulaiBaru: string;
  jamSelesaiBaru: string;
  catatan: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  handledBy: string | null;
  createdAt: string;
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
  const [rescheduleList, setRescheduleList] = React.useState<RescheduleRequest[]>([]);
  const [processingRequestId, setProcessingRequestId] = React.useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [pengajarQuery, setPengajarQuery] = React.useState("");
  const [muridQuery, setMuridQuery] = React.useState("");
  const [availabilityHint, setAvailabilityHint] = React.useState("");
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
        const [resJadwal, resPengajar, resMurid, resReschedule] = await Promise.all([
          apiFetch<{ ok: boolean; data: APIJadwal[] }>("/api/admin/jadwal"),
          apiFetch<{ ok: boolean; data: { id: string; name: string; spesialisasi: string }[] }>("/api/admin/pengajar"),
          apiFetch<{ ok: boolean; data: { id: string; name: string; kelas: string }[] }>("/api/admin/murid"),
          apiFetch<{ ok: boolean; data: RescheduleRequest[] }>("/api/reschedule"),
        ]);

        if (resJadwal.ok) setJadwalList(resJadwal.data);
        if (resPengajar.ok) {
          setPengajarList(resPengajar.data.map((p) => ({ id: p.id, name: p.name, info: p.spesialisasi })));
        }
        if (resMurid.ok) {
          setMuridList(resMurid.data.map((m) => ({ id: m.id, name: m.name, info: getKelasLabel(m.kelas), kelas: m.kelas })));
        }
        if (resReschedule.ok) setRescheduleList(resReschedule.data);
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
    setPengajarQuery("");
    setMuridQuery("");
    setAvailabilityHint("");
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
    setPengajarQuery("");
    setMuridQuery("");
    setAvailabilityHint("");
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

  const checkAvailability = React.useCallback(
    async (pengajarId: string) => {
      if (!isModalOpen || !pengajarId) return;
      const tanggal = formData.tanggal;
      const jamMulai = formData.jamMulai;
      const jamSelesai = formData.jamSelesai;
      if (!tanggal || !jamMulai || !jamSelesai) return;
      const query = new URLSearchParams({ pengajarId, date: tanggal });
      try {
        const response = await fetch(`/api/public/pengajar-availability?${query.toString()}`, { cache: "no-store" });
        const json = (await response.json()) as { ok: boolean; data: { ranges: { start: string; end: string }[]; booked: { jamMulai: string; jamSelesai: string }[] } };
        if (!json.ok) {
          setAvailabilityHint("");
          return;
        }
        const covered = json.data.ranges.some((range) => jamMulai >= range.start && jamSelesai <= range.end);
        const bentrok = json.data.booked.some((b) => jamMulai < b.jamSelesai && b.jamMulai < jamSelesai);
        if (bentrok) {
          setAvailabilityHint("⚠️ Pengajar sudah terisi pada jam ini — jadwal akan diblokkan.");
        } else if (!covered && json.data.ranges.length > 0) {
          setAvailabilityHint("ℹ️ Jam ini derupan ketersediaan rutin pengajar. Slot lain mungkin lebih sesuai.");
        } else {
          setAvailabilityHint("");
        }
      } catch {
        setAvailabilityHint("");
      }
    },
    [isModalOpen, formData.tanggal, formData.jamMulai, formData.jamSelesai],
  );

  React.useEffect(() => {
    void checkAvailability(formData.pengajarId);
  }, [checkAvailability, formData.pengajarId]);

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

  const handleRescheduleAction = async (request: RescheduleRequest, action: "APPROVED" | "REJECTED") => {
    if (processingRequestId) return;
    const label = action === "APPROVED" ? "Disetujui" : "Ditolak";
    if (!confirm(`Disetujui atuh ditolak pengajuan reschedule dari ${request.muridNama}?\n\nLama: ${formatDateIndo(request.tanggalLama)} ${request.jamMulaiLama}-${request.jamSelesaiLama}\nBaru: ${formatDateIndo(request.tanggalBaru)} ${request.jamMulaiBaru}-${request.jamSelesaiBaru}`)) return;
    setProcessingRequestId(request.id);
    try {
      await apiFetch(`/api/reschedule/${request.id}`, { method: "PUT", body: JSON.stringify({ action }) });
      toast(action === "APPROVED" ? "Reschedule disetujui — jadwal diperbarui otomatis." : "Pengajuan reschedule ditolak. Jadwal awal tetap.", "success");
      fetchAllData(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal diproses pengajuan reschedule.", "error");
    } finally {
      setProcessingRequestId(null);
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

      {/* Pengajuan Reschedule */}
      {rescheduleList.filter((request) => request.status === "PENDING").length > 0 && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-4 w-4 text-amber-600 animate-spin" />
            <h2 className="text-sm font-bold text-amber-700">
              Pengajuan Reschedule Pengganti ({rescheduleList.filter((request) => request.status === "PENDING").length})
            </h2>
          </div>
          <p className="text-[11px] text-amber-700 mb-3">
            Murid meminta perubahan tanggal/jam sesi. Disetujui atuh ditolak — jadwal pengajar diperbarui otomatis.
          </p>
          <div className="space-y-2.5">
            {rescheduleList
              .filter((request) => request.status === "PENDING")
              .map((request) => (
                <div key={request.id} className="rounded-xl border border-amber-200 bg-card p-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">PENDING</Badge>
                    <span className="text-xs font-bold text-foreground">{request.mataPelajaran}</span>
                    <span className="text-xs text-muted-foreground">· {request.muridNama} · Pengajar {request.pengajarNama}</span>
                  </div>
                  <div className="flex items-center gap-2.5 mt-2 text-xs">
                    <div className="rounded-lg bg-muted px-2.5 py-1.5 text-muted-foreground">
                      Lama: {formatDateIndo(request.tanggalLama)} {request.jamMulaiLama}–{request.jamSelesaiLama}
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="rounded-lg bg-secondary/30 px-2.5 py-1.5 text-secondary-foreground">
                      Baru: {formatDateIndo(request.tanggalBaru)} {request.jamMulaiBaru}–{request.jamSelesaiBaru}
                    </div>
                  </div>
                  {request.catatan && <p className="text-[11px] text-muted-foreground mt-1.5 italic">“{request.catatan}”</p>}
                  <div className="flex justify-end gap-2 mt-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-rose-600 hover:bg-rose-50"
                      isLoading={processingRequestId === request.id}
                      onClick={() => void handleRescheduleAction(request, "REJECTED")}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Ditolak
                    </Button>
                    <Button
                      variant="accent"
                      size="sm"
                      className="text-xs font-bold"
                      isLoading={processingRequestId === request.id}
                      onClick={() => void handleRescheduleAction(request, "APPROVED")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Disetujui
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

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
                    {j.kelompokNama && (
                      <div className="text-primary font-semibold sm:col-span-3">
                        Kelompok: {j.kelompokNama} ·{" "}
                        {jadwalList
                          .filter((item) => item.kelompokId === j.kelompokId)
                          .map((item) => item.murid)
                          .join(", ")}
                      </div>
                    )}
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
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Ubah Jadwal Mengajar" : "Buat Jadwal Mengajar Baru"}
        description="Sinkronkan jadwal langsung dengan basis data bimbingan. Pengajar dan murid dapat dicari, dan bentrokatan otomatis diblokkan."
        className="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Pengajar (Tutor)</label>
              <div className="relative">
                <Input placeholder="Cari pengajar..." value={pengajarQuery} onChange={(e) => setPengajarQuery(e.target.value)} className="pl-8 h-9 text-xs" />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="grid max-h-44 gap-1 overflow-y-auto rounded-xl border border-border p-2">
                {pengajarList
                  .filter((p) => !pengajarQuery || `${p.name} ${p.info}`.toLowerCase().includes(pengajarQuery.toLowerCase()))
                  .map((p) => (
                    <label key={p.id} className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-xs cursor-pointer hover:bg-muted">
                      <input type="radio" name="pengajar-radio" checked={formData.pengajarId === p.id} onChange={() => setFormData({ ...formData, pengajarId: p.id })} />
                      <span className="truncate">
                        {p.name} <span className="text-muted-foreground">({p.info})</span>
                      </span>
                    </label>
                  ))}
                {!pengajarList.filter((p) => !pengajarQuery || `${p.name} ${p.info}`.toLowerCase().includes(pengajarQuery.toLowerCase())).length && <p className="text-[10px] text-muted-foreground py-2">Pengajar tidak ditemukan.</p>}
              </div>
              {availabilityHint && <p className="text-[10px] text-muted-foreground mt-1">{availabilityHint}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Murid</label>
              <div className="relative">
                <Input placeholder="Cari murid..." value={muridQuery} onChange={(e) => setMuridQuery(e.target.value)} className="pl-8 h-9 text-xs" />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="grid max-h-48 gap-0.5 overflow-y-auto rounded-xl border border-border p-2">
                {muridList
                  .filter((m) => !muridQuery || `${m.name} ${m.info}`.toLowerCase().includes(muridQuery.toLowerCase()))
                  .map((murid) => (
                  <label key={murid.id} className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-xs hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={formData.muridIds.includes(murid.id)}
                      onChange={(event) => {
                        const ids = event.target.checked ? [...formData.muridIds, murid.id] : formData.muridIds.filter((id) => id !== murid.id);
                        setFormData({ ...formData, muridIds: ids, muridId: ids[0] || "" });
                      }}
                    />
                    <span className="truncate">
                      {murid.name} ({murid.info})
                    </span>
                  </label>
                  ))}
                {!muridList.filter((m) => !muridQuery || `${m.name} ${m.info}`.toLowerCase().includes(muridQuery.toLowerCase())).length && <p className="text-[10px] text-muted-foreground py-2">Murid tidak ditemukan.</p>}
              </div>
              <p className="text-[10px] text-muted-foreground">Pilih beberapa murid untuk menggabungkan jadwal menjadi satu sesi kelompok.</p>
              <p className="text-[11px] font-semibold text-primary flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" /> Terpilih: {formData.muridIds.length} murid
              </p>
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
