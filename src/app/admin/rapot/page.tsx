"use client";

import * as React from "react";
import { ClipboardList, MessageSquareHeart, Star, Users, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type RapotRow = { id: string; periode: string; nilaiQuiz: number; kehadiran: number; nilaiSekolah: number; keaktifan: number; nilaiAkhir: number; deskripsi: string; status: string; murid: { user: { name: string } }; pengajar: { user: { name: string } } };
type AssessmentRow = { id: string; periode: string; rating: number; pemahamanMateri: number; komunikasi: number; ketepatanWaktu: number; deskripsi: string; status: string; murid: { user: { name: string } }; pengajar: { user: { name: string } } };

export default function AdminRapotPage() {
  const { toast } = useToast();
  const [rapot, setRapot] = React.useState<RapotRow[]>([]);
  const [assessments, setAssessments] = React.useState<AssessmentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(async () => {
    try {
      const result = await apiFetch<{ ok: boolean; data: { rapot: RapotRow[]; assessments: AssessmentRow[] } }>("/api/rapot", { cache: "no-store" });
      setRapot(result.data.rapot || []);
      setAssessments(result.data.assessments || []);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memuat rapot dan asesmen.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);
  React.useEffect(() => { void load(); }, [load]);
  useVisiblePolling(load, 30000);
  const averageScore = rapot.length ? Math.round(rapot.reduce((sum, item) => sum + item.nilaiAkhir, 0) / rapot.length) : 0;
  const averageRating = assessments.length ? (assessments.reduce((sum, item) => sum + item.rating, 0) / assessments.length).toFixed(1) : "0.0";
  const deleteRapot = async (id: string) => {
    if (!window.confirm("Hapus rapot ini? Murid dan pengajar tidak akan dapat melihatnya lagi.")) return;
    try {
      await apiFetch("/api/rapot", { method: "DELETE", body: JSON.stringify({ id }) });
      setRapot((current) => current.filter((item) => item.id !== id));
      toast("Rapot berhasil dihapus.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menghapus rapot.", "error");
    }
  };
  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Kontrol kualitas akademik</p>
        <h1 className="mt-1 font-heading text-3xl font-extrabold">Monitoring Rapot & Asesmen</h1>
        <p className="mt-2 text-muted-foreground">Pantau perkembangan murid dan kualitas pengajar dari penilaian yang terkumpul.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rapot diterbitkan</p>
                <p className="mt-2 font-heading text-3xl font-bold">{rapot.length}</p>
              </div>
              <ClipboardList className="text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata nilai murid</p>
                <p className="mt-2 font-heading text-3xl font-bold text-accent">{averageScore}</p>
              </div>
              <Users className="text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rating pengajar</p>
                <p className="mt-2 font-heading text-3xl font-bold text-amber-500">{averageRating} / 5</p>
              </div>
              <Star className="fill-amber-400 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>
      <section>
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList size={19} className="text-primary" />
          <h2 className="font-heading text-xl font-bold">Rapot Perkembangan Murid</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {rapot.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading font-bold">{item.murid.user.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.periode} · Pengajar {item.pengajar.user.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.status === "TERBIT" ? "success" : "warning"}>{item.status}</Badge>
                    <Button size="icon" variant="ghost" aria-label="Hapus rapot" onClick={() => void deleteRapot(item.id)}><Trash2 size={15} /></Button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-secondary p-2">
                    <b className="block text-lg text-primary">{item.nilaiQuiz}</b>Quiz
                  </div>
                  <div className="rounded-lg bg-secondary p-2">
                    <b className="block text-lg text-primary">{item.kehadiran}%</b>Hadir
                  </div>
                  <div className="rounded-lg bg-secondary p-2">
                    <b className="block text-lg text-primary">{item.nilaiSekolah}</b>Sekolah
                  </div>
                  <div className="rounded-lg bg-secondary p-2">
                    <b className="block text-lg text-primary">{item.keaktifan}</b>Aktif
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{item.deskripsi}</p>
              </CardContent>
            </Card>
          ))}
          {!loading && rapot.length === 0 && <p className="text-sm text-muted-foreground">Belum ada rapot yang diterbitkan pengajar.</p>}
        </div>
      </section>
      <section>
        <div className="mb-3 flex items-center gap-2">
          <MessageSquareHeart size={19} className="text-primary" />
          <h2 className="font-heading text-xl font-bold">Asesmen Murid untuk Pengajar</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {assessments.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading font-bold">{item.pengajar.user.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Dinilai oleh {item.murid.user.name} · {item.periode}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={16} fill="currentColor" /> {item.rating}/5
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">Materi {item.pemahamanMateri}/5</Badge>
                  <Badge variant="secondary">Komunikasi {item.komunikasi}/5</Badge>
                  <Badge variant="secondary">Waktu {item.ketepatanWaktu}/5</Badge>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.deskripsi}</p>
                <Badge className="mt-4" variant={item.status === "DITINJAU" ? "success" : "warning"}>
                  {item.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
          {!loading && assessments.length === 0 && <p className="text-sm text-muted-foreground">Belum ada asesmen pengajar dari murid.</p>}
        </div>
      </section>
    </main>
  );
}
