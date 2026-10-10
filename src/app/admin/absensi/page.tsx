"use client";

import * as React from "react";
import { CalendarCheck2, Search, MapPin, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type AdminAbsensiItem = {
  id: string;
  jadwalId: string;
  userId: string;
  actorRole: "PENGAJAR" | "MURID";
  status: string;
  waktuAbsen: string;
  catatan: string | null;
  buktiData: string | null;
  buktiMimeType: string | null;
  buktiNama: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  startLocation: { latitude: number; longitude: number; accuracy: number | null } | null;
  endLocation: { latitude: number; longitude: number; accuracy: number | null } | null;
  mataPelajaran: string;
  tanggal: string;
  nama: string;
  murid: string;
  pengajar: string;
  jadwalStatus: string;
  jamMulai: string;
  jamSelesai: string;
  mode: string;
  kelompokId?: string | null;
  kelompokNama?: string | null;
  jumlahLeden?: number;
};

function mapsUrl(location: { latitude: number; longitude: number } | null) {
  return location ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}` : null;
}

function SessionCard({ session }: { session: AdminAbsensiItem }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
              <CalendarCheck2 size={19} />
            </div>
            <div>
              <h2 className="font-heading font-bold">{session.nama}</h2>
              <p className="text-sm text-muted-foreground">
                {session.mataPelajaran} · {session.pengajar} · {session.mode}
                {session.kelompokNama ? ` · Groep: ${session.kelompokNama} (${session.jumlahLeden || 1} leden)` : ""}
              </p>
            </div>
          </div>
          <Badge variant={session.status === "HADIR" ? "success" : session.status === "SAKIT" ? "destructive" : session.status === "IZIN" ? "secondary" : "warning"}>{session.status}</Badge>
        </div>
        <div className="grid gap-3 rounded-xl bg-muted/40 p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Jadwal belajar</p>
            <p className="font-semibold">{new Date(session.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            <p className="text-muted-foreground">
              {session.jamMulai} - {session.jamSelesai} WIB
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Murid</p>
            <p className="font-semibold">{session.murid}</p>
            <p className="text-xs text-muted-foreground">Jadwal: {session.jadwalStatus}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Waktu absensi</p>
            <p className="font-semibold">Mulai: {session.startedAt ? new Date(session.startedAt).toLocaleString("id-ID") : "—"}</p>
            <p className="font-semibold">Selesai: {session.finishedAt ? new Date(session.finishedAt).toLocaleString("id-ID") : "—"}</p>
            <p className="text-xs text-muted-foreground">Pengajar: {session.pengajar}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {session.catatan && <p className="w-full text-sm text-muted-foreground">Catatan: {session.catatan}</p>}
          {session.buktiData && (
            <a href={session.buktiData} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-primary/20 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5">
              <img src={session.buktiData} alt={session.buktiNama || "Bukti absensi"} className="h-12 w-12 rounded-md object-cover" />
              Lihat bukti {session.buktiNama || "absensi"}
            </a>
          )}
          {mapsUrl(session.startLocation) ? (
            <a href={mapsUrl(session.startLocation) || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5">
              <MapPin className="h-3.5 w-3.5" /> Lokasi Mulai di Google Maps
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">Lokasi mulai belum tersedia</span>
          )}
          {mapsUrl(session.endLocation) ? (
            <a
              href={mapsUrl(session.endLocation) || "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              <MapPin className="h-3.5 w-3.5" /> Lokasi Selesai di Google Maps
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">Lokasi selesai belum tersedia</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAbsensiPage() {
  const [query, setQuery] = React.useState("");
  const [sessions, setSessions] = React.useState<AdminAbsensiItem[]>([]);
  const [filterRole, setFilterRole] = React.useState<string | null>(null);
  const [filterFrom, setFilterFrom] = React.useState<string | null>(null);
  const [filterTo, setFilterTo] = React.useState<string | null>(null);

  const loadSessions = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterRole) params.set("role", filterRole);
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);
      const url = `/api/admin/absensi?${params.toString()}`;
      const result = await apiFetch<{ ok: boolean; data: AdminAbsensiItem[] }>(url, { cache: "no-store" });
      setSessions(result.data || []);
    } catch {
      setSessions([]);
    }
  }, [filterRole, filterFrom, filterTo]);

  React.useEffect(() => {
    void loadSessions();
  }, [loadSessions]);
  useVisiblePolling(loadSessions, 20000);

  const exportCsv = () => {
    const params = new URLSearchParams();
    if (filterRole) params.set("role", filterRole);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    window.open(`/api/admin/absensi/export?${params.toString()}`, "_blank");
  };

  const matches = (value: string) => value.toLowerCase().includes(query.toLowerCase());
  const pengajarSessions = sessions.filter((item) => item.actorRole === "PENGAJAR" && (matches(item.pengajar) || matches(item.nama)));
  const muridSessions = sessions.filter((item) => item.actorRole === "MURID" && (matches(item.murid) || matches(item.nama)));
  const allSessions = [...pengajarSessions, ...muridSessions];

  const renderSection = (title: string, data: AdminAbsensiItem[]) => (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold">Absensi {title}</h2>
        <Badge variant="secondary">{data.length} sesi</Badge>
      </div>
      <div className="grid gap-4">
        {data.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
        {data.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">Belum ada absensi yang cocok dengan pencarian.</CardContent>
          </Card>
        )}
      </div>
    </section>
  );

  return (
    <main className="space-y-7">
      <div className="print-hidden flex flex-wrap items-center gap-3">
        <label className="text-xs">Filter role:</label>
        <select value={filterRole ?? ""} onChange={(e) => setFilterRole(e.target.value || null)} className="rounded-lg border px-2 py-1">
          <option value="">Semua</option>
          <option value="PENGAJAR">Pengajar</option>
          <option value="MURID">Murid</option>
        </select>
        <label className="text-xs">Dari:</label>
        <input type="date" value={filterFrom ?? ""} onChange={(e) => setFilterFrom(e.target.value || null)} className="rounded-lg border px-2 py-1" />
        <label className="text-xs">Sampai:</label>
        <input type="date" value={filterTo ?? ""} onChange={(e) => setFilterTo(e.target.value || null)} className="rounded-lg border px-2 py-1" />
        <button className="ml-auto inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-xs" onClick={exportCsv}>
          <Printer className="h-4 w-4" /> Ekspor CSV
        </button>
        <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-xs" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Cetak / Simpan PDF
        </button>
      </div>
      <div>
        <p className="text-sm font-semibold text-primary">Monitoring operasional</p>
        <h1 className="mt-1 font-heading text-3xl font-extrabold">Monitoring Absensi</h1>
        <p className="mt-2 text-muted-foreground">Absensi pengajar dan murid disinkronkan langsung dari jadwal dan data kehadiran di database.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total sesi</p>
            <p className="mt-2 font-heading text-3xl font-bold">{allSessions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Hadir</p>
            <p className="mt-2 font-heading text-3xl font-bold text-accent">{allSessions.filter((item) => item.status === "HADIR").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Terlambat</p>
            <p className="mt-2 font-heading text-3xl font-bold text-warning">{allSessions.filter((item) => item.status === "TERLAMBAT").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Izin</p>
            <p className="mt-2 font-heading text-3xl font-bold">{allSessions.filter((item) => item.status === "IZIN").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Sakit</p>
            <p className="mt-2 font-heading text-3xl font-bold text-destructive">{allSessions.filter((item) => item.status === "SAKIT").length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Cari nama pengajar atau murid..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </CardContent>
      </Card>

      {renderSection("Pengajar", pengajarSessions)}
      {renderSection("Murid", muridSessions)}
    </main>
  );
}
