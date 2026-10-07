"use client";

import * as React from "react";
import Link from "next/link";
import { Users, GraduationCap, CreditCard, Coins, Send, Plus, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useVisiblePolling } from "@/lib/use-visible-polling";
import { DUMMY_ADMIN } from "@/lib/dummy-data";
import { useProfileName } from "@/components/shared/ProfileAvatarUploader";

type DashboardStats = {
  totalMurid: number;
  totalPengajar: number;
  totalPembayaranMasuk: number;
  totalFeeHarusDibayar: number;
  totalJamMengajar: number;
  recentAbsensi: Array<{
    id: string;
    userName: string;
    role: string;
    mataPelajaran: string;
    waktuAbsen: string;
    status: string;
  }>;
  nextSchedules: Array<{
    id: string;
    mataPelajaran: string;
    mode: string;
    pengajarNama: string;
    muridNama: string;
    tanggal: string;
    jamMulai: string;
  }>;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [profile, setProfile] = React.useState({ name: DUMMY_ADMIN.nama, userId: undefined as string | undefined });
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadStats = React.useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await apiFetch<{ ok: boolean; data: DashboardStats }>("/api/admin/dashboard");
      if (res.ok) {
        // ensure UI shows server-calculated fee total
        setStats(res.data);
        setLoadError(null);
      }
    } catch (error) {
      if (!silent) {
        setLoadError(error instanceof Error ? error.message : "Dasbor admin tidak dapat dimuat.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadStats();
    const loadProfile = async () => {
      try {
        const res = await apiFetch<{ ok: boolean; user: { id: string; name: string } }>("/api/profile");
        if (res?.user) {
          setProfile({ name: res.user.name || DUMMY_ADMIN.nama, userId: res.user.id });
        }
      } catch {
        // ignore
      }
    };
    loadProfile();
  }, [loadStats]);
  useVisiblePolling(() => loadStats(true), 30000);

  const { name: adminName } = useProfileName("admin", profile.name, profile.userId);

  if (loading && !stats) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Memuat data dasbor...
      </div>
    );
  }

  if (loadError && !stats) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center rounded-3xl border border-border bg-card p-8 text-center shadow-xs">
        <h1 className="text-xl font-bold text-foreground">Sesi admin tidak tersedia</h1>
        <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
        <Link href="/login?role=admin" className="mt-5">
          <Button variant="accent">Masuk sebagai Admin</Button>
        </Link>
      </div>
    );
  }

  if (!stats) return null;

  const totalMurid = stats.totalMurid;
  const totalPengajar = stats.totalPengajar;
  const totalPembayaranMasuk = stats.totalPembayaranMasuk;
  const totalFeeHarusDibayar = stats.totalFeeHarusDibayar;

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Dasbor {adminName || "Superadmin"}</h1>
            <Badge variant="default" className="text-[10px]">
              VERSI MVP 1.0
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Ringkasan menyeluruh operasional bimbingan belajar Helped By Dinda.</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link href="/admin/pengingat">
            <Button variant="accent" size="sm" className="font-bold gap-1.5 text-xs shadow-xs">
              <Send className="h-3.5 w-3.5" /> Pusat Pengingat
            </Button>
          </Link>
          <Link href="/admin/jadwal">
            <Button variant="outline" size="sm" className="font-semibold gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Buat Jadwal
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Murid */}
        <Card className="border-border shadow-xs hover:border-primary/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Murid Aktif</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5 tabular-nums">{totalMurid} Murid</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">100% Terdaftar</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-100 text-primary flex items-center justify-center shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Pengajar */}
        <Card className="border-border shadow-xs hover:border-primary/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Pengajar (Tutor)</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5 tabular-nums">{totalPengajar} Tutor</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Terverifikasi Aktif</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pembayaran Masuk */}
        <Card className="border-border shadow-xs hover:border-primary/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pembayaran Masuk (Juli)</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-0.5 tabular-nums">{formatRupiah(totalPembayaranMasuk)}</h3>
              <p className="text-[11px] text-muted-foreground mt-1">2 Invoice Lunas Midtrans</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CreditCard className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Total Fee Pengajar */}
        <Card className="border-border shadow-xs hover:border-primary/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Fee Tutor Bulan Ini</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5 tabular-nums">{formatRupiah(totalFeeHarusDibayar)}</h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">{stats.totalJamMengajar} Jam Mengajar Valid</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Coins className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2 Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Presensi & Aktivitas Terbaru */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Presensi Terkini Hari Ini</CardTitle>
                <p className="text-xs text-muted-foreground">Catatan kehadiran murid dan pengajar realtime</p>
              </div>
              <Link href="/admin/absensi">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary">
                  Pantau Semua <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentAbsensi.map((absen) => (
                  <div key={absen.id} className="p-3.5 rounded-2xl border border-border bg-card flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center text-primary font-bold text-xs">{absen.role === "pengajar" ? "TTR" : "MRD"}</div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{absen.userName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {absen.mataPelajaran} • {new Date(absen.waktuAbsen).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                        </p>
                      </div>
                    </div>

                    <Badge variant={absen.status === "hadir" ? "success" : "warning"} className="text-[10px]">
                      {absen.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
                {stats.recentAbsensi.length === 0 && <div className="text-center py-6 text-xs text-muted-foreground">Belum ada absensi tercatat hari ini.</div>}
              </div>
            </CardContent>
          </Card>

          {/* Quick Schedule Preview */}
          <Card className="border-border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Jadwal Sesi Mendatang</CardTitle>
                <p className="text-xs text-muted-foreground">Jadwal bimbingan minggu ini</p>
              </div>
              <Link href="/admin/jadwal">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary">
                  Kelola Jadwal <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {stats.nextSchedules.map((j) => (
                  <div key={j.id} className="p-3 rounded-xl border border-border flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-foreground">
                        {j.mataPelajaran} ({j.mode.toUpperCase()})
                      </p>
                      <p className="text-muted-foreground">
                        Tutor: {j.pengajarNama} ➔ Murid: {j.muridNama}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatDateIndo(j.tanggal)}</p>
                      <p className="text-muted-foreground">{j.jamMulai} WIB</p>
                    </div>
                  </div>
                ))}
                {stats.nextSchedules.length === 0 && <div className="text-center py-6 text-xs text-muted-foreground">Tidak ada jadwal mendatang.</div>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Quick Action Pusat Pengingat */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border shadow-xs bg-linear-to-br from-primary/5 via-card to-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Aksi Cepat Pengingat
              </CardTitle>
              <CardDescription>Kirim pengingat email otomatis dengan 1-klik</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/pengingat" className="block">
                <div className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">Pengingat Mengajar Besok</p>
                    <p className="text-[11px] text-muted-foreground">Kirim ke semua tutor H-1</p>
                  </div>
                  <Send className="h-4 w-4 text-primary" />
                </div>
              </Link>

              <Link href="/admin/pengingat" className="block">
                <div className="p-3.5 rounded-xl border border-border bg-card hover:border-accent/50 transition-all flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">Pengingat Tagihan SPP</p>
                    <p className="text-[11px] text-muted-foreground">Kirim ke murid status pending</p>
                  </div>
                  <Send className="h-4 w-4 text-accent" />
                </div>
              </Link>

              <Link href="/admin/pengingat" className="block">
                <div className="p-3.5 rounded-xl border border-border bg-card hover:border-purple-400 transition-all flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">Pengingat Presensi Sesi</p>
                    <p className="text-[11px] text-muted-foreground">Kirim sebelum sesi dimulai</p>
                  </div>
                  <Send className="h-4 w-4 text-purple-600" />
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Status Midtrans Tracking */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                Midtrans Snap Live Monitor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                <span className="text-muted-foreground">Status Gateway</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Terhubung
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                <span className="text-muted-foreground">Environment</span>
                <span className="font-mono font-bold text-foreground">Sandbox Midtrans</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                <span className="text-muted-foreground">Webhook Verification</span>
                <span className="font-bold text-primary">SHA512 Active</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
