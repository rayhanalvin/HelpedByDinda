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
    <div className="flex flex-col gap-12 py-12 pb-24">
      {/* Header */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 text-center">
        <Badge variant="default" className="mb-3">
          Katalog Program Resmi
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">{portalContent?.judul || "Pilihan Program Belajar Sesuai Kebutuhanmu"}</h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed whitespace-pre-line">
          {portalContent?.ringkasan || "Semua program dilengkapi dengan akses portal murid digital: absensi kehadiran terverifikasi, video materi tanpa jeda iklan, dan pembayaran Midtrans praktis."}
        </p>

        {/* Tab Filters */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {["SEMUA", ...programCategories].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn("rounded-xl px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer", activeTab === tab ? "bg-primary text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-border")}
            >
              {tab === "SEMUA" ? "Semua Program" : `Tingkat ${tab}`}
            </button>
          ))}
        </div>
      </section>

      {/* Program Cards Grid */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {visiblePrograms.map((program) => (
            <div key={program.id} className={cn("rounded-3xl border bg-card p-6 sm:p-8 flex flex-col justify-between transition-all hover:shadow-lg relative", program.popular ? "border-primary/50 shadow-sm" : "border-border")}>
              {program.popular && (
                <div className="absolute -top-3 right-6">
                  <Badge variant="default" className="bg-primary text-white">
                    <Sparkles className="h-3.5 w-3.5 mr-1" /> Rekomendasi
                  </Badge>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="font-bold">
                    {program.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">{program.target}</span>
                </div>

                <h3 className="text-2xl font-bold text-foreground">{program.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{program.description}</p>

                {/* Price */}
                <div className="mt-6 p-4 rounded-2xl bg-secondary/40 border border-border">
                  <span className="text-xs text-muted-foreground block font-medium">Investasi Belajar:</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-extrabold text-foreground tabular-nums">{formatRupiah(program.price)}</span>
                    <span className="text-xs text-muted-foreground font-medium">/ bulan</span>
                  </div>
                </div>

                {/* Mapel */}
                <div className="mt-6">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Mata Pelajaran:</p>
                  <div className="flex flex-wrap gap-2">
                    {program.subjects.map((s) => (
                      <span key={s} className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                        {s}
                      </span>
                    ))}
                    {visiblePrograms.length === 0 && <p className="col-span-full py-12 text-center text-sm text-muted-foreground">Belum ada program yang dipublikasikan untuk kategori ini.</p>}
                  </div>
                </div>

                {/* Fasilitas */}
                <div className="mt-6">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Fasilitas Termasuk:</p>
                  <ul className="space-y-2">
                    {program.facilities.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action */}
              <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row gap-3">
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
        <div className="rounded-3xl border border-border bg-muted/40 p-8 text-center flex flex-col items-center gap-4">
          <Badge variant="default">Metode Fleksibel</Badge>
          <h3 className="text-2xl font-bold text-foreground">Pilih Mode Belajar Sesuai Kenyamananmu</h3>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed whitespace-pre-line">
            {portalContent?.isi || "Kami menyediakan kelas Online (via Google Meet / Zoom dengan rekaman video Bunny CDN) dan kelas Offline di ruang belajar nyaman ber-AC di cabang kami."}
          </p>
        </div>
      </section>
    </div>
  );
}
