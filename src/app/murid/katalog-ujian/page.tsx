"use client";

import * as React from "react";
import { BellRing, Clock, Calendar, MapPin, User, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DUMMY_KATALOG_UJIAN, DUMMY_MURID } from "@/lib/dummy-data";
import { formatDateIndo } from "@/lib/utils";

export default function MuridKatalogUjianPage() {
  const currentMurid = DUMMY_MURID[0]; // Rizky Maulana (SMA)

  // Calculate days remaining helper
  const getDaysRemaining = (targetDateStr: string) => {
    const today = new Date("2025-07-15"); // Context base date
    const target = new Date(targetDateStr);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Pengingat & Katalog Ujian</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Pantau jadwal ujian sekolah dan try out nasional agar persiapan belajarmu semakin matang.</p>
      </div>

      {/* Grid Ujian */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DUMMY_KATALOG_UJIAN.map((ujian) => {
          const daysLeft = getDaysRemaining(ujian.tanggal);
          const isUrgent = daysLeft <= 5;

          return (
            <Card key={ujian.id} className={`border transition-all shadow-xs ${isUrgent ? "border-amber-300 bg-linear-to-br from-amber-50/40 via-card to-card" : "border-border"}`}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={isUrgent ? "warning" : "default"} className="font-bold text-xs">
                    {daysLeft > 0 ? `${daysLeft} Hari Lagi` : "Hari Ini"}
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
                    <span>{ujian.jam}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-600 shrink-0" />
                    <span>
                      PIC: <strong className="text-foreground">{ujian.pengajarPic}</strong>
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

      {/* Preparation Tips */}
      <Card className="border-border bg-secondary/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
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
