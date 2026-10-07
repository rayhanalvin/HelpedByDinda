"use client";

import * as React from "react";
import { Calendar, Clock, MapPin, Video, User, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
};

export default function MuridJadwalPage() {
  const [schedules, setSchedules] = React.useState<APIJadwal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterMode, setFilterMode] = React.useState<"all" | "online" | "offline">("all");
  const [isRefreshing, setIsRefreshing] = React.useState(false);

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

  React.useEffect(() => { fetchSchedules(); }, [fetchSchedules]);
  useVisiblePolling(() => fetchSchedules(true), 30000);

  const muridSchedules = schedules.filter((j) => {
    const matchMode = filterMode === "all" || j.mode === filterMode;
    return matchMode;
  });

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
                  {item.kelompokNama && <p className="text-xs font-semibold text-primary">Kelompok sesi: {item.kelompokNama}{item.kelompokMurid?.length ? ` · ${item.kelompokMurid.join(", ")}` : ""}</p>}

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
    </div>
  );
}
