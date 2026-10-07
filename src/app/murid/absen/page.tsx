"use client";

import * as React from "react";
import { CalendarCheck2, Clock, MapPin, CheckCircle2, Sparkles, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { formatDateIndo } from "@/lib/utils";
import { AttendanceExcuseForm } from "@/components/shared/AttendanceExcuseForm";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type ScheduleAttendance = {
  id: string;
  jadwalId: string;
  userId: string;
  mataPelajaran: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  mode: string;
  ruangan: string | null;
  catatan: string | null;
  status: "BELUM_AKTIF" | "AKTIF" | "BERJALAN" | "SELESAI" | "IZIN" | "SAKIT";
  pengajar: string;
  murid: string;
  attendance: {
    id: string;
    userId: string;
    status: string;
    waktuAbsen: string;
    startedAt: string | null;
    finishedAt: string | null;
    startLocation: { latitude: number; longitude: number; accuracy: number | null } | null;
    endLocation: { latitude: number; longitude: number; accuracy: number | null } | null;
    tanggal: string;
    mataPelajaran: string;
    catatan: string | null;
    buktiData: string | null;
    buktiMimeType: string | null;
    buktiNama: string | null;
  } | null;
  participantAttendance: { status: string; catatan: string | null; buktiData: string | null; buktiNama: string | null } | null;
};

function getCurrentLocation() {
  return new Promise<{ latitude: number; longitude: number; accuracy?: number }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Browser tidak mendukung lokasi perangkat."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }),
      () => reject(new Error("Izin lokasi diperlukan untuk mencatat absensi.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

export default function MuridAbsenPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [schedule, setSchedule] = React.useState<ScheduleAttendance | null>(null);
  const [history, setHistory] = React.useState<ScheduleAttendance[]>([]);
  const [historyFrom, setHistoryFrom] = React.useState("");
  const [historyTo, setHistoryTo] = React.useState("");

  const filteredHistory = React.useMemo(
    () =>
      history.filter((item) => {
        const day = item.tanggal.slice(0, 10);
        return (!historyFrom || day >= historyFrom) && (!historyTo || day <= historyTo);
      }),
    [history, historyFrom, historyTo],
  );

  const loadAttendance = React.useCallback(async () => {
    try {
      const result = await apiFetch<{ ok: boolean; data: ScheduleAttendance[]; active: ScheduleAttendance | null }>("/api/absensi", { cache: "no-store" });
      const next = result.active ?? result.data[0] ?? null;
      setSchedule(next);
      setHistory(result.data || []);
    } catch {
      setSchedule(null);
      setHistory([]);
    }
  }, []);

  React.useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);
  useVisiblePolling(loadAttendance, 20000);

  const exportCsv = async () => {
    const params = new URLSearchParams();
    if (historyFrom) params.set("from", historyFrom);
    if (historyTo) params.set("to", historyTo);
    const res = await fetch(`/api/profile/attendance/export?${params.toString()}`, { credentials: "include" });
    if (!res.ok) return alert("Gagal mengekspor data.");
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "absensi_murid.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleStart = async () => {
    if (!schedule) return;
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      await apiFetch<{ ok: boolean; data: unknown }>("/api/absensi", {
        method: "POST",
        body: JSON.stringify({ action: "start", jadwalId: schedule.jadwalId, location }),
      });
      toast("Presensi mulai berhasil dicatat sesuai jadwal belajar.", "success");
      await loadAttendance();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mencatat presensi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!schedule) return;
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      await apiFetch<{ ok: boolean; data: unknown }>("/api/absensi", {
        method: "POST",
        body: JSON.stringify({ action: "finish", jadwalId: schedule.jadwalId, location }),
      });
      toast("Sesi belajar sudah tercatat sebagai selesai.", "success");
      await loadAttendance();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menutup sesi absensi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const canStart = schedule && (schedule.status === "AKTIF" || schedule.status === "BERJALAN") && !["IZIN", "SAKIT"].includes(schedule.participantAttendance?.status || "");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Presensi Kehadiran Saya</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Absensi aktif sesuai jadwal yang ditetapkan oleh admin atau pengajar.</p>
      </div>

      <Card className="border-2 border-primary/40 bg-linear-to-br from-primary/5 via-card to-card shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="default" className="bg-primary text-white text-xs px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Sesi Kelas Hari Ini
            </Badge>
            <span className="text-xs font-semibold text-muted-foreground">{schedule ? formatDateIndo(schedule.tanggal) : "Belum ada jadwal"}</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl mt-2 text-foreground">{schedule ? schedule.mataPelajaran : "Tidak ada jadwal aktif"}</CardTitle>
          <CardDescription>
            Pengajar: <span className="font-bold text-foreground">{schedule?.pengajar || "—"}</span> • Mode Kelas: <span className="font-bold text-primary uppercase">{schedule?.mode || "—"}</span>
          </CardDescription>
          {schedule?.participantAttendance && ["IZIN", "SAKIT"].includes(schedule.participantAttendance.status) && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Pengajar mengajukan {schedule.participantAttendance.status.toLowerCase()}. {schedule.participantAttendance.catatan}
              {schedule.participantAttendance.buktiData && (
                <a href={schedule.participantAttendance.buktiData} target="_blank" rel="noreferrer" className="ml-2 font-semibold underline">
                  Lihat bukti
                </a>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Waktu Jadwal</p>
                <p className="text-xs sm:text-sm font-bold text-foreground">{schedule ? `${schedule.jamMulai} – ${schedule.jamSelesai} WIB` : "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Ruangan / Link</p>
                <p className="text-xs sm:text-sm font-bold text-foreground">{schedule?.ruangan || "Jadwal terhubung ke kelas"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Status Presensi</p>
                <p className="text-xs sm:text-sm font-bold text-foreground">{schedule?.status ? schedule.status.replace("_", " ") : "—"}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            {!schedule ? (
              <div className="w-full rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">Belum ada jadwal belajar yang aktif untuk hari ini.</div>
            ) : !schedule.attendance ? (
              <Button variant="accent" size="lg" isLoading={loading} disabled={!canStart} onClick={handleStart} className="w-full sm:w-auto px-8 h-12 text-base font-extrabold shadow-md hover:shadow-lg gap-2 disabled:opacity-50">
                <CheckCircle2 className="h-5 w-5" />
                Mulai Belajar
              </Button>
            ) : (
              <Button variant="warning" size="lg" isLoading={loading} disabled={schedule.status === "SELESAI"} onClick={handleFinish} className="w-full sm:w-auto px-8 h-12 text-base font-extrabold gap-2 disabled:opacity-50">
                <CheckCircle2 className="h-5 w-5" /> Selesai Belajar
              </Button>
            )}
            <p className="text-xs text-muted-foreground">Toleransi kehadiran: sistem aktif 15 menit sebelum sesi dimulai dan 15 menit setelah selesai.</p>
          </div>
          {schedule && (
            <AttendanceExcuseForm
              jadwalId={schedule.jadwalId}
              disabled={Boolean(schedule.attendance?.startedAt || schedule.attendance?.finishedAt || (schedule.attendance && ["HADIR", "TERLAMBAT"].includes(schedule.attendance.status)))}
              onSubmitted={loadAttendance}
            />
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Presensi Belajar</CardTitle>
          <CardDescription>Semua absensi murid tersinkron dari jadwal yang ada di database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2 print-hidden">
            <label className="text-xs text-muted-foreground">Dari</label>
            <input type="date" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} className="rounded-lg border border-border px-2 py-1 text-xs" />
            <label className="text-xs text-muted-foreground">Sampai</label>
            <input type="date" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} className="rounded-lg border border-border px-2 py-1 text-xs" />
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Printer className="mr-1 h-4 w-4" /> Cetak / CSV
            </Button>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase font-semibold text-muted-foreground bg-muted/30">
                <tr>
                  <th className="py-3 px-4">Tanggal & Waktu</th>
                  <th className="py-3 px-4">Mata Pelajaran</th>
                  <th className="py-3 px-4">Status Kehadiran</th>
                  <th className="py-3 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-foreground">{formatDateIndo(item.tanggal)}</p>
                      <p className="text-xs text-muted-foreground">{item.attendance ? new Date(item.attendance.waktuAbsen).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"} WIB</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">{item.mataPelajaran}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={item.attendance && item.attendance.status === "HADIR" ? "success" : "warning"}>{item.attendance ? item.attendance.status : item.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{item.attendance?.catatan || item.catatan || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredHistory.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border p-4 space-y-2 bg-card shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{formatDateIndo(item.tanggal)}</span>
                  <Badge variant={item.attendance && item.attendance.status === "HADIR" ? "success" : "warning"}>{item.attendance ? item.attendance.status : item.status}</Badge>
                </div>
                <h4 className="font-bold text-sm text-foreground">{item.mataPelajaran}</h4>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border text-muted-foreground">
                  <span>{item.attendance ? new Date(item.attendance.waktuAbsen).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"} WIB</span>
                  <span>{item.attendance?.catatan || item.catatan || "—"}</span>
                </div>
                {item.attendance?.buktiData && (
                  <a href={item.attendance.buktiData} target="_blank" rel="noreferrer" className="inline-flex text-xs font-semibold text-primary underline">
                    Lihat bukti {item.attendance.buktiNama || "absensi"}
                  </a>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
