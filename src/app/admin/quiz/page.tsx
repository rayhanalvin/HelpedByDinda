"use client";

import * as React from "react";
import { ClipboardCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { KELAS_OPTIONS } from "@/lib/kelas";

type Question = { id: string; pertanyaan: string; opsi: string[]; jawabanBenar: number; pembahasan: string };
type Quiz = {
  id: string;
  judul: string;
  mataPelajaran: string;
  kelas: string;
  durasiMenit: number;
  deskripsi: string | null;
  questions: Question[];
  isPublished: boolean;
  jadwalId: string;
  schedule: { tanggal: string; jamMulai: string; jamSelesai: string; status: string };
  pengajarNama: string;
};
type Schedule = { id: string; tanggal: string; jamMulai: string; jamSelesai: string; mataPelajaran: string; muridNama: string; pengajar: string; status: string };

type QuizForm = {
  judul: string;
  mataPelajaran: string;
  kelasSasaran: string;
  jadwalId: string;
  durasiMenit: number;
  deskripsi: string;
  pertanyaan: string;
  opsiA: string;
  opsiB: string;
  opsiC: string;
  opsiD: string;
  jawabanBenar: number;
  pembahasan: string;
};
const initialForm: QuizForm = { judul: "", mataPelajaran: "Matematika", kelasSasaran: "SMA10", jadwalId: "", durasiMenit: 20, deskripsi: "", pertanyaan: "", opsiA: "", opsiB: "", opsiC: "", opsiD: "", jawabanBenar: 0, pembahasan: "" };

export default function AdminQuizPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Quiz[]>([]);
  const [schedules, setSchedules] = React.useState<Schedule[]>([]);
  const [form, setForm] = React.useState<QuizForm>(initialForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  React.useEffect(() => {
    Promise.all([apiFetch<{ ok: boolean; data: Quiz[] }>("/api/quiz"), apiFetch<{ ok: boolean; data: Schedule[] }>("/api/admin/jadwal")])
      .then(([quizResult, scheduleResult]) => {
        setItems(quizResult.data || []);
        setSchedules(scheduleResult.data || []);
      })
      .catch((error) => toast(error instanceof Error ? error.message : "Gagal memuat quiz dan jadwal.", "error"));
  }, [toast]);
  const update = <K extends keyof QuizForm>(key: K, value: QuizForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const reset = () => {
    setForm(initialForm);
    setEditingId(null);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const question = { id: crypto.randomUUID(), pertanyaan: form.pertanyaan, opsi: [form.opsiA, form.opsiB, form.opsiC, form.opsiD], jawabanBenar: form.jawabanBenar, pembahasan: form.pembahasan };
    try {
      const result = editingId
        ? await apiFetch<{ ok: boolean; data: Quiz }>(`/api/quiz/${editingId}`, {
            method: "PATCH",
            body: JSON.stringify({ judul: form.judul, mataPelajaran: form.mataPelajaran, kelas: form.kelasSasaran, durasiMenit: form.durasiMenit, deskripsi: form.deskripsi, questions: [question] }),
          })
        : await apiFetch<{ ok: boolean; data: Quiz }>("/api/quiz", {
            method: "POST",
            body: JSON.stringify({
              judul: form.judul,
              mataPelajaran: form.mataPelajaran,
              kelas: form.kelasSasaran,
              jadwalId: form.jadwalId,
              durasiMenit: form.durasiMenit,
              deskripsi: form.deskripsi,
              questions: [question],
              isPublished: true,
            }),
          });
      setItems((current) => (editingId ? current.map((item) => (item.id === editingId ? { ...item, ...result.data } : item)) : [result.data, ...current]));
      toast(editingId ? "Quiz berhasil diperbarui." : "Quiz berhasil ditambahkan ke jadwal.", "success");
      reset();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan quiz.", "error");
    }
  };
  const edit = (quiz: Quiz) => {
    const question = quiz.questions[0];
    setEditingId(quiz.id);
    setForm({
      judul: quiz.judul,
      mataPelajaran: quiz.mataPelajaran,
      kelasSasaran: quiz.kelas,
      jadwalId: quiz.jadwalId,
      durasiMenit: quiz.durasiMenit,
      deskripsi: quiz.deskripsi || "",
      pertanyaan: question.pertanyaan,
      opsiA: question.opsi[0],
      opsiB: question.opsi[1],
      opsiC: question.opsi[2],
      opsiD: question.opsi[3],
      jawabanBenar: question.jawabanBenar,
      pembahasan: question.pembahasan,
    });
  };
  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Administrasi akademik</p>
        <h1 className="mt-1 font-heading text-3xl font-extrabold">Kelola Quiz</h1>
        <p className="mt-2 text-muted-foreground">Kelola quiz, durasi, nilai latihan, dan pembahasan untuk murid.</p>
      </div>
      <Card>
        <CardContent className="p-5">
          <h2 className="font-heading text-lg font-bold">{editingId ? "Edit Quiz" : "Tambah Quiz Baru"}</h2>
          <form onSubmit={save} className="mt-4 grid gap-3 md:grid-cols-2">
            <Input required placeholder="Judul quiz" value={form.judul} onChange={(event) => update("judul", event.target.value)} />
            <Input required placeholder="Mata pelajaran" value={form.mataPelajaran} onChange={(event) => update("mataPelajaran", event.target.value)} />
            <select className="h-11 rounded-xl border bg-card px-3 text-sm" value={form.kelasSasaran} onChange={(event) => update("kelasSasaran", event.target.value)}>
              {KELAS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select required={!editingId} className="h-11 rounded-xl border bg-card px-3 text-sm md:col-span-2" value={form.jadwalId} onChange={(event) => update("jadwalId", event.target.value)} disabled={Boolean(editingId)}>
              <option value="">Pilih jadwal admin</option>
              {schedules
                .filter((schedule) => schedule.status !== "SELESAI")
                .map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.tanggal.slice(0, 10)} {schedule.jamMulai}-{schedule.jamSelesai} · {schedule.muridNama} · {schedule.pengajar}
                  </option>
                ))}
            </select>
            <Input required type="number" min="1" max="180" placeholder="Durasi dalam menit" value={form.durasiMenit} onChange={(event) => update("durasiMenit", Number(event.target.value))} />
            <Input placeholder="Deskripsi singkat" value={form.deskripsi} onChange={(event) => update("deskripsi", event.target.value)} />
            <textarea required className="min-h-24 rounded-xl border bg-card p-3 text-sm md:col-span-2" placeholder="Pertanyaan" value={form.pertanyaan} onChange={(event) => update("pertanyaan", event.target.value)} />
            {(["opsiA", "opsiB", "opsiC", "opsiD"] as const).map((key, index) => (
              <Input key={key} required placeholder={`Opsi ${String.fromCharCode(65 + index)}`} value={form[key]} onChange={(event) => update(key, event.target.value)} />
            ))}
            <select className="h-11 rounded-xl border bg-card px-3 text-sm" value={form.jawabanBenar} onChange={(event) => update("jawabanBenar", Number(event.target.value))}>
              <option value="0">Jawaban benar: A</option>
              <option value="1">Jawaban benar: B</option>
              <option value="2">Jawaban benar: C</option>
              <option value="3">Jawaban benar: D</option>
            </select>
            <Input required placeholder="Pembahasan jawaban" value={form.pembahasan} onChange={(event) => update("pembahasan", event.target.value)} />
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" variant="accent">
                <Plus size={16} /> {editingId ? "Simpan Perubahan" : "Tambah Quiz"}
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
      <div className="grid gap-3">
        {items.map((quiz) => (
          <Card key={quiz.id}>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                  <ClipboardCheck size={19} />
                </div>
                <div>
                  <p className="font-heading font-bold">{quiz.judul}</p>
                  <p className="text-sm text-muted-foreground">
                    {quiz.mataPelajaran} · {quiz.questions.length} soal · {quiz.durasiMenit} menit · {quiz.schedule?.tanggal.slice(0, 10)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={quiz.isPublished ? "success" : "warning"}>{quiz.isPublished ? "Terbit" : "Draft"}</Badge>
                <Button size="sm" variant="outline" onClick={() => edit(quiz)}>
                  <Pencil size={14} /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    void apiFetch(`/api/quiz/${quiz.id}`, { method: "DELETE" })
                      .then(() => {
                        setItems((current) => current.filter((item) => item.id !== quiz.id));
                        toast("Quiz berhasil dihapus.", "info");
                      })
                      .catch((error) => toast(error instanceof Error ? error.message : "Gagal menghapus quiz.", "error"));
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
