"use client";

import * as React from "react";
import { Calendar, Clock, MapPin, Video, User, ChevronRight, Loader2, CalendarClock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { formatDateIndo } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type APIJadwal = {
  id: string;
  pengajarId: string;
  muridId: string;
  kelompokId?: string | null;
  kelompokNama?: string | null;
  kelompokMurid?: string[];
  mataPelajaran: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  mode: "online" | "offline";
  ruangan: string | null;
  catatan: string | null;
  status: string;
  pengajarNama: string;
  muridNama: string;
  startedAt?: string | null;
};

export default function MuridJadwalPage() {
  const { toast } = useToast();
  const [schedules, setSchedules] = React.useState<APIJadwal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterMode, setFilterMode] = React.useState<"all" | "online" | "offline">("all");
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [rescheduleTarget, setRescheduleTarget] = React.useState<APIJadwal | null>(null);
  const [rsForm, setRsForm] = React.useState({ tanggalBaru: "", jamMulaiBaru: "", jamSelesaiBaru: "", catatan: "" });
  const [rsSlots, setRsSlots] = React.useState<{ start: string; end: string; mode: string; ruangan: string | null }[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [requests, setRequests] = React.useState<
    {
      id: string;
      jadwalId: string;
      mataPelajaran: string;
      tanggalLama: string;
      jamMulaiLama: string;
      jamSelesaiLama: string;
      tanggalBaru: string;
      jamMulaiBaru: string;
      jamSelesaiBaru: string;
      status: string;
      catatan: string | null;
    }[]
  >([]);

  const fetchSchedules = React.useCallback((silent = false) => {
    if (!silent) setLoading(true);
    if (silent) setIsRefreshing(true);
    apiFetch<{ ok: boolean; data: APIJadwal[] }>("/api/portal/jadwal")
      .then((res) => {
        if (res.ok) setSchedules(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!silent) setLoading(false);
        if (silent) {
          setTimeout(() => setIsRefreshing(false), 1000);
        }
      });
  }, []);

  React.useEffect(() => {
    fetchSchedules();
    apiFetch<{ ok: boolean; data: { id: string; jadwalId: string; mataPelajaran: string; tanggalLama: string; jamMulaiLama: string; jamSelesaiLama: string; tanggalBaru: string; jamMulaiBaru: string; jamSelesaiBaru: string; status: string; catatan: string | null }[] }>("/api/reschedule")
      .then((res) => res.ok && setRequests(res.data))
      .catch(() => undefined);
  }, [fetchSchedules]);
  useVisiblePolling(() => fetchSchedules(true), 30000);

  const muridSchedules = schedules.filter((j) => {
    const matchMode = filterMode === "all" || j.mode === filterMode;
    return matchMode;
  });

  const openReschedule = (schedule: APIJadwal) => {
    setRescheduleTarget(schedule);
    setRsForm({ tanggalBaru: "", jamMulaiBaru: "", jamSelesaiBaru: "", catatan: "" });
    setRsSlots([]);
  };

  const loadSlots = async (tanggalKey: string) => {
    if (!rescheduleTarget) return;
    setLoadingSlots(true);
    setRsForm({ ...rsForm, tanggalBaru: tanggalKey, jamMulaiBaru: "", jamSelesaiBaru: "" });
    try {
      const query = new URLSearchParams({ pengajarId: rescheduleTarget.pengajarId, date: tanggalKey });
      const response = await fetch(`/api/public/pengajar-availability?${query.toString()}`, { cache: "no-store" });
      const json = (await response.json()) as {
        ok: boolean;
        data: { ranges: { start: string; end: string; mode: string; ruangan: string | null }[] };
      };
      const freeRanges = json.ok ? json.data.ranges : [];
      const generated: { start: string; end: string; mode: string; ruangan: string | null }[] = [];
      for (const range of freeRanges) {
        const [startHour, startMin] = range.start.split(":").map(Number);
        const [endHour, endMin] = range.end.split(":").map(Number);
        const startTotal = startHour * 60 + startMin;
        const endTotal = endHour * 60 + endMin;
        for (let cursor = startTotal; cursor + 60 <= endTotal; cursor += 60) {
          const from = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;
          const to = `${String(Math.floor((cursor + 60) / 60)).padStart(2, "0")}:${String((cursor + 60) % 60).padStart(2, "0")}`;
          generated.push({ start: from, end: to, mode: range.mode, ruangan: range.ruangan });
        }
      }
      setRsSlots(generated);
    } finally {
      setLoadingSlots(false);
    }
  };

  const submitReschedule = async () => {
    if (!rescheduleTarget || !rsForm.tanggalBaru || !rsForm.jamMulaiBaru || !rsForm.jamSelesaiBaru) {
      toast("Pilih tanggal dan jam pengganti.", "error");
      return;
    }
    setSending(true);
    try {
      await apiFetch("/api/reschedule", {
        method: "POST",
        body: JSON.stringify({ jadwalId: rescheduleTarget.id, ...rsForm }),
      });
      toast("Pengajuan reschedule disubmit. Admin/Pengajar akan disetujui atuh ditolak.", "success");
      setRescheduleTarget(null);
      apiFetch<{ ok: boolean; data: { id: string; jadwalId: string; mataPelajaran: string; tanggalLama: string; jamMulaiLama: string; jamSelesaiLama: string; tanggalBaru: string; jamMulaiBaru: string; jamSelesaiBaru: string; status: string; catatan: string | null }[] }>("/api/reschedule")
        .then((res) => res.ok && setRequests(res.data))
        .catch(() => undefined);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Pengajuan reschedule gagal.", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Jadwal Belajar Saya</h1>
            <Badge variant="outline" className={`text-[10px] gap-1 px-2.5 transition-all ${isRefreshing ? "border-primary text-primary" : "text-muted-foreground"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isRefreshing ? "bg-primary animate-ping" : "bg-emerald-500"}`} />
              {isRefreshing ? "Menyinkronkan..." : "Real-time aktif"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Daftar sesi bimbingan belajar reguler dan intensif yang terdaftar untukmu.</p>
        </div>

        {/* Filter Mode */}
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl">
          <button onClick={() => setFilterMode("all")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterMode === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"}`}>
            Semua Sesi
          </button>
          <button onClick={() => setFilterMode("online")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterMode === "online" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"}`}>
            Online Saja
          </button>
          <button onClick={() => setFilterMode("offline")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterMode === "offline" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"}`}>
            Offline Saja
          </button>
        </div>
      </div>

      {/* Schedules List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Memuat jadwal belajar...
        </div>
      ) : (
        <div className="space-y-4">
          {muridSchedules.map((item) => (
            <Card key={item.id} className="border-border hover:border-primary/30 transition-all shadow-xs">
              <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.mode === "online" ? "default" : "secondary"}>{item.mode === "online" ? "KELAS ONLINE" : "TATAP MUKA OFFLINE"}</Badge>
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateIndo(item.tanggal)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground">{item.mataPelajaran}</h3>
                  {item.kelompokNama && (
                    <p className="text-xs font-semibold text-primary">
                      Kelompok sesi: {item.kelompokNama}
                      {item.kelompokMurid?.length ? ` · ${item.kelompokMurid.join(", ")}` : ""}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary shrink-0" />
                      <span>
                        Tutor Pengajar: <strong className="text-foreground">{item.pengajarNama}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent shrink-0" />
                      <span>
                        Pukul:{" "}
                        <strong className="text-foreground">
                          {item.jamMulai} – {item.jamSelesai} WIB
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.mode === "online" ? <Video className="h-4 w-4 text-purple-600 shrink-0" /> : <MapPin className="h-4 w-4 text-rose-600 shrink-0" />}
                      <span>
                        Ruang/Akses: <strong className="text-foreground">{item.ruangan || "—"}</strong>
                      </span>
                    </div>
                    {item.catatan && <div className="text-[11px] text-muted-foreground italic sm:col-span-2">Catatan: {item.catatan}</div>}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-border">
                  <Link href="/murid/absen" className="w-full sm:w-auto">
                    <Button variant="accent" size="sm" className="w-full sm:w-auto font-bold gap-1 text-xs">
                      Hadir Sesi Ini
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  {!item.startedAt && (
                    <Button variant="outline" size="sm" onClick={() => openReschedule(item)} className="w-full sm:w-auto text-xs gap-1">
                      <CalendarClock className="h-3.5 w-3.5" /> Reschedule
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {muridSchedules.length === 0 && (
            <div className="text-center py-16 border border-dashed border-border rounded-3xl p-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-bold text-foreground">Tidak Ada Jadwal</h3>
              <p className="text-xs text-muted-foreground mt-1">Tidak ada sesi jadwal bimbingan pada kategori yang dipilih.</p>
            </div>
          )}
        </div>
      )}

      {/* Pengajuan Reschedule */}
      {requests.length > 0 && (
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Pengajuan Reschedule Saya</h3>
            </div>
            <div className="space-y-2.5">
              {requests.map((request) => (
                <div key={request.id} className="rounded-xl border border-border bg-muted/30 p-3 flex flex-col gap-1.5 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={request.status === "APPROVED" ? "success" : request.status === "REJECTED" ? "destructive" : "warning"}>
                      {request.status === "APPROVED" ? "Disetujui" : request.status === "REJECTED" ? "Ditolak" : "Pending"}
                    </Badge>
                    <span className="font-bold text-foreground">{request.mataPelajaran}</span>
                    <span className="text-muted-foreground">
                      {formatDateIndo(request.tanggalLama)} {request.jamMulaiLama}–{request.jamSelesaiLama} → {formatDateIndo(request.tanggalBaru)} {request.jamMulaiBaru}–{request.jamSelesaiBaru}
                    </span>
                  </div>
                  {request.catatan && <p className="text-muted-foreground italic">Catatan: {request.catatan}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Reschedule */}
      <Modal
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title="Pengajuan Reschedule Jadwal"
        description={rescheduleTarget ? `Sesi ${rescheduleTarget.mataPelajaran} bersama ${rescheduleTarget.pengajarNama} pada ${formatDateIndo(rescheduleTarget.tanggal)} ${rescheduleTarget.jamMulai}–${rescheduleTarget.jamSelesai}. Pilih slot pengganti sesuai ketersediaan pengajar.` : ""}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Tanggal Pengganti</label>
            <Input type="date" required className="w-full" value={rsForm.tanggalBaru} min={new Date().toISOString().slice(0, 10)} onChange={(event) => loadSlots(event.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Jam Pengganti (slot tersedia pengajar)</label>
            {loadingSlots ? (
              <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Mencari slot tersedia...
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {rsSlots.map((slot) => (
                  <button
                    key={`${slot.start}-${slot.end}`}
                    type="button"
                    onClick={() => setRsForm({ ...rsForm, jamMulaiBaru: slot.start, jamSelesaiBaru: slot.end })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      rsForm.jamMulaiBaru === slot.start ? "bg-primary text-white shadow-sm" : "border border-primary/20 bg-secondary/30 text-foreground hover:bg-primary/10"
                    }`}
                  >
                    {slot.start} – {slot.end}
                  </button>
                ))}
                {!rsSlots.length && !loadingSlots && <p className="text-xs text-muted-foreground">Pilih tanggal pengganti atuh jadwal tersedia akan tampil.</p>}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Catatan untuk Admin / Pengajar (opsional)</label>
            <textarea
              rows={2}
              className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={rsForm.catatan}
              onChange={(event) => setRsForm({ ...rsForm, catatan: event.target.value })}
              placeholder="Contoh: jadwal bentrok dengan sekolah, meminta jam pengganti..."
            />
          </div>

          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-primary" /> Pengajuan akan direvisi biro admin atuh pengajar. Jadwal awal tetap berlaku hingga disetujui.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setRescheduleTarget(null)}>
              Batal
            </Button>
            <Button variant="accent" isLoading={sending} onClick={submitReschedule} className="font-bold">
              Kirim Pengajuan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
