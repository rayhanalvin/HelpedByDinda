"use client";

import Link from "next/link";
import { CalendarCheck2, Clock, Coins, Sparkles, ArrowRight, Users, BellRing, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as React from "react";
import { useProfileName } from "@/components/shared/ProfileAvatarUploader";
import { apiFetch } from "@/lib/api";
import * as ApiTypes from "@/types/api";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type Schedule = {
  id: string;
  mataPelajaran: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  mode: "online" | "offline";
  ruangan: string | null;
  muridNama: string;
  status: string;
};

type TeacherFee = ApiTypes.FeeRow;

export default function PengajarDashboardPage() {
  const [profile, setProfile] = React.useState({
    name: "Pengajar",
    spesialisasi: "Belum diatur",
    nominalPerJam: 0,
    ratePerSession: 0,
    rateSessions: [] as { kelasGroup: string; mode: "ONLINE" | "OFFLINE"; rate: number }[],
    totalJamBulanIni: 0,
    userId: undefined as string | undefined,
  });
  const [jadwalPengajar, setJadwalPengajar] = React.useState<Schedule[]>([]);
  const [feeBulanIni, setFeeBulanIni] = React.useState<TeacherFee | null>(null);

  React.useEffect(() => {
    const loadMetadata = async () => {
      try {
        const result = await apiFetch<{
          ok: boolean;
          user: {
            id: string;
            name: string;
            pengajar: {
              spesialisasi: string;
              nominalPerJam: number;
              ratePerSession: number;
              rateSessions: { kelasGroup: string; mode: "ONLINE" | "OFFLINE"; rate: number }[];
              totalJamBulanIni: number;
            } | null;
          };
        }>("/api/profile");
        setProfile({
          name: result.user.name || "Pengajar",
          spesialisasi: result.user.pengajar?.spesialisasi || "Belum diatur",
          nominalPerJam: result.user.pengajar?.nominalPerJam || 0,
          ratePerSession: result.user.pengajar?.ratePerSession || result.user.pengajar?.nominalPerJam || 0,
          rateSessions: result.user.pengajar?.rateSessions || [],
          totalJamBulanIni: result.user.pengajar?.totalJamBulanIni || 0,
          userId: result.user.id,
        });
      } catch {
        // fallback
      }
    };
    loadMetadata();
  }, []);

  const { name: activeName } = useProfileName("pengajar", profile.name, profile.userId);

  const [reminders, setReminders] = React.useState<ApiTypes.ReminderLog[]>([]);
  const reminderPengajar = reminders.filter((r) => r.tipe === "mengajar");

  const loadDashboard = React.useCallback(async () => {
    try {
      const [scheduleRes, feeRes, reminderRes] = await Promise.all([
        apiFetch<{ ok: boolean; data: Schedule[] }>("/api/portal/jadwal"),
        apiFetch<{ ok: boolean; data: TeacherFee[] }>(`/api/profile/fee?periode=${new Date().toISOString().slice(0, 7)}`),
        apiFetch<{ ok: boolean; data: ApiTypes.ReminderLog[] }>("/api/reminder"),
      ]);
      setJadwalPengajar(scheduleRes.data || []);
      setFeeBulanIni(feeRes.data?.[0] || null);
      setReminders(reminderRes.data || []);
    } catch {
      // Keep the dashboard available with the last successful snapshot.
    }
  }, []);
  React.useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);
  useVisiblePolling(loadDashboard, 30000);

  const sesiHariIni = jadwalPengajar.filter((schedule) => schedule.tanggal.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const totalMurid = new Set(jadwalPengajar.map((schedule) => schedule.muridNama)).size;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-linear-to-r from-emerald-700 via-teal-800 to-primary p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Portal Tutor & Pengajar
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Selamat Mengajar, Kak {activeName}! 📚</h1>
          <p className="text-white/85 text-xs sm:text-sm max-w-xl leading-relaxed">
            Spesialisasi: <span className="font-bold">{profile.spesialisasi}</span>. Kamu memiliki <span className="font-bold underline">{sesiHariIni} sesi mengajar hari ini</span>.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link href="/pengajar/absen">
              <Button variant="accent" size="sm" className="font-bold gap-1.5 bg-white text-emerald-800 hover:bg-white/90">
                <CalendarCheck2 className="h-4 w-4" />
                Absen Mengajar Hari Ini
              </Button>
            </Link>
            <Link href="/pengajar/materi/baru">
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/25 hover:bg-white/20">
                + Upload Materi Baru
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Estimasi Fee */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Estimasi Fee Bulan Ini</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5 tabular-nums">{feeBulanIni ? formatRupiah(feeBulanIni.totalFee) : "Rp 0"}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">{feeBulanIni?.totalJam || 0} Jam Mengajar Valid</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Coins className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Tarif Rate Per Sesi */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Tarif Rate Per Sesi</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5 tabular-nums">{formatRupiah(profile.ratePerSession || profile.nominalPerJam)}</h3>
              <p className="text-[11px] text-muted-foreground mt-1">{profile.rateSessions.length ? `${profile.rateSessions.length} rate kelola admin` : "Tarif Standar Per Sesi"}</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-purple-100 text-primary flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Status Sesi Hari Ini */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Sesi Hari Ini</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{sesiHariIni} Sesi Aktif</h3>
              <p className="text-[11px] text-primary font-medium mt-1">Data jadwal terbaru</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Total Murid Bimbingan */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Murid Bimbingan</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{totalMurid} Murid Aktif</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Dari jadwal aktif</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Jadwal Mengajar */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Jadwal Mengajar Terdekat</CardTitle>
                <p className="text-xs text-muted-foreground">Sesi bimbingan aktif yang Anda ampu</p>
              </div>
              <Link href="/pengajar/jadwal">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary">
                  Semua Jadwal <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {jadwalPengajar.map((item) => (
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
                      Murid: <span className="font-semibold text-foreground">{item.muridNama}</span> • Ruang: {item.ruangan}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-foreground">
                        {item.jamMulai} – {item.jamSelesai}
                      </p>
                      <p className="text-[10px] text-muted-foreground">90 Menit</p>
                    </div>
                    <Link href="/pengajar/absen">
                      <Button variant="accent" size="sm" className="font-bold text-xs">
                        Absen Mengajar
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Rekap Fee & Notifikasi */}
        <div className="lg:col-span-4 space-y-6">
          {/* Rekap Fee Singkat */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="h-4 w-4 text-emerald-600" />
                  Rekap Fee Mengajar
                </CardTitle>
                <Link href="/pengajar/fee" className="text-xs text-primary font-semibold hover:underline">
                  Rincian
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Periode {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</span>
                  <Badge variant={feeBulanIni?.status === "PAID" ? "success" : "warning"}>{feeBulanIni?.status === "PAID" ? "SUDAH DIBAYAR" : "BELUM DIBAYAR"}</Badge>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-extrabold text-foreground tabular-nums">{feeBulanIni ? formatRupiah(feeBulanIni.totalFee) : "Rp 0"}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {feeBulanIni?.totalJam || profile.totalJamBulanIni} Sesi × {formatRupiah(profile.ratePerSession || profile.nominalPerJam)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifikasi Pengingat Mengajar */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BellRing className="h-4 w-4 text-primary" />
                Pengingat Terkirim (Resend)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {reminderPengajar.slice(0, 2).map((r) => (
                <div key={r.id} className="rounded-xl border border-border p-3 bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Email Berhasil
                    </span>
                    <span className="text-[10px] text-muted-foreground">H-1 Sesi</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">{r.keterangan}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
