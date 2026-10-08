"use client";

import * as React from "react";
import { BellRing, Clock, Calendar, MapPin, User, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { formatDateIndo } from "@/lib/utils";

interface UjianItem {
  id: string;
  namaUjian: string;
  mataPelajaran: string;
  kelasSasaran: "SD" | "SMP" | "SMA" | "UTBK";
  tanggal: string;
  jam: string;
  deskripsi: string;
  lokasi: string;
  pengajarNama: string;
  isPublished: boolean;
}

const getDaysRemaining = (targetDateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${targetDateStr}T00:00:00`);
  if (Number.isNaN(target.getTime())) return 0;
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function MuridKatalogUjianPage() {
  const [ujianList, setUjianList] = React.useState<UjianItem[]>([]);
  const [studentKelas, setStudentKelas] = React.useState("SMA");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const result = await apiFetch<{
          user: { murid?: { kelas?: string | null } | null };
        }>("/api/profile");
        if (!active) return;
        if (result?.user?.murid?.kelas) setStudentKelas(result.user.murid.kelas);
      } catch {
        // keep default when session is unavailable
      }
    };

    const loadUjian = async () => {
      try {
        const response = await apiFetch<{ ok: boolean; data: UjianItem[] }>("/api/ujian");
        if (active && response.ok) {
          const list = response.data.filter((item) => item.isPublished).sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jam.localeCompare(b.jam));
          setUjianList(list);
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProfile();
    void loadUjian();

    const handleMuridChange = (event: Event) => {
      const ev = event as CustomEvent;
      if (ev.detail?.kelas) setStudentKelas(ev.detail.kelas);
      else void loadUjian();
    };
    window.addEventListener("profile-murid-change", handleMuridChange as EventListener);
    return () => {
      active = false;
      window.removeEventListener("profile-murid-change", handleMuridChange as EventListener);
    };
  }, []);

  const filtered = ujianList.filter((ujian) => ujian.kelasSasaran === studentKelas);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Pengingat & Katalog Ujian</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Pantau jadwal ujian untuk kelas <strong className="text-foreground">{studentKelas}</strong> agar persiapan belajarmu semakin matang.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat katalog ujian…
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Belum ada ujian terbit untuk kelas {studentKelas}. Cek kembali nanti ya!</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((ujian) => {
            const daysLeft = getDaysRemaining(ujian.tanggal);
            const isUrgent = daysLeft <= 5;

            return (
              <Card key={ujian.id} className={`border transition-all shadow-xs ${isUrgent ? "border-amber-300 bg-linear-to-br from-amber-50/40 via-card to-card" : "border-border"}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={isUrgent ? "warning" : "default"} className="font-bold text-xs">
                      {daysLeft > 0 ? `${daysLeft} Hari Lagi` : daysLeft === 0 ? "Hari Ini" : "Sudah Berlalu"}
                    </Badge>
                    <span className="text-xs font-bold text-primary uppercase">{ujian.mataPelajaran}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground">{ujian.namaUjian}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{ujian.deskripsi}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary shrink-0" />
                      <span>{formatDateIndo(ujian.tanggal)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent shrink-0" />
                      <span>{ujian.jam} WIB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-600 shrink-0" />
                      <span>
                        PIC: <strong className="text-foreground">{ujian.pengajarNama || "-"}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>{ujian.lokasi}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="border-border bg-secondary/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <BellRing className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Tips Menghadapi Ujian Bersama Tutor</h3>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>• Ulangi menonton video pembahasan konsep di menu **Materi Belajar** minimal H-3 sebelum ujian.</li>
            <li>• Buat daftar rumus atau konsep yang masih membingungkan dan diskusikan di sesi tanya-jawab privat.</li>
            <li>• Istirahat yang cukup di malam hari sebelum pelaksanaan ujian agar konsentrasi tetap prima.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
