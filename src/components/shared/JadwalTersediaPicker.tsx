"use client";

import * as React from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, Loader2, Clock, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type FreeSlot = { start: string; end: string; mode: string; ruangan: string | null };

type AvailabilityResponse = {
  ok: boolean;
  data: {
    pengajar: { id: string; name: string; avatarUrl: string | null; spesialisasi: string };
    month: { key: string; label: string; year: number; month: number };
    cells: { key: string; iso: string; inMonth: boolean }[];
    statusByDate: Record<string, "green" | "red" | "gray">;
    availableDates: string[];
    fullyBookedDates: string[];
    targetDate: string;
    today: string;
    bookedTotal: number;
    ranges: { start: string; end: string; mode: string; ruangan: string | null; ruleId: string }[];
    booked: { jamMulai: string; jamSelesai: string; mataPelajaran: string }[];
  };
};

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateIndoShort(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

export function JadwalTersediaPicker({ pengajarId, pengajarNama }: { pengajarId: string; pengajarNama: string }) {
  const [loading, setLoading] = React.useState(true);
  const [fetchingSlots, setFetchingSlots] = React.useState(false);
  const [error, setError] = React.useState("");
  const [monthKey, setMonthKey] = React.useState(() => monthKeyOf(new Date()));
  const [monthLabel, setMonthLabel] = React.useState("");
  const [cells, setCells] = React.useState<{ key: string; iso: string; inMonth: boolean }[]>([]);
  const [statusByDate, setStatusByDate] = React.useState<Record<string, "green" | "red" | "gray">>({});
  const [selectedDate, setSelectedDate] = React.useState<string>("");
  const [ranges, setRanges] = React.useState<{ start: string; end: string; mode: string; ruangan: string | null; ruleId: string }[]>([]);
  const [booked, setBooked] = React.useState<{ jamMulai: string; jamSelesai: string; mataPelajaran: string }[]>([]);
  const [slots, setSlots] = React.useState<FreeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<FreeSlot | null>(null);
  const didInit = React.useRef(false);

  const loadMonth = React.useCallback(
    async (key: string, keepSelection = false) => {
      try {
        setLoading(true);
        setError("");
        const query = new URLSearchParams({ pengajarId, month: key });
        if (keepSelection && selectedDate) query.set("date", selectedDate);
        const response = await fetch(`/api/public/pengajar-availability?${query.toString()}`, { cache: "no-store" });
        const json = (await response.json()) as AvailabilityResponse;
        if (!json.ok) throw new Error("Data jadwal tidak dapat dimuat.");
        setMonthKey(json.data.month.key);
        setMonthLabel(json.data.month.label);
        setCells(json.data.cells);
        setStatusByDate(json.data.statusByDate || {});
        if (!keepSelection) {
          setSelectedSlot(null);
          const today = json.data.today;
          const candidates = Object.keys(json.data.statusByDate || {}).sort();
          const firstAvailable =
            candidates.find((keyItem) => keyItem >= today && json.data.statusByDate[keyItem] === "green") ||
            candidates.find((keyItem) => json.data.statusByDate[keyItem] === "green") ||
            candidates.find((keyItem) => json.data.statusByDate[keyItem] !== "gray") ||
            "";
          setSelectedDate(firstAvailable);
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Gagal memuat jadwal tersedia.");
      } finally {
        setLoading(false);
      }
    },
    [pengajarId, selectedDate],
  );

  React.useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    void loadMonth(monthKeyOf(new Date()));
  }, [loadMonth]);

  const loadSlotsForDate = React.useCallback(
    async (dateKeyItem: string) => {
      setFetchingSlots(true);
      setSlots([]);
      try {
        const query = new URLSearchParams({ pengajarId, date: dateKeyItem });
        const response = await fetch(`/api/public/pengajar-availability?${query.toString()}`, { cache: "no-store" });
        const json = (await response.json()) as AvailabilityResponse;
        const freeRanges = json.ok ? json.data.ranges : [];
        setRanges(freeRanges);
        setSelectedSlot(null);
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
  }, [selectedDate, loadSlotsForDate]);

  const rotateMonth = (direction: number) => {
    const [year, month] = monthKey.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1 + direction, 1));
    void loadMonth(monthKeyOf(next));
  };

  const goToday = () => void loadMonth(monthKeyOf(new Date()));
  useVisiblePolling(() => loadMonth(monthKey, true), 45000);

  const statusOf = (key: string): "green" | "red" | "gray" => statusByDate[key] || "gray";
  const todayKey = new Date().toISOString().slice(0, 10);

  if (loading && !cells.length) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat jadwal tersedia {pengajarNama}...
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4" /> Jadwal Tersedia — {pengajarNama}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => rotateMonth(-1)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" aria-label="Bulan sebelumnya">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-foreground min-w-32 text-center capitalize">{monthLabel}</span>
            <button type="button" onClick={() => rotateMonth(1)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" aria-label="Bulan berikutnya">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button type="button" onClick={goToday} className="mt-1 text-[10px] font-semibold text-primary hover:underline">
          Kembali ke bulan ini
        </button>

        <div className="mt-2 grid grid-cols-7 gap-1 text-center">
          {DAY_LABELS.map((label) => (
            <div key={label} className="text-[9px] font-bold uppercase text-muted-foreground py-1">
              {label}
            </div>
          ))}
          {cells.map((cell) => {
            if (!cell.inMonth) return <div key={cell.key} className="py-1.5" />;
            const status = statusOf(cell.key);
            const isToday = cell.key === todayKey;
            const isSelected = selectedDate === cell.key;
            const disabled = status === "gray";
            return (
              <button
                key={cell.key}
                type="button"
                disabled={disabled}
                onClick={() => setSelectedDate(cell.key)}
                aria-label={`${formatDateIndoShort(cell.key)} — ${status === "green" ? "Tersedia" : status === "red" ? "Terisi" : "Tidak tersedia"}`}
                className={`relative flex flex-col items-center justify-center rounded-lg py-1.5 text-[10px] font-semibold transition-all ${
                  status === "green"
                    ? "bg-emerald-500/90 text-white shadow-sm hover:bg-emerald-600"
                    : status === "red"
                      ? "bg-rose-500/90 text-white shadow-sm hover:bg-rose-600"
                      : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                } ${isSelected ? "ring-2 ring-primary ring-offset-1" : ""}`}
              >
                <span className="tabular-nums">{Number(cell.key.slice(8, 10))}</span>
                {isToday && <span className="absolute -top-1 -right-1 text-[8px] text-primary">●</span>}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Tersedia
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Terisi / Penuh
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-muted border border-border" /> Tidak tersedia
          </span>
        </div>
        {error && <p className="text-xs text-rose-600 mt-2">{error}</p>}
      </div>

      {/* Rincian tanggal terpilih */}
      <div className="rounded-2xl border border-border p-3">
        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          {selectedDate ? formatDateIndoShort(selectedDate) : "Pilih tanggal di kalender di atas"}
        </p>
        {fetchingSlots ? (
          <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Mencari jam tersedia...
          </div>
        ) : selectedDate ? (
          <div className="mt-2 space-y-1.5">
            {slots.length ? (
              <div className="flex flex-wrap gap-1.5">
                {slots.map((slot) => {
                  const isTaken = booked.some((b) => b.jamMulai === slot.start && b.jamSelesai === slot.end);
                  const isSelected = selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
                  return (
                    <button
                      key={`${slot.start}-${slot.end}`}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={isTaken}
                      onClick={() => setSelectedSlot(isSelected ? null : slot)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all shadow-sm ${
                        isSelected
                          ? "border-primary bg-primary text-white ring-2 ring-primary/30"
                          : isTaken
                            ? "border-muted bg-muted/40 text-muted-foreground cursor-not-allowed opacity-60"
                            : "border-emerald-500/30 bg-emerald-50 text-foreground hover:bg-emerald-100 hover:border-emerald-500"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {slot.start} – {slot.end}
                      {isTaken ? (
                        <Badge variant="secondary" className="text-[9px] px-1.5">
                          Terisi
                        </Badge>
                      ) : (
                        <Badge variant={slot.mode === "ONLINE" ? "default" : "secondary"} className="text-[9px] px-1.5">
                          {slot.mode === "ONLINE" ? "Online" : "Offline"}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-rose-500" /> {booked.length ? "Semua jam pada tanggal ini sudah terisi (Terisi)." : "Tidak ada jam tersedia pada tanggal ini."}
              </p>
            )}
            {selectedSlot && (
              <div className="mt-2 rounded-xl border border-emerald-300 bg-emerald-50 p-2.5 flex items-center gap-2 text-[11px] text-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Slot dipilih: <strong className="font-bold tabular-nums">{selectedSlot.start} – {selectedSlot.end}</strong> ({selectedSlot.mode === "ONLINE" ? "Online" : "Offline"})
                  {selectedSlot.ruangan ? ` · ${selectedSlot.ruangan}` : ""}
                </span>
              </div>
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
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Pilih salah satu tanggal hijau (tersedia) untuk melihat daftar jam yang dapat dipilih.</p>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Tersedia · <CheckCircle2 className="h-3 w-3 text-rose-500" /> Terisi · <XCircle className="h-3 w-3 text-muted-foreground" /> Tidak tersedia
      </p>
    </div>
  );
}