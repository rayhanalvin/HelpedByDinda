"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ArrowRight, BookOpen, Clock, Users, Laptop, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

type ProgramRow = {
  id: string;
  category: string;
  title: string;
  target: string;
  price: number;
  description: string;
  subjects: string[];
  facilities: string[];
  popular: boolean;
};

export default function ProgramPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [programs, setPrograms] = React.useState<ProgramRow[]>([]);
  const [portalContent, setPortalContent] = React.useState<{ judul: string; ringkasan: string | null; isi: string } | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("SEMUA");

  React.useEffect(() => {
    fetch("/api/programs")
      .then((response) => response.json())
      .then((result) => {
        if (result.ok) setPrograms((result.data || []) as ProgramRow[]);
      })
      .catch(() => undefined);
    fetch("/api/portal/program-belajar")
      .then((response) => response.json())
      .then((result) => setPortalContent(result.data || null))
      .catch(() => setPortalContent(null));
  }, []);

  const programCategories = Array.from(new Set(programs.map((program) => program.category)));
  const selectedCategory = programCategories.includes(activeTab) ? activeTab : "SEMUA";
  const visiblePrograms = selectedCategory === "SEMUA" ? programs : programs.filter((program) => program.category === selectedCategory);

  const selectProgram = async (program: ProgramRow) => {
    try {
      const response = await fetch("/api/murid/program", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ programId: program.id }) });
      if (response.ok) {
        toast(`Program ${program.category} berhasil dipilih. Paket murid telah diperbarui.`, "success");
        return;
      }
      if (response.status === 401) {
        router.push(`/register?program=${encodeURIComponent(program.id)}`);
        return;
      }
      const result = await response.json().catch(() => null);
      toast(result?.message || "Program belum dapat dipilih.", "error");
    } catch {
      router.push(`/register?program=${encodeURIComponent(program.id)}`);
    }
  };

  return (
    <div className="flex flex-col gap-12 pb-24">
      {/* Header hero */}
      <section className="relative overflow-hidden rounded-4xl bg-linear-to-br from-primary via-primary/90 to-purple-800 px-6 py-12 text-center text-white shadow-xl sm:px-12 sm:py-16 mt-6">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="container relative mx-auto max-w-4xl">
          <p className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" /> Katalog Program Resmi
          </p>
          <h1 className="mx-auto mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {portalContent?.judul || "Pilihan Program Belajar Sesuai Kebutuhanmu"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base whitespace-pre-line">
            {portalContent?.ringkasan ||
              "Semua program dilengkapi dengan akses portal murid digital: absensi kehadiran terverifikasi, video materi tanpa jeda iklan, dan pembayaran Midtrans praktis."}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm">
              <p className="text-2xl font-extrabold tabular-nums">{programs.length}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Program Tersedia</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm">
              <p className="text-2xl font-extrabold tabular-nums">{programCategories.length}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Jenjang Pendidikan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Filters */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-card p-2">
          {["SEMUA", ...programCategories].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer",
                activeTab === tab ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {tab === "SEMUA" ? "Semua Program" : `Tingkat ${tab}`}
            </button>
          ))}
        </div>
      </section>

      {/* Program Cards Grid */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {visiblePrograms.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
              Belum ada program yang dipublikasikan untuk kategori ini.
            </div>
          )}
          {visiblePrograms.map((program) => (
            <div
              key={program.id}
              className={cn(
                "relative flex flex-col justify-between rounded-3xl border bg-card p-6 transition-all hover:shadow-lg sm:p-8",
                program.popular ? "border-primary/50 shadow-sm" : "border-border"
              )}
            >
              {program.popular && (
                <div className="absolute -top-3 right-6">
                  <Badge variant="default" className="bg-primary text-white">
                    <Sparkles className="mr-1 h-3.5 w-3.5" /> Rekomendasi
                  </Badge>
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary" className="font-bold">
                    {program.category}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground">{program.target}</span>
                </div>

                <h3 className="text-2xl font-bold text-foreground">{program.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{program.description}</p>

                <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4">
                  <span className="block text-xs font-medium text-muted-foreground">Investasi Belajar:</span>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold tabular-nums text-foreground">{formatRupiah(program.price)}</span>
                    <span className="text-xs font-medium text-muted-foreground">/ bulan</span>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground">Mata Pelajaran:</p>
                  <div className="flex flex-wrap gap-2">
                    {program.subjects.map((s) => (
                      <span key={s} className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground">Fasilitas Termasuk:</p>
                  <ul className="space-y-2">
                    {program.facilities.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-xs text-muted-foreground sm:text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
                <Button variant="accent" className="flex-1 justify-center gap-1.5 font-bold" onClick={() => selectProgram(program)}>
                  Daftar Program Ini
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Link href="/kontak">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Tanya Dulu
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Info Garansi & Metode Pembelajaran */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-muted/40 p-8 text-center">
          <Badge variant="default">Metode Fleksibel</Badge>
          <h3 className="text-2xl font-bold text-foreground">Pilih Mode Belajar Sesuai Kenyamananmu</h3>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {portalContent?.isi ||
              "Kami menyediakan kelas Online (via Google Meet / Zoom dengan rekaman video Bunny CDN) dan kelas Offline di ruang belajar nyaman ber-AC di cabang kami."}
          </p>
        </div>
      </section>
    </div>
  );
}