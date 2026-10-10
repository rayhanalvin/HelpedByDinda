"use client";

import * as React from "react";
import { CalendarCheck2, Clock, MapPin, CheckCircle2, Sparkles, Briefcase, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { formatDateIndo } from "@/lib/utils";
import { AttendanceExcuseForm } from "@/components/shared/AttendanceExcuseForm";
import { useVisiblePolling } from "@/lib/use-visible-polling";
import { renderRuanganLink } from "@/lib/ruangan-link";

type ScheduleAttendance = {
  id: string;
  jadwalId: string;
  userId: string;
  kelompokId?: string | null;
  kelompokNama?: string | null;
  kelompokMurid?: string | null;
  leden?: { muridId: string; murid: string }[];
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

type GroepLidStatus = {
  muridId: string;
  muridNama: string;
  status: string | null;
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

export default function PengajarAbsenPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [schedule, setSchedule] = React.useState<ScheduleAttendance | null>(null);
  const [history, setHistory] = React.useState<ScheduleAttendance[]>([]);
  const [historyFrom, setHistoryFrom] = React.useState("");
  const [historyTo, setHistoryTo] = React.useState("");
  const [groepStatus, setGroepStatus] = React.useState<Record<string, Record<string, string>>>({});
  const [savingGroep, setSavingGroep] = React.useState(false);

  const applyGroepAbsensi = React.useCallback((rows: ScheduleAttendance[], absensi: Record<string, GroepLidStatus[]>) => {
    const next: Record<string, Record<string, string>> = {};
    for (const row of rows) {
      if (!row.kelompokId) continue;
      const members = absensi[row.kelompokId] || [];
      for (const member of members) {
        next[row.kelompokId] = next[row.kelompokId] || {};
        next[row.kelompokId][member.muridId] = member.status || "HADIR";
      }
    }
    if (JSON.stringify(next) !== JSON.stringify(groepStatus)) setGroepStatus(next);
  }, [groepStatus]);

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
      const result = await apiFetch<{ ok: boolean; data: ScheduleAttendance[]; active: ScheduleAttendance | null; groepAbsensi?: Record<string, GroepLidStatus[]> }>("/api/absensi", { cache: "no-store" });
      const next = result.active ?? result.data[0] ?? null;
      setSchedule(next);
      setHistory(result.data || []);
      if (result.groepAbsensi) void applyGroepAbsensi(result.data || [], result.groepAbsensi);
    } catch {
      setSchedule(null);
      setHistory([]);
    }
  }, [applyGroepAbsensi]);

  React.useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);
  useVisiblePolling(loadAttendance, 20000);

  // export attendance CSV for pengajar (current month or filtered range)
  const exportCsv = async (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const url = `/api/profile/attendance/export?${params.toString()}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return alert("Gagal mengekspor data.");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "attendance_pengajar.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
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
      toast("Presensi mengajar berhasil dicatat.", "success");
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
      toast("Sesi mengajar selesai tercatat.", "success");
      await loadAttendance();
      // Ensure admin monitoring sees change quickly
      try {
        await fetch("/api/admin/absensi", { method: "GET", credentials: "include" });
      } catch {}
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menutup sesi mengajar.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGroepAbsensi = async () => {
    if (!schedule || !schedule.kelompokId) return;
    const entries = (groepStatus[schedule.kelompokId] || []);
    const payload = Object.entries(entries).map(([muridId, status]) => ({ muridId, status }));
    if (!payload.length) {
      toast("Belum ada lid van de groep om absensi in te vullen.", "error");
      return;
    }
    setSavingGroep(true);
    try {
      await apiFetch<{ ok: boolean }>("/api/absensi", {
        method: "POST",
        body: JSON.stringify({ action: "group-attendance", jadwalId: schedule.jadwalId, entries: payload }),
      });
      toast("Absensi groep succesvol opgeslagen en gesynchroniseerd naar admin.", "success");
      await loadAttendance();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal opslaan absensi groep.", "error");
    } finally {
      setSavingGroep(false);
    }
  };

  const canStart = schedule && (schedule.status === "AKTIF" || schedule.status === "BERJALAN") && !["IZIN", "SAKIT"].includes(schedule.participantAttendance?.status || "");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Presensi Mengajar Saya</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Absensi aktif mengikuti jadwal yang ditetapkan oleh admin atau murid yang terdaftar.</p>
      </div>

      <Card className="border-2 border-emerald-400/40 bg-linear-to-br from-emerald-50/40 via-card to-card shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="success" className="text-xs px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Sesi Mengajar Hari Ini
            </Badge>
            <span className="text-xs font-semibold text-muted-foreground">{schedule ? formatDateIndo(schedule.tanggal) : "Belum ada jadwal"}</span>
          </div>

          <CardTitle className="text-xl sm:text-2xl mt-2 text-foreground">{schedule ? schedule.mataPelajaran : "Tidak ada jadwal aktif"}</CardTitle>
          <CardDescription>
            {schedule?.kelompokNama ? (
              <>
                Kelompok: <span className="font-bold text-foreground">{schedule.kelompokNama}</span>
              </>
            ) : (
              <>Murid: <span className="font-bold text-foreground">{schedule?.murid || "—"}</span></>
            )}{" "}• Mode: <span className="font-bold text-primary uppercase">{schedule?.mode || "—"}</span>
          </CardDescription>
          {schedule?.participantAttendance && ["IZIN", "SAKIT"].includes(schedule.participantAttendance.status) && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Murid mengajukan {schedule.participantAttendance.status.toLowerCase()}. {schedule.participantAttendance.catatan}
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
                <p className="text-[11px] text-muted-foreground">Waktu Sesi</p>
                <p className="text-xs sm:text-sm font-bold text-foreground">{schedule ? `${schedule.jamMulai} – ${schedule.jamSelesai} WIB` : "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Ruangan / Tautan</p>
                <p className="text-xs sm:text-sm font-bold">{schedule?.ruangan ? renderRuanganLink(schedule.ruangan) : "Jadwal terhubung ke kelas"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Status Jadwal</p>
                <p className="text-xs sm:text-sm font-bold text-emerald-700">{schedule ? schedule.status.replace("_", " ") : "—"}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            {!schedule ? (
              <div className="w-full rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">Belum ada jadwal mengajar yang aktif untuk hari ini.</div>
            ) : !schedule.attendance ? (
              <Button variant="accent" size="lg" isLoading={loading} disabled={!canStart} onClick={handleStart} className="w-full sm:w-auto px-8 h-12 text-base font-extrabold shadow-md hover:shadow-lg gap-2 disabled:opacity-50">
                <CheckCircle2 className="h-5 w-5" />
                Mulai Mengajar
              </Button>
            ) : (
              <Button variant="warning" size="lg" isLoading={loading} disabled={schedule.status === "SELESAI"} onClick={handleFinish} className="w-full sm:w-auto px-8 h-12 text-base font-extrabold gap-2 disabled:opacity-50">
                <CheckCircle2 className="h-5 w-5" /> Selesai Mengajar
              </Button>
            )}
            <p className="text-xs text-muted-foreground">Presensi otomatis dibuka saat jadwal mulai dan ditutup ketika sesi berakhir.</p>
          </div>
          {schedule && (
            <AttendanceExcuseForm
              jadwalId={schedule.jadwalId}
              disabled={Boolean(schedule.attendance?.startedAt || schedule.attendance?.finishedAt || (schedule.attendance && ["HADIR", "TERLAMBAT"].includes(schedule.attendance.status)))}
              onSubmitted={loadAttendance}
            />
          )}
          {schedule?.kelompokId && Object.keys(groepStatus[schedule.kelompokId] || {}).length > 0 && (
            <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
              <p className="text-xs font-bold text-foreground">Absensi Leden Groep — {schedule.kelompokNama || "Sesi Groep"}</p>
              <p className="text-[11px] text-muted-foreground">Stel per lid de status in (Hadir, Izin, Sakit, Alpa). Eén keer &quot;Simpan Absensi&quot; slaat de hele groep op.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(groepStatus[schedule.kelompokId] || {}).map(([muridId, status]) => {
                  const leden = schedule.leden?.filter((lid) => lid.muridId === muridId);
                  const lidNama = leden?.length ? leden[0].murid : schedule.kelompokMurid || muridId;
                  return (
                    <div key={muridId} className="rounded-xl border border-border bg-card p-2.5">
                      <p className="text-xs font-semibold text-foreground">{lidNama || muridId}</p>
                      <select
                        className="mt-1 h-9 w-full rounded-lg border border-input bg-card px-2 text-xs"
                        value={status}
                        onChange={(event) => setGroepStatus((current) => ({ ...current, [schedule.kelompokId as string]: { ...current[schedule.kelompokId as string], [muridId]: event.target.value } }))}
                      >
                        <option value="HADIR">Hadir</option>
                        <option value="IZIN">Izin</option>
                        <option value="SAKIT">Sakit</option>
                        <option value="ALPHA">Alpa</option>
                      </select>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <Button variant="accent" size="sm" isLoading={savingGroep} onClick={() => void handleSaveGroepAbsensi()} className="text-xs font-bold gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Simpan Absensi
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Presensi Mengajar</CardTitle>
          <CardDescription>Semua data absensi pengajar tersinkron dari database jadwal dan sesi belajar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2 print-hidden">
            <label className="text-xs text-muted-foreground">Dari</label>
            <input type="date" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} className="rounded-lg border border-border px-2 py-1 text-xs" />
            <label className="text-xs text-muted-foreground">Sampai</label>
            <input type="date" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} className="rounded-lg border border-border px-2 py-1 text-xs" />
            <Button size="sm" variant="outline" onClick={() => exportCsv(historyFrom, historyTo)}>
              <Printer className="mr-1 h-4 w-4" /> Cetak / CSV
            </Button>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase font-semibold text-muted-foreground bg-muted/30">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Mata Pelajaran</th>
                  <th className="py-3 px-4">Waktu Presensi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground">{formatDateIndo(item.tanggal)}</td>
                    <td className="py-3.5 px-4 font-medium text-foreground">{item.mataPelajaran}</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{item.attendance ? new Date(item.attendance.waktuAbsen).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"} WIB</td>
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
