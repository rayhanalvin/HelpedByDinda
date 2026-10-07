"use client";

import * as React from "react";
import { BookOpenCheck, MessageSquareHeart, Printer, Star, TrendingUp, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type Teacher = { id: string; name: string; avatarUrl: string | null; spesialisasi: string };
type RapotRow = {
  id: string;
  periode: string;
  nilaiQuiz: number;
  kehadiran: number;
  nilaiSekolah: number;
  keaktifan: number;
  nilaiAkhir: number;
  deskripsi: string;
  rekomendasi: string;
  pengajar: { user: { name: string } };
};
type AssessmentRow = { id: string; pengajarId: string; periode: string; rating: number; pemahamanMateri: number; komunikasi: number; ketepatanWaktu: number; deskripsi: string };

export default function MuridRapotPage() {
  const { toast } = useToast();
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [rapot, setRapot] = React.useState<RapotRow[]>([]);
  const [assessments, setAssessments] = React.useState<AssessmentRow[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = React.useState("");
  const [period, setPeriod] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ rating: 5, pemahamanMateri: 5, komunikasi: 5, ketepatanWaktu: 5, deskripsi: "" });

  const load = React.useCallback(async () => {
    try {
      const result = await apiFetch<{ ok: boolean; data: { teachers: Teacher[]; rapot: RapotRow[]; assessments: AssessmentRow[]; period: string } }>("/api/rapot");
      setTeachers(result.data.teachers || []);
      setRapot(result.data.rapot || []);
      setAssessments(result.data.assessments || []);
      setPeriod(result.data.period || "");
      setSelectedTeacherId((current) => current || result.data.teachers?.[0]?.id || "");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memuat rapot dan pengajar.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void load();
  }, [load]);
  useVisiblePolling(load, 30000);

  const selectedTeacher = teachers.find((teacher) => teacher.id === selectedTeacherId) || null;
  const currentAssessment = assessments.find((assessment) => assessment.pengajarId === selectedTeacherId && assessment.periode === period);

  const submitAssessment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedTeacherId) return;
    setSaving(true);
    try {
      const result = await apiFetch<{ ok: boolean; data: AssessmentRow }>("/api/rapot", {
        method: "POST",
        body: JSON.stringify({ type: "ASESMEN", pengajarId: selectedTeacherId, periode: period, ...form }),
      });
      setAssessments((current) => [result.data, ...current.filter((assessment) => assessment.id !== result.data.id)]);
      toast("Penilaian pengajar berhasil dikirim.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mengirim penilaian.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main id="murid-rapot-report" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print-report-header">
        <div>
          <p className="text-sm font-semibold text-primary">Perkembangan belajar</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold">Rapot & Asesmen</h1>
          <p className="mt-2 text-muted-foreground">Lihat rapot yang diterbitkan pengajar dan berikan penilaian untuk tutor yang mengajar Anda.</p>
        </div>
        <Button variant="outline" className="print-hidden" onClick={() => window.print()}>
          <Printer size={16} /> Cetak / Simpan PDF
        </Button>
      </div>

      <section className="space-y-3 print-hidden">
        <h2 className="text-sm font-semibold">Pengajar dari jadwal Anda</h2>
        {teachers.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {teachers.map((teacher) => (
              <button
                key={teacher.id}
                type="button"
                onClick={() => setSelectedTeacherId(teacher.id)}
                className={`flex min-w-0 items-center gap-3 rounded-2xl border p-4 text-left transition ${selectedTeacherId === teacher.id ? "border-primary bg-secondary shadow-sm" : "bg-card hover:border-primary/50"}`}
              >
                {teacher.avatarUrl ? (
                  <img src={teacher.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <UserRound size={20} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <b className="block truncate font-heading">{teacher.name}</b>
                  <span className="text-xs text-muted-foreground">{teacher.spesialisasi}</span>
                </span>
                <Badge variant={selectedTeacherId === teacher.id ? "default" : "secondary"}>{selectedTeacherId === teacher.id ? "Dipilih" : "Pilih"}</Badge>
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{loading ? "Memuat pengajar..." : "Belum ada pengajar pada jadwal belajar Anda."}</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-bold">Rapot perkembangan</h2>
        {rapot.length ? (
          rapot.map((item) => (
            <Card key={item.id} className="border-primary/20">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Badge variant="secondary">{item.periode}</Badge>
                    <CardTitle className="mt-3">Pengajar: {item.pengajar.user.name}</CardTitle>
                  </div>
                  <div className="grid size-16 place-items-center rounded-2xl bg-secondary text-primary">
                    <span className="font-heading text-2xl font-extrabold">{item.nilaiAkhir}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Nilai Quiz", item.nilaiQuiz],
                    ["Kehadiran", `${item.kehadiran}%`],
                    ["Nilai Sekolah", item.nilaiSekolah],
                    ["Keaktifan", item.keaktifan],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-xl border p-4">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 font-heading text-2xl font-bold text-primary">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-secondary/60 p-4">
                    <p className="flex items-center gap-2 font-semibold">
                      <BookOpenCheck size={17} className="text-primary" /> Catatan Pengajar
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{item.deskripsi}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="flex items-center gap-2 font-semibold text-emerald-800">
                      <TrendingUp size={17} /> Rekomendasi
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-emerald-900/75">{item.rekomendasi}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">{loading ? "Memuat rapot..." : "Belum ada rapot yang diterbitkan untuk Anda."}</CardContent>
          </Card>
        )}
      </section>

      {selectedTeacher && (
        <Card className="print-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareHeart size={19} className="text-primary" /> Nilai Pengajar {selectedTeacher.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Penilaian periode {period} tersimpan untuk admin dan pengajar.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitAssessment} className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Rating keseluruhan</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button type="button" key={value} aria-label={`${value} bintang`} onClick={() => setForm({ ...form, rating: value })} className={value <= form.rating ? "text-amber-500" : "text-muted-foreground/30"}>
                      <Star size={25} fill="currentColor" />
                    </button>
                  ))}
                </div>
              </div>
              {[
                ["pemahamanMateri", "Pemahaman materi"],
                ["komunikasi", "Komunikasi"],
                ["ketepatanWaktu", "Ketepatan waktu"],
              ].map(([key, label]) => (
                <div key={key} className="grid gap-2">
                  <label className="text-sm font-semibold">{label}</label>
                  <select className="h-11 rounded-xl border bg-card px-3 text-sm" value={form[key as keyof typeof form]} onChange={(event) => setForm({ ...form, [key]: Number(event.target.value) })}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <option key={value} value={value}>
                        {value} / 5
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <Input required className="md:col-span-2" placeholder="Tulis deskripsi pengalaman belajar..." value={form.deskripsi} onChange={(event) => setForm({ ...form, deskripsi: event.target.value })} />
              <Button type="submit" variant="accent" isLoading={saving} className="md:col-span-2">
                <MessageSquareHeart size={16} /> {currentAssessment ? "Perbarui Asesmen" : "Kirim Asesmen"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
