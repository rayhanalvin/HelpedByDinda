"use client";

import * as React from "react";
import { MessageSquareHeart, Pencil, Printer, Save, Star, Trash2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateIndo } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type Student = { id: string; name: string; kelas: string; sekolah: string };
type RapotRow = {
  id: string;
  muridId: string;
  pengajarId: string;
  periode: string;
  nilaiQuiz: number;
  kehadiran: number;
  nilaiSekolah: number;
  keaktifan: number;
  nilaiAkhir: number;
  deskripsi: string;
  rekomendasi: string;
  status: string;
  updatedAt: string;
  murid: { user: { name: string } };
};
type AssessmentRow = { id: string; periode: string; rating: number; pemahamanMateri: number; komunikasi: number; ketepatanWaktu: number; deskripsi: string; status: string; createdAt: string; murid: { user: { name: string } } };
const initialForm = { muridId: "", periode: "", nilaiQuiz: 0, kehadiran: 0, nilaiSekolah: 0, keaktifan: 0, deskripsi: "", rekomendasi: "" };

export default function PengajarRapotPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<RapotRow[]>([]);
  const [assessments, setAssessments] = React.useState<AssessmentRow[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [form, setForm] = React.useState(initialForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [selectedMuridId, setSelectedMuridId] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const result = await apiFetch<{ ok: boolean; data: { rapot: RapotRow[]; assessments: AssessmentRow[]; students: Student[]; period: string } }>("/api/rapot");
      setItems(result.data.rapot || []);
      setAssessments(result.data.assessments || []);
      setStudents(result.data.students || []);
      setForm((current) => ({ ...current, muridId: current.muridId || result.data.students?.[0]?.id || "", periode: current.periode || result.data.period }));
      setSelectedMuridId((current) => current || result.data.students?.[0]?.id || "");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memuat rapot dan daftar murid.", "error");
    }
  }, [toast]);
  React.useEffect(() => {
    void load();
  }, [load]);
  useVisiblePolling(load, 30000);

  const teacherAssessments = assessments;
  const averageRating = teacherAssessments.length ? (teacherAssessments.reduce((sum, item) => sum + item.rating, 0) / teacherAssessments.length).toFixed(1) : "0.0";
  const reset = () => {
    setForm({ ...initialForm, muridId: selectedMuridId, periode: form.periode });
    setEditingId(null);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.deskripsi.trim() || !form.rekomendasi.trim()) return;
    try {
      const result = await apiFetch<{ ok: boolean; data: RapotRow }>("/api/rapot", { method: "POST", body: JSON.stringify({ type: "RAPOT", ...form }) });
      setItems((current) => [result.data, ...current.filter((item) => item.id !== result.data.id)]);
      toast(editingId ? "Rapot berhasil diperbarui." : "Rapot berhasil diterbitkan.", "success");
      reset();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan rapot.", "error");
    }
  };
  const edit = (item: RapotRow) => {
    setEditingId(item.id);
    setSelectedMuridId(item.muridId);
    setForm({ muridId: item.muridId, periode: item.periode, nilaiQuiz: item.nilaiQuiz, kehadiran: item.kehadiran, nilaiSekolah: item.nilaiSekolah, keaktifan: item.keaktifan, deskripsi: item.deskripsi, rekomendasi: item.rekomendasi });
  };
  const chooseMurid = (muridId: string) => {
    setSelectedMuridId(muridId);
    setForm((current) => ({ ...current, muridId }));
  };

  return (
    <main id="pengajar-rapot-report" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print-report-header">
        <div>
          <p className="text-sm font-semibold text-primary">Asesmen perkembangan</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold">Rapot & Penilaian Saya</h1>
          <p className="mt-2 text-muted-foreground">Buat rapot murid dan pantau penilaian yang diberikan murid kepada Anda.</p>
        </div>
        <Button variant="outline" className="print-hidden" onClick={() => window.print()}>
          <Printer size={16} /> Cetak / Simpan PDF
        </Button>
      </div>
      <Card className="border-primary/20">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
              <MessageSquareHeart size={22} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Penilaian murid untuk Anda</p>
              <p className="font-heading text-2xl font-extrabold text-amber-500">
                {averageRating} / 5 <span className="text-sm font-normal text-muted-foreground">({teacherAssessments.length} asesmen)</span>
              </p>
            </div>
          </div>
          <div className="flex gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((value) => (
              <Star key={value} size={18} fill={value <= Math.round(Number(averageRating)) ? "currentColor" : "none"} />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="print-hidden">
        <p className="mb-3 text-sm font-semibold">Pilih murid yang ingin dinilai</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {students.map((murid) => (
            <button
              type="button"
              key={murid.id}
              onClick={() => chooseMurid(murid.id)}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${selectedMuridId === murid.id ? "border-primary bg-secondary shadow-md" : "bg-card hover:border-primary/50"}`}
            >
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <UserRound size={20} />
              </span>
              <span>
                <b className="block font-heading">{murid.name}</b>
                <span className="text-xs text-muted-foreground">
                  {murid.kelas} · {murid.sekolah}
                </span>
              </span>
              <Badge className="ml-auto" variant={selectedMuridId === murid.id ? "default" : "secondary"}>
                {selectedMuridId === murid.id ? "Dipilih" : "Pilih"}
              </Badge>
            </button>
          ))}
          {students.length === 0 && <p className="text-sm text-muted-foreground">Belum ada murid yang terhubung melalui jadwal mengajar.</p>}
        </div>
      </div>
      <Card className="print-hidden">
        <CardHeader>
          <CardTitle>{editingId ? "Edit Rapot" : `Tambah Rapot untuk ${students.find((murid) => murid.id === selectedMuridId)?.name || "Murid"}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <Input required value={form.periode} placeholder="Periode rapot" onChange={(event) => setForm({ ...form, periode: event.target.value })} />
            {[
              ["nilaiQuiz", "Nilai quiz"],
              ["kehadiran", "Kehadiran (%)"],
              ["nilaiSekolah", "Nilai sekolah"],
              ["keaktifan", "Keaktifan diskusi"],
            ].map(([key, label]) => (
              <div key={key} className="grid gap-2">
                <label className="text-sm font-semibold">
                  {label}: {form[key as keyof typeof form]}
                </label>
                <Input type="number" min="0" max="100" value={form[key as keyof typeof form]} onChange={(event) => setForm({ ...form, [key]: Number(event.target.value) })} />
              </div>
            ))}
            <textarea
              required
              className="min-h-28 rounded-xl border bg-card p-3 text-sm md:col-span-2"
              placeholder="Deskripsi perkembangan murid"
              value={form.deskripsi}
              onChange={(event) => setForm({ ...form, deskripsi: event.target.value })}
            />
            <textarea
              required
              className="min-h-24 rounded-xl border bg-card p-3 text-sm md:col-span-2"
              placeholder="Rekomendasi belajar berikutnya"
              value={form.rekomendasi}
              onChange={(event) => setForm({ ...form, rekomendasi: event.target.value })}
            />
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" variant="accent" disabled={!form.muridId}>
                <Save size={16} /> {editingId ? "Simpan Perubahan" : "Terbitkan Rapot"}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={reset}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="secondary">{item.periode}</Badge>
                  <h2 className="mt-3 font-heading text-lg font-bold">{item.murid.user.name}</h2>
                  <p className="text-sm text-muted-foreground">Diperbarui {formatDateIndo(item.updatedAt)}</p>
                </div>
                <div className="grid size-14 place-items-center rounded-xl bg-secondary text-primary">
                  <span className="font-heading text-2xl font-extrabold">{item.nilaiAkhir}</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <span>
                  Quiz <b>{item.nilaiQuiz}</b>
                </span>
                <span>
                  Hadir <b>{item.kehadiran}%</b>
                </span>
                <span>
                  Sekolah <b>{item.nilaiSekolah}</b>
                </span>
                <span>
                  Aktif <b>{item.keaktifan}</b>
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{item.deskripsi}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                <b>Rekomendasi:</b> {item.rekomendasi}
              </p>
              <div className="mt-5 flex justify-end gap-2 border-t pt-4 print-hidden">
                <Button size="sm" variant="outline" onClick={() => edit(item)}>
                  <Pencil size={14} /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    if (!window.confirm(`Hapus rapot ${item.murid.user.name} periode ${item.periode}?`)) return;
                    try {
                      await apiFetch("/api/rapot", { method: "DELETE", body: JSON.stringify({ id: item.id }) });
                      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
                      toast("Rapot berhasil dihapus.", "info");
                    } catch (error) {
                      toast(error instanceof Error ? error.message : "Gagal menghapus rapot.", "error");
                    }
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <section>
        <div className="mb-3 flex items-center gap-2">
          <MessageSquareHeart size={19} className="text-primary" />
          <h2 className="font-heading text-xl font-bold">Penilaian dari Murid</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {teacherAssessments.length ? (
            teacherAssessments.map((assessment) => (
              <Card key={assessment.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading font-bold">{assessment.murid.user.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {assessment.periode} · {assessment.createdAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={16} fill="currentColor" /> {assessment.rating}/5
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="secondary">Materi {assessment.pemahamanMateri}/5</Badge>
                    <Badge variant="secondary">Komunikasi {assessment.komunikasi}/5</Badge>
                    <Badge variant="secondary">Waktu {assessment.ketepatanWaktu}/5</Badge>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{assessment.deskripsi}</p>
                  <Badge className="mt-4" variant={assessment.status === "DITINJAU" ? "success" : "warning"}>
                    {assessment.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">Belum ada penilaian murid yang masuk.</CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
