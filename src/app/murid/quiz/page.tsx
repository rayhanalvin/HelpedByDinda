"use client";

import * as React from "react";
import { CheckCircle2, ClipboardCheck, Lightbulb, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";

type QuizQuestion = { id: string; pertanyaan: string; opsi: string[]; jawabanBenar: number; pembahasan: string };
type Quiz = { id: string; judul: string; deskripsi: string; mataPelajaran: string; kelas: string; durasiMenit: number; questions: QuizQuestion[]; schedule: { tanggal: string; jamMulai: string; jamSelesai: string; status: string } };

export default function MuridQuizPage() {
  const { toast } = useToast();
  const [selectedQuiz, setSelectedQuiz] = React.useState<Quiz | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [score, setScore] = React.useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = React.useState(0);
  const [quizzes, setQuizzes] = React.useState<Quiz[]>([]);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const result = await apiFetch<{ ok: boolean; data: Quiz[] }>("/api/quiz");
        if (mounted) setQuizzes(result.data || []);
      } catch (error) {
        if (mounted) toast(error instanceof Error ? error.message : "Quiz tidak dapat diakses.", "error");
      }
    };
    void load();
    const interval = setInterval(load, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [toast]);

  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setAnswers({});
    setScore(null);
    setRemainingSeconds(quiz.durasiMenit * 60);
  };
  const submitQuiz = (force = false) => {
    if (!selectedQuiz || (!force && Object.keys(answers).length !== selectedQuiz.questions.length)) return;
    const correct = selectedQuiz.questions.filter((question) => answers[question.id] === question.jawabanBenar).length;
    setScore(Math.round((correct / selectedQuiz.questions.length) * 100));
  };

  React.useEffect(() => {
    if (!selectedQuiz || score !== null || remainingSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [selectedQuiz, score, remainingSeconds]);

  React.useEffect(() => {
    if (selectedQuiz && score === null && remainingSeconds === 0) {
      const correct = selectedQuiz.questions.filter((question) => answers[question.id] === question.jawabanBenar).length;
      setScore(Math.round((correct / selectedQuiz.questions.length) * 100));
    }
  }, [answers, remainingSeconds, selectedQuiz, score]);

  const formattedTime = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  if (selectedQuiz) {
    return (
      <main className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="secondary">
              {selectedQuiz.mataPelajaran} · {selectedQuiz.kelas}
            </Badge>
            <h1 className="mt-3 font-heading text-3xl font-extrabold">{selectedQuiz.judul}</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedQuiz.deskripsi} · {selectedQuiz.durasiMenit} menit
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={remainingSeconds <= 60 && score === null ? "destructive" : "warning"}>Sisa waktu {formattedTime}</Badge>
            <Button variant="ghost" onClick={() => setSelectedQuiz(null)}>
              Kembali ke daftar
            </Button>
          </div>
        </div>
        {score === null ? (
          <>
            <div className="space-y-4">
              {selectedQuiz.questions.map((question, index) => (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {index + 1}. {question.pertanyaan}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {question.opsi.map((option, optionIndex) => (
                      <label
                        key={option}
                        className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${answers[question.id] === optionIndex ? "border-primary bg-secondary text-primary" : "hover:border-primary/50"}`}
                      >
                        <input type="radio" name={`question-${question.id}`} checked={answers[question.id] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))} />
                        {option}
                      </label>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button variant="accent" size="lg" disabled={Object.keys(answers).length !== selectedQuiz.questions.length} onClick={() => submitQuiz()}>
              <CheckCircle2 size={18} /> Kumpulkan Jawaban
            </Button>
          </>
        ) : (
          <Card className="border-accent/30">
            <CardContent className="space-y-6 p-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Nilai kamu</p>
                <p className="mt-1 font-heading text-6xl font-extrabold text-accent">{score}</p>
                <p className="mt-2 font-semibold">{score >= 75 ? "Bagus, pemahamanmu sudah kuat!" : "Pelajari pembahasan lalu coba lagi."}</p>
              </div>
              <div className="space-y-3">
                <h2 className="font-heading text-lg font-bold">Pembahasan</h2>
                {selectedQuiz.questions.map((question, index) => (
                  <div key={question.id} className="rounded-xl border p-4">
                    <p className="font-semibold">
                      {index + 1}. {question.pertanyaan}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-accent">Jawaban benar:</span> {question.opsi[question.jawabanBenar]}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">Pembahasan:</span> {question.pembahasan}
                    </p>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={() => startQuiz(selectedQuiz)}>
                <RotateCcw size={16} /> Kerjakan Lagi
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Latihan mandiri</p>
        <h1 className="mt-1 font-heading text-3xl font-extrabold">Quiz & Latihan</h1>
        <p className="mt-2 text-muted-foreground">Kerjakan quiz, lihat nilai, dan pahami pembahasannya.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {quizzes.map((quiz) => (
          <Card key={quiz.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                  <ClipboardCheck size={20} />
                </div>
                <Badge variant="success">{quiz.questions.length} soal</Badge>
              </div>
              <h2 className="mt-5 font-heading text-lg font-bold">{quiz.judul}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{quiz.deskripsi}</p>
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{quiz.mataPelajaran}</span>
                <span>•</span>
                <span>
                  {quiz.durasiMenit} menit · Jadwal {new Date(quiz.schedule.tanggal).toLocaleDateString("id-ID")}
                </span>
              </div>
              <Button className="mt-5 w-full" variant="accent" onClick={() => startQuiz(quiz)}>
                <Lightbulb size={16} /> Mulai Quiz
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
