"use client";

import * as React from "react";
import { Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle2, XCircle, CalendarCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type FreeSlot = { start: string; end: string; mode: string; ruangan: string | null };

type AvailabilityResponse = {
  ok: boolean;
  data: {
    pengajar: { id: string; name: string; avatarUrl: string | null; spesialisasi: string };
    dates: { key: string; label: string; day: string }[];
    availableDates: string[];
    ranges: { start: string; end: string; mode: string; ruangan: string | null; ruleId: string }[];
    booked: { jamMulai: string; jamSelesai: string; mataPelajaran: string }[];
    bookedTotal: number;
  };
};

export function JadwalTersediaPicker({ pengajarId, pengajarNama }: { pengajarId: string; pengajarNama: string }) {
  const [loading, setLoading] = React.useState(true);
  const [fetchingSlots, setFetchingSlots] = React.useState(false);
  const [error, setError] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<string>("");
  const [dates, setDates] = React.useState<{ key: string; label: string; day: string }[]>([]);
  const [availableDates, setAvailableDates] = React.useState<string[]>([]);
  const [ranges, setRanges] = React.useState<{ start: string; end: string; mode: string; ruangan: string | null; ruleId: string }[]>([]);
  const [booked, setBooked] = React.useState<{ jamMulai: string; jamSelesai: string; mataPelajaran: string }[]>([]);
  const [slots, setSlots] = React.useState<FreeSlot[]>([]);

  const loadWeek = React.useCallback(
    async (dateKey?: string) => {
      try {
        setLoading(true);
        setError("");
        const query = new URLSearchParams({ pengajarId });
        if (dateKey) query.set("date", dateKey);
        const response = await fetch(`/api/public/pengajar-availability?${query.toString()}`, { cache: "no-store" });
        const json = (await response.json()) as AvailabilityResponse;
        if (!json.ok) throw new Error("Data jadwal tidak dapat memuat.");
        setDates(json.data.dates);
        setAvailableDates(json.data.availableDates);
        setRanges(json.data.ranges);
        setBooked(json.data.booked);
        if (!selectedDate && json.data.dates.length) {
          const firstAvailable = json.data.dates.find((d) => json.data.availableDates.includes(d.key)) || json.data.dates[0];
          setSelectedDate(firstAvailable.key);
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Gagal memuat jadwal tersedia.");
      } finally {
        setLoading(false);
      }
    },
    [pengajarId],
  );

  React.useEffect(() => {
    void loadWeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadWeek]);

  const loadSlotsForDate = React.useCallback(
    async (dateKey: string) => {
      setFetchingSlots(true);
      setSlots([]);
      try {
        const query = new URLSearchParams({ pengajarId, date: dateKey });
        const response = await fetch(`/api/public/pengajar-availability?${query.toString()}`, { cache: "no-store" });
        const json = (await response.json()) as AvailabilityResponse;
        const freeRanges = json.ok ? json.data.ranges : [];
        setRanges(freeRanges);
        const generated: FreeSlot[] = [];
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
        setSlots(generated);
        setBooked(json.ok ? json.data.booked : []);
      } finally {
        setFetchingSlots(false);
      }
    },
    [pengajarId],
  );

  React.useEffect(() => {
    if (selectedDate) void loadSlotsForDate(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, loadSlotsForDate]);

  const rotateWeek = (direction: number) => {
    const base = new Date(`${dates[0]?.key || "2026-01-01"}T00:00:00Z`);
    base.setDate(base.getDate() + 7 * direction);
    setSelectedDate("");
    void loadWeek(base.toISOString().slice(0, 10));
  };

  if (loading && !dates.length) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat jadwal tersedia {pengajarNama}...
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4" /> Jadwal Tersedia — {pengajarNama}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => rotateWeek(-1)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" aria-label="Minggu sebelumnya">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => rotateWeek(1)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" aria-label="Minggu berikut">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Date strip (Halodoc style) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {dates.map((date) => {
            const isAvailable = availableDates.includes(date.key);
            const isSelected = selectedDate === date.key;
            return (
              <button
                key={date.key}
                type="button"
                disabled={!isAvailable}
                onClick={() => setSelectedDate(date.key)}
                className={`flex flex-col items-center min-w-16 rounded-xl px-2.5 py-2 text-center transition-all ${
                  isSelected ? "bg-primary text-white shadow-sm" : isAvailable ? "bg-card text-foreground border border-primary/30 hover:bg-primary/10" : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                }`}
              >
                <span className="text-[10px] uppercase font-bold">{date.label.split(",")[0].trim()}</span>
                <span className="text-base font-extrabold">{date.label.match(/\d+/)?.[0] || ""}</span>
                <span className="text-[9px]">{isAvailable ? "Tersedia" : "Kosong"}</span>
              </button>
            );
          })}
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>

      {/* Slot selector */}
      <div>
        {fetchingSlots ? (
          <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Mencari slot...
          </div>
        ) : (
          <div className="space-y-1.5">
            {slots.length ? (
              <div className="flex flex-wrap gap-1.5">
                {slots.map((slot) => (
                  <span key={`${slot.start}-${slot.end}`} className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-secondary/30 px-2.5 py-1.5 text-xs font-semibold text-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    {slot.start} – {slot.end}
                    <Badge variant={slot.mode === "ONLINE" ? "default" : "secondary"} className="text-[9px] px-1.5">
                      {slot.mode}
                    </Badge>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-rose-500" /> Tidak ada slot tersedia pada tanggal ini.
              </p>
            )}
            {booked.length > 0 && (
              <div className="mt-2 flex flex-col gap-1 text-[11px] text-muted-foreground">
                <span className="font-bold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Sesi sudah terisi pada tanggal ini:
                </span>
                {booked.map((b) => (
                  <span key={`${b.jamMulai}-${b.jamSelesai}`} className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {b.jamMulai} – {b.jamSelesai} · {b.mataPelajaran}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Tersedia · <CheckCircle2 className="h-3 w-3 text-amber-500" /> Terisi · <XCircle className="h-3 w-3 text-muted-foreground" /> Tidak tersedia
      </p>
    </div>
  );
}