"use client";

import * as React from "react";
import { Calendar, Clock, MapPin, Video, Users, ChevronRight, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { formatDateIndo } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

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

export default function PengajarJadwalPage() {
  const { toast } = useToast();
  const [teachingSchedules, setTeachingSchedules] = React.useState<APIJadwal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"harian" | "mingguan">("mingguan");
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = React.useState<{ id: string; name: string; kelas: string }[]>([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ muridId: "", muridIds: [] as string[], kelompokNama: "", mataPelajaran: "", tanggal: new Date().toISOString().slice(0, 10), jamMulai: "16:00", jamSelesai: "17:30", mode: "ONLINE", ruangan: "", catatan: "" });
  const [editingGroup, setEditingGroup] = React.useState(false);

  const fetchTeachingSchedules = React.useCallback((silent = false) => {
    if (!silent) setLoading(true);
    apiFetch<{ ok: boolean; data: APIJadwal[] }>("/api/portal/jadwal")
      .then((res) => {
        if (res.ok) setTeachingSchedules(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!silent) setLoading(false);
        void silent;
      });
  }, []);

  React.useEffect(() => {
    fetchTeachingSchedules();

    apiFetch<{ ok: boolean; data: { id: string; name: string; kelas: string }[] }>("/api/pengajar/jadwal/options")
      .then((res) => res.ok && setStudents(res.data))
      .catch(() => undefined);
  }, [fetchTeachingSchedules]);

  const openAdd = () => {
    setEditingId(null);
    setEditingGroup(false);
    setForm({ muridId: students[0]?.id || "", muridIds: students[0]?.id ? [students[0].id] : [], kelompokNama: "", mataPelajaran: "", tanggal: selectedDate, jamMulai: "16:00", jamSelesai: "17:30", mode: "ONLINE", ruangan: "", catatan: "" });
    setModalOpen(true);
  };

  const openEdit = (schedule: APIJadwal) => {
    setEditingId(schedule.id);
    const group = schedule.kelompokId ? teachingSchedules.filter((item) => item.kelompokId === schedule.kelompokId) : [schedule];
    setEditingGroup(Boolean(schedule.kelompokId));
    setForm({
      muridId: schedule.muridId,
      muridIds: group.map((item) => item.muridId),
      kelompokNama: schedule.kelompokNama || "",
      mataPelajaran: schedule.mataPelajaran,
      tanggal: schedule.tanggal.slice(0, 10),
      jamMulai: schedule.jamMulai,
      jamSelesai: schedule.jamSelesai,
      mode: schedule.mode.toUpperCase(),
      ruangan: schedule.ruangan || "",
      catatan: schedule.catatan || "",
    });
    setModalOpen(true);
  };

  const saveSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiFetch(editingId ? `/api/pengajar/jadwal/${editingId}` : "/api/pengajar/jadwal", { method: editingId ? "PUT" : "POST", body: JSON.stringify({ ...form, muridId: form.muridIds[0] || form.muridId }) });
      setModalOpen(false);
      fetchTeachingSchedules();
      toast(editingId ? "Jadwal berhasil diperbarui." : "Jadwal baru berhasil dibuat.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Jadwal belum dapat disimpan.", "error");
    }
  };

  const deleteSchedule = async (id: string) => {
    const schedule = teachingSchedules.find((item) => item.id === id);
    const message = schedule?.kelompokId ? "Hapus seluruh sesi kelompok dan semua jadwal anggotanya?" : "Hapus jadwal ini? Murid dan admin akan melihat perubahan ini.";
    if (!window.confirm(message)) return;
    try {
      await apiFetch(`/api/pengajar/jadwal/${id}`, { method: "DELETE" });
      setTeachingSchedules((current) => current.filter((schedule) => schedule.id !== id));
      toast("Jadwal berhasil dihapus.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Jadwal belum dapat dihapus.", "error");
    }
  };

  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
  const visibleSchedules = teachingSchedules.filter((schedule) => (view === "harian" ? schedule.tanggal.slice(0, 10) === selectedDate : weekDates.includes(schedule.tanggal.slice(0, 10))));

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Jadwal Mengajar Saya</h1>
          <Badge variant="outline" className="text-[10px] gap-1 px-2.5 text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Tersimpan di sistem
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Atur sesi belajar dengan rapi. Setiap perubahan langsung terlihat oleh murid dan admin.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="accent" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Tambah Jadwal
        </Button>
        <Button variant={view === "harian" ? "default" : "outline"} onClick={() => setView("harian")}>
          Harian
        </Button>
        <Button variant={view === "mingguan" ? "default" : "outline"} onClick={() => setView("mingguan")}>
          Mingguan
        </Button>
        <input type="date" className="h-10 rounded-xl border bg-card px-3 text-sm" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Memuat jadwal mengajar...
        </div>
      ) : (
        <div className="space-y-4">
          {visibleSchedules.map((schedule) => (
            <Card key={schedule.id} className="border-border hover:border-primary/40 transition-all shadow-xs">
              <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={schedule.mode === "online" ? "default" : "secondary"}>{schedule.mode === "online" ? "KELAS ONLINE" : "TATAP MUKA OFFLINE"}</Badge>
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateIndo(schedule.tanggal)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground">{schedule.mataPelajaran}</h3>
                  {schedule.kelompokNama && <p className="text-xs font-semibold text-primary">Kelompok sesi: {schedule.kelompokNama}{schedule.kelompokMurid?.length ? ` · ${schedule.kelompokMurid.join(", ")}` : ""}</p>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary shrink-0" />
                      <span>
                        Murid: <strong className="text-foreground">{schedule.muridNama}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent shrink-0" />
                      <span>
                        Jam:{" "}
                        <strong className="text-foreground">
                          {schedule.jamMulai} – {schedule.jamSelesai} WIB
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {schedule.mode === "online" ? <Video className="h-4 w-4 text-purple-600 shrink-0" /> : <MapPin className="h-4 w-4 text-rose-600 shrink-0" />}
                      <span>
                        Ruang/Meet: <strong className="text-foreground">{schedule.ruangan || "—"}</strong>
                      </span>
                    </div>
                    {schedule.catatan && <div className="text-[11px] text-muted-foreground italic sm:col-span-2">Fokus: {schedule.catatan}</div>}
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-border">
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => openEdit(schedule)} aria-label="Edit jadwal">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteSchedule(schedule.id)} className="text-rose-600" aria-label="Hapus jadwal">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Link href="/pengajar/absen" className="w-full sm:w-auto">
                    <Button variant="accent" size="sm" className="w-full sm:w-auto font-bold gap-1 text-xs">
                      Absen Sesi Ini
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}

          {visibleSchedules.length === 0 && (
            <div className="text-center py-16 border border-dashed border-border rounded-3xl p-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-bold text-foreground">Belum ada sesi di periode ini</h3>
              <p className="text-xs text-muted-foreground mt-1">Pilih tanggal lain atau tambahkan jadwal baru untuk mulai mengatur minggu Anda.</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Perbarui Jadwal" : "Tambah Jadwal Belajar"} description="Jadwal ini akan langsung tersinkron ke murid dan admin.">
        <form onSubmit={saveSchedule} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Murid yang ikut sesi</p>
            <div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-border p-3 sm:grid-cols-2">
              {students.map((student) => (
                <label key={student.id} className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted">
                  <input type="checkbox" checked={form.muridIds.includes(student.id)} disabled={editingGroup} onChange={(event) => {
                    const muridIds = editingId ? [student.id] : event.target.checked ? [...form.muridIds, student.id] : form.muridIds.filter((id) => id !== student.id);
                    setForm({ ...form, muridIds, muridId: muridIds[0] || "" });
                  }} />
                  <span className="truncate">{student.name} · {student.kelas}</span>
                </label>
              ))}
              {students.length === 0 && <p className="text-xs text-muted-foreground">Belum ada murid aktif.</p>}
            </div>
            <p className="text-xs text-muted-foreground">Pilih beberapa murid saat membuat sesi kelompok. Reschedule kelompok lama berlaku untuk semua anggota; ubah anggota lewat admin.</p>
          </div>
          {form.muridIds.length > 1 && <input className="h-11 w-full rounded-xl border bg-card px-3 text-sm" placeholder="Nama kelompok (opsional)" value={form.kelompokNama} onChange={(event) => setForm({ ...form, kelompokNama: event.target.value })} />}
          <input required className="h-11 w-full rounded-xl border bg-card px-3 text-sm" placeholder="Mata pelajaran atau topik" value={form.mataPelajaran} onChange={(event) => setForm({ ...form, mataPelajaran: event.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <input required type="date" className="h-11 rounded-xl border bg-card px-3 text-sm" value={form.tanggal} onChange={(event) => setForm({ ...form, tanggal: event.target.value })} />
            <input required type="time" className="h-11 rounded-xl border bg-card px-3 text-sm" value={form.jamMulai} onChange={(event) => setForm({ ...form, jamMulai: event.target.value })} />
            <input required type="time" className="h-11 rounded-xl border bg-card px-3 text-sm" value={form.jamSelesai} onChange={(event) => setForm({ ...form, jamSelesai: event.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="h-11 rounded-xl border bg-card px-3 text-sm" value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value })}>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Tatap muka</option>
            </select>
            <input className="h-11 rounded-xl border bg-card px-3 text-sm" placeholder="Ruang atau link kelas" value={form.ruangan} onChange={(event) => setForm({ ...form, ruangan: event.target.value })} />
          </div>
          <textarea className="min-h-20 w-full rounded-xl border bg-card p-3 text-sm" placeholder="Catatan untuk murid (opsional)" value={form.catatan} onChange={(event) => setForm({ ...form, catatan: event.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="accent">
              Simpan Jadwal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
