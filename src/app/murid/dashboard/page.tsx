"use client";

import Link from "next/link";
import { CalendarCheck2, Clock, Video, CreditCard, BellRing, ArrowRight, CheckCircle2, AlertCircle, BookOpen, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as React from "react";
import { useProfileName } from "@/components/shared/ProfileAvatarUploader";
import { apiFetch } from "@/lib/api";
import { DUMMY_MURID, DUMMY_MATERI, DUMMY_KATALOG_UJIAN } from "@/lib/dummy-data";
import { formatRupiah, formatDateIndo, formatTimeIndo } from "@/lib/utils";
import * as ApiTypes from "@/types/api";
import { useVisiblePolling } from "@/lib/use-visible-polling";

export default function MuridDashboardPage() {
  const [profile, setProfile] = React.useState({
    name: "Murid",
    kelas: "SMA10",
    userId: undefined as string | undefined,
  });

  type APIJadwal = {
    id: string;
    pengajarId: string;
    muridId: string;
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
  };

  const [schedules, setSchedules] = React.useState<APIJadwal[]>([]);
  const [paymentSummary, setPaymentSummary] = React.useState({ amount: 0, status: "PENDING" });

  React.useEffect(() => {
    const loadMetadata = async () => {
      try {
        const result = await apiFetch<{ ok: boolean; user: { id: string; name: string; murid: { kelas: string } | null } }>("/api/profile");
        setProfile({
          name: result.user.name || "Murid",
          kelas: result.user.murid?.kelas || "SMA10",
          userId: result.user.id,
        });
      } catch {
        // fallback
      }
    };
    loadMetadata();
  }, []);

  const loadSchedules = React.useCallback(async () => {
    try {
      const res = await apiFetch<{ ok: boolean; data: APIJadwal[] }>("/api/portal/jadwal");
      if (res.ok) setSchedules(res.data || []);
    } catch {
      // Keep the existing dashboard data if the schedule feed is temporarily unavailable.
    }
  }, []);
  React.useEffect(() => { void loadSchedules(); }, [loadSchedules]);
  useVisiblePolling(loadSchedules, 30000);

  const loadPayment = React.useCallback(async () => {
    try {
      const result = await apiFetch<{ billAmount: number; billStatus: string }>("/api/payments");
      setPaymentSummary({ amount: result.billAmount || 0, status: result.billStatus || "PENDING" });
    } catch {
      // Keep the dashboard available if the payment feed is temporarily unavailable.
    }
  }, []);
  React.useEffect(() => { void loadPayment(); }, [loadPayment]);
  useVisiblePolling(loadPayment, 30000);

  const { name: activeName } = useProfileName("murid", profile.name, profile.userId);

  const [reminders, setReminders] = React.useState<ApiTypes.ReminderLog[]>([]);
  const loadReminders = React.useCallback(async () => {
    try {
      const result = await apiFetch<{ ok: boolean; data: ApiTypes.ReminderLog[] }>("/api/reminder");
      setReminders(result.data || []);
    } catch {
      // The dashboard remains usable when no reminder feed is available.
    }
  }, []);
  React.useEffect(() => { void loadReminders(); }, [loadReminders]);
  useVisiblePolling(loadReminders, 30000);

  const now = new Date();
  const jadwalTerdekat = schedules
    .filter((schedule) => schedule.status.toUpperCase() !== "DIBATALKAN")
    .filter((schedule) => {
      const dateTime = new Date(`${schedule.tanggal.slice(0, 10)}T${schedule.jamMulai}`);
      return dateTime >= now;
    })
    .sort((first, second) => {
      const firstTime = new Date(`${first.tanggal.slice(0, 10)}T${first.jamMulai}`).getTime();
      const secondTime = new Date(`${second.tanggal.slice(0, 10)}T${second.jamMulai}`).getTime();
      return firstTime - secondTime;
    })
    .slice(0, 5);
  const ujianTerdekat = DUMMY_KATALOG_UJIAN.filter((u) => u.kelasSasaran === profile.kelas);

  // Compute today's sessions from the same server-backed schedule list.
  const todayISO = new Date().toISOString().slice(0, 10);
  const todaySessions = jadwalTerdekat.filter((j) => j.tanggal === todayISO);
  const sessionsTodayCount = todaySessions.length;
  const nextSession = [...todaySessions].sort((a, b) => a.jamMulai.localeCompare(b.jamMulai))[0];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-linear-to-r from-primary via-purple-700 to-indigo-700 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Portal Pembelajaran Siswa
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Halo, {activeName}! 👋</h1>
          <p className="text-white/85 text-xs sm:text-sm max-w-xl leading-relaxed">
            {sessionsTodayCount > 0 ? (
              <>
                Kamu memiliki <span className="font-bold underline">{sessionsTodayCount} sesi kelas hari ini</span>. Jangan lupa lakukan presensi kehadiran tepat waktu ya!
              </>
            ) : (
              <>Saat ini tidak ada sesi terjadwal hari ini. Nikmati waktumu atau cek jadwal terbaru.</>
            )}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link href="/murid/absen">
              <Button variant="accent" size="sm" className="font-bold gap-1.5 shadow-sm">
                <CalendarCheck2 className="h-4 w-4" />
                Presensi Kelas Sekarang
              </Button>
            </Link>
            <Link href="/murid/materi">
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                Akses Materi Video
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Presensi Hari Ini */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Presensi Hari Ini</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{sessionsTodayCount > 0 ? "Sesi Dibuka" : "Tidak Ada Sesi"}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">{nextSession ? `${formatTimeIndo(nextSession.jamMulai)} – ${formatTimeIndo(nextSession.jamSelesai)} WIB` : "—"}</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Status Pembayaran */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Status Tagihan {new Date().toLocaleDateString("id-ID", { month: "long" })}</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{paymentSummary.status === "SUCCESS" ? "Lunas" : paymentSummary.status === "FAILED" || paymentSummary.status === "EXPIRED" ? "Gagal" : "Belum Bayar"}</h3>
              <p className="text-[11px] text-muted-foreground mt-1">{formatRupiah(paymentSummary.amount)}</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-purple-100 text-primary flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Ujian Mendatang */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Ujian Terdekat</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">UTS Matematika</h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">Data ujian terbaru</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <BellRing className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Materi Siap Dipelajari */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Modul & Video</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">5 Modul</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Video HD Bunny CDN</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Jadwal Mengajar Terdekat */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Jadwal Belajar Terdekat</CardTitle>
                <p className="text-xs text-muted-foreground">Sesi bimbingan aktif minggu ini</p>
              </div>
              <Link href="/murid/jadwal">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary">
                  Lihat Kalender <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {jadwalTerdekat.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/30 transition-all bg-card">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.mode === "online" ? "default" : "secondary"} className="text-[10px]">
                        {item.mode.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">{formatDateIndo(item.tanggal)}</span>
                    </div>
                    <h4 className="font-bold text-base text-foreground">{item.mataPelajaran}</h4>
                    <p className="text-xs text-muted-foreground">
                      Tutor: <span className="font-semibold text-foreground">{item.pengajarNama}</span> • {item.ruangan}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-foreground">
                        {item.jamMulai} – {item.jamSelesai}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Waktu Indonesia Barat</p>
                    </div>
                    <Link href="/murid/absen">
                      <Button variant="accent" size="sm" className="w-full sm:w-auto font-bold text-xs">
                        Hadir Sesi
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Materi Terbaru Rekomendasi */}
          <Card className="border-border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Materi Terbaru untuk Kamu</CardTitle>
                <p className="text-xs text-muted-foreground">Pelajari kembali konsep penting sebelum ujian</p>
              </div>
              <Link href="/murid/materi">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary">
                  Semua Materi <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DUMMY_MATERI.slice(0, 2).map((m) => (
                  <Link key={m.id} href={`/murid/materi/${m.id}`} className="group rounded-2xl border border-border p-3 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between bg-card">
                    <div>
                      <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-muted">
                        <img src={m.thumbnailUrl} alt={m.judul} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">{m.durasiMenit} Menit</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] mb-1.5">
                        {m.mataPelajaran}
                      </Badge>
                      <h5 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug">{m.judul}</h5>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border">Tutor: {m.pengajarNama}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Pengingat Ujian & Tagihan */}
        <div className="lg:col-span-4 space-y-6">
          {/* Pengingat Ujian Widget */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-amber-500" />
                  Katalog Ujian Terdekat
                </CardTitle>
                <Link href="/murid/katalog-ujian" className="text-xs text-primary font-semibold hover:underline">
                  Semua
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {ujianTerdekat.slice(0, 2).map((u) => (
                <div key={u.id} className="rounded-xl border border-border p-3 bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary uppercase">{u.mataPelajaran}</span>
                    <Badge variant="warning" className="text-[10px] py-0">
                      H-3 Ujian
                    </Badge>
                  </div>
                  <h5 className="font-bold text-xs text-foreground">{u.namaUjian}</h5>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {formatDateIndo(u.tanggal)} • {u.jam}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BellRing className="h-4 w-4 text-primary" />
                Pengingat Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reminders.slice(0, 3).map((reminder) => (
                <div key={reminder.id} className="rounded-xl border border-border p-3 text-xs">
                  <p className="font-semibold">{reminder.keterangan || `Pengingat ${reminder.tipe}`}</p>
                  <p className="mt-1 text-muted-foreground">{new Date(reminder.sentAt).toLocaleString("id-ID")}</p>
                </div>
              ))}
              {reminders.length === 0 && <p className="text-xs text-muted-foreground">Belum ada pengingat terbaru.</p>}
            </CardContent>
          </Card>

          {/* Tagihan Bulan Ini Widget */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Tagihan Bimbel Bulan Ini
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800">Periode {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</span>
                  <Badge variant={paymentSummary.status === "SUCCESS" ? "success" : "warning"}>{paymentSummary.status === "SUCCESS" ? "LUNAS" : "MENUNGGU"}</Badge>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-extrabold text-emerald-950 tabular-nums">{formatRupiah(paymentSummary.amount)}</span>
                  <span className="text-xs text-emerald-700 font-medium">BCA Virtual Account</span>
                </div>
              </div>

              <Link href="/murid/pembayaran">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                  Lihat Riwayat Tagihan & Bukti
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
