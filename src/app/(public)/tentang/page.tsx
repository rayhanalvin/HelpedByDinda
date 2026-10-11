import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTentangSections, getTentangStatistik } from "@/lib/tentang-content";
import { RichContent } from "@/components/shared/RichContent";
import {
  Sparkles,
  Heart,
  Users,
  GraduationCap,
  BookOpen,
  Target,
  Lightbulb,
  HandHeart,
  Calendar,
  Star,
  Award,
  TrendingUp,
  School,
  CheckCircle2,
  ArrowRight,
  Eye,
  Quote,
  Camera,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATISTIK_IKON: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  Users,
  Heart,
  Sparkles,
  Target,
  BookOpen,
  School,
  Calendar,
  Star,
  Award,
  TrendingUp,
  CheckCircle2,
};

const KATEGORI_SEKSI: Record<string, { ikon: React.ComponentType<{ className?: string }>; warna: string; latar: string }> = {
  profil: { ikon: Heart, warna: "text-primary", latar: "bg-primary/10" },
  perjalanan: { ikon: Calendar, warna: "text-primary", latar: "bg-primary/10" },
  pencapaian: { ikon: Award, warna: "text-primary", latar: "bg-primary/10" },
  program: { ikon: BookOpen, warna: "text-primary", latar: "bg-primary/10" },
  pendekatan: { ikon: Lightbulb, warna: "text-primary", latar: "bg-primary/10" },
  tutor: { ikon: GraduationCap, warna: "text-primary", latar: "bg-primary/10" },
  visi: { ikon: Target, warna: "text-primary", latar: "bg-primary/10" },
  komitmen: { ikon: HandHeart, warna: "text-primary", latar: "bg-primary/10" },
};

function parseTimeline(isi: string) {
  const lines = isi.split(/\r?\n/);
  const items: { judul: string; deskripsi: string[] }[] = [];
  let current: { judul: string; deskripsi: string[] } | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("## ")) {
      if (current) items.push(current);
      current = { judul: trimmed.replace(/^##\s+/, ""), deskripsi: [] };
    } else {
      if (!current) current = { judul: "", deskripsi: [] };
      current.deskripsi.push(trimmed);
    }
  }
  if (current) items.push(current);
  return items;
}

function parseVisiMisi(isi: string) {
  const blocks: { judul: string; isi: string }[] = [];
  let current: { judul: string; isi: string } | null = null;
  for (const line of isi.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^(##|\*\*)\s*(Visi|Misi|Visi Kami|Misi Kami)\s*(\*\*)?$/i);
    if (match) {
      if (current) blocks.push(current);
      current = { judul: match[2], isi: "" };
    } else {
      if (!current) current = { judul: "Visi", isi: "" };
      current.isi += (current.isi ? "\n" : "") + line;
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

function MisiList({ content }: { content: string }) {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const bullets = lines.length > 0 && lines.every((line) => line.startsWith("- ") || line.startsWith("* "));
  if (bullets) {
    return (
      <ul className="space-y-3">
        {lines.map((line, index) => (
          <li key={index} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90 sm:text-base">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
            {line.replace(/^[-*]\s+/, "")}
          </li>
        ))}
      </ul>
    );
  }
  return <RichContent content={content} className="text-sm sm:text-base" />;
}

export default async function TentangPage() {
  const sections = await getTentangSections();
  const statistik = await getTentangStatistik();

  const profil = sections.find((s) => s.kategori === "profil");
  const perjalanan = sections.find((s) => s.kategori === "perjalanan");
  const pencapaian = sections.find((s) => s.kategori === "pencapaian");
  const program = sections.find((s) => s.kategori === "program");
  const pendekatan = sections.find((s) => s.kategori === "pendekatan");
  const tutor = sections.find((s) => s.kategori === "tutor");
  const visi = sections.find((s) => s.kategori === "visi");
  const komitmen = sections.find((s) => s.kategori === "komitmen");
  const lainnya = sections.filter((s) => !["profil", "perjalanan", "pencapaian", "program", "pendekatan", "tutor", "visi", "komitmen"].includes(s.kategori));

  const timeline = perjalanan ? parseTimeline(perjalanan.isi) : [];
  const fotoKegiatan = sections.filter((s) => s.imageUrl && s.kategori !== "pencapaian").slice(0, 6);
  const visiMisi = visi ? parseVisiMisi(visi.isi) : [];
  const blokVisi = visiMisi.find((b) => /visi/i.test(b.judul));
  const blokMisi = visiMisi.find((b) => /misi/i.test(b.judul));

  return (
    <div className="bg-background">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-linear-to-b from-primary/15 via-secondary/40 to-background">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-40 -left-32 size-96 rounded-full bg-accent/10 blur-3xl" aria-hidden />
        <div className="container relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <Badge variant="default" className="mx-auto mb-5 gap-1.5 px-4 py-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Tentang Kami
          </Badge>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {profil?.judul || "Tentang Helped by Dinda"}
          </h1>
          {profil?.ringkasan && (
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{profil.ringkasan}</p>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/program">
              <Button variant="default" className="gap-2 font-bold">
                Lihat Program Belajar <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/kontak">
              <Button variant="outline" className="gap-2 font-bold">
                Hubungi Kami
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== KARTU STATISTIK ===== */}
      {statistik.length > 0 && (
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="-mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {statistik.map((item, index) => {
              const Icon = STATISTIK_IKON[item.ikon] || GraduationCap;
              return (
                <div
                  key={item.id}
                  className="group rounded-3xl border border-border bg-card p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg sm:p-6 animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{item.nilai}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground sm:text-sm">{item.label}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ===== TENTANG / PROFIL ===== */}
      {profil && (
        <section className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-4 rounded-4xl bg-linear-to-br from-primary/20 via-accent/10 to-transparent blur-xl" aria-hidden />
              <div className="relative overflow-hidden rounded-4xl border border-border shadow-xl">
                <img
                  src={profil.imageUrl || "https://placehold.co/800x600/e9e5ff/7c3aed?text=Helped+by+Dinda"}
                  alt={profil.judul}
                  className="h-72 w-full object-cover transition-transform duration-700 hover:scale-105 sm:h-96"
                />
              </div>
              <div className="absolute -bottom-5 left-6 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-foreground">Belajar dengan Hangat</p>
                  <p className="text-xs text-muted-foreground">Pendampingan yang Peduli</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <Heart className="h-3.5 w-3.5" /> {profil.judul}
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{profil.judul}</h2>
              {profil.ringkasan && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{profil.ringkasan}</p>}
              <div className="mt-6">
                <RichContent content={profil.isi} className="text-sm sm:text-base" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== PERJALANAN KAMI (LINIMASA) ===== */}
      {perjalanan && timeline.length > 0 && (
        <section className="border-y border-border bg-secondary/30 py-16 sm:py-20">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <Calendar className="h-3.5 w-3.5" /> Perjalanan Kami
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{perjalanan.judul}</h2>
              {perjalanan.ringkasan && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{perjalanan.ringkasan}</p>}
            </div>

            <div className="relative mx-auto mt-12 max-w-3xl">
              <div className="absolute bottom-0 left-5 top-0 w-px bg-linear-to-b from-primary/40 via-primary/20 to-transparent sm:left-1/2" aria-hidden />
              <div className="space-y-8">
                {timeline.map((item, index) => {
                  const kiri = index % 2 === 0;
                  return (
                    <div key={`${item.judul}-${index}`} className={`relative flex pl-14 sm:w-1/2 sm:pl-0 ${kiri ? "sm:pr-12" : "sm:ml-auto sm:pl-12"}`}>
                      <div
                        className={`absolute left-5 top-1 grid size-10 -translate-x-1/2 place-items-center rounded-full border-2 border-primary/20 bg-card text-primary shadow-md ${kiri ? "sm:left-auto sm:right-0 sm:translate-x-1/2" : "sm:left-0 sm:-translate-x-1/2"}`}
                      >
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="w-full rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
                        {item.judul ? (
                          <p className="text-sm font-extrabold uppercase tracking-wider text-primary">{item.judul}</p>
                        ) : (
                          <p className="text-xs font-bold text-muted-foreground">Tonggak #{index + 1}</p>
                        )}
                        <div className="mt-2 space-y-2">
                          {item.deskripsi.map((paragraf, i) => (
                            <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                              {paragraf}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== PENCAPAIAN KAMI ===== */}
      {pencapaian && (
        <section className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Award className="h-3.5 w-3.5" /> Pencapaian Kami
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{pencapaian.judul}</h2>
            {pencapaian.ringkasan && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{pencapaian.ringkasan}</p>}
          </div>
          <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-border bg-linear-to-br from-primary/10 via-card to-accent/5 p-8 shadow-sm sm:p-10">
            <RichContent content={pencapaian.isi} className="text-sm sm:text-base" />
          </div>
        </section>
      )}

      {/* ===== PROGRAM PEMBELAJARAN ===== */}
      {program && (
        <section className="border-y border-border bg-secondary/30 py-16 sm:py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <BookOpen className="h-3.5 w-3.5" /> Program Pembelajaran
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{program.judul}</h2>
              {program.ringkasan && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{program.ringkasan}</p>}
            </div>

            <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="grid lg:grid-cols-5">
                {program.imageUrl && (
                  <div className="relative lg:col-span-2">
                    <img src={program.imageUrl} alt={program.judul} className="h-56 w-full object-cover lg:h-full" />
                    <div className="absolute inset-0 bg-linear-to-t from-primary/40 to-transparent" aria-hidden />
                  </div>
                )}
                <div className="p-6 sm:p-8 lg:col-span-3">
                  <RichContent content={program.isi} className="text-sm sm:text-base" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== PENDEKATAN PEMBELAJARAN ===== */}
      {pendekatan && (
        <section className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Lightbulb className="h-3.5 w-3.5" /> Pendekatan Pembelajaran
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{pendekatan.judul}</h2>
            {pendekatan.ringkasan && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{pendekatan.ringkasan}</p>}
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pendekatan.isi
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter(Boolean)
              .map((poin, index) => {
                const icons = [Lightbulb, Target, Sparkles, HandHeart];
                const Icon = icons[index % icons.length];
                return (
                  <div
                    key={`${poin}-${index}`}
                    className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold leading-relaxed text-foreground">{poin}</p>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* ===== TUTOR & PENDAMPINGAN ===== */}
      {tutor && (
        <section className="border-y border-border bg-secondary/30 py-16 sm:py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                  <GraduationCap className="h-3.5 w-3.5" /> Tutor dan Pendampingan Akademik
                </div>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{tutor.judul}</h2>
                {tutor.ringkasan && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{tutor.ringkasan}</p>}
                <div className="mt-6 flex flex-wrap gap-3">
                  {["Berpengalaman", "Ramah & Sabar", "Kompeten di Bidangnya"].map((label) => (
                    <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {label}
                    </span>
                  ))}
                </div>
                <div className="mt-8">
                  <RichContent content={tutor.isi} className="text-sm sm:text-base" />
                </div>
              </div>
              {tutor.imageUrl && (
                <div className="relative">
                  <div className="absolute -inset-4 rounded-4xl bg-linear-to-br from-primary/20 via-accent/10 to-transparent blur-xl" aria-hidden />
                  <div className="relative overflow-hidden rounded-4xl border border-border shadow-xl">
                    <img src={tutor.imageUrl} alt={tutor.judul} className="h-80 w-full object-cover transition-transform duration-700 hover:scale-105" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===== VISI & MISI ===== */}
      {visi && (
        <section className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Target className="h-3.5 w-3.5" /> Visi dan Misi
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{visi.judul}</h2>
            {visi.ringkasan && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{visi.ringkasan}</p>}
          </div>
          {blokVisi || blokMisi ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 to-card p-8 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-2xl bg-primary text-white shadow-md">
                    <Eye className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-extrabold tracking-tight text-foreground">Visi Kami</h3>
                </div>
                {blokVisi ? (
                  <p className="text-sm leading-8 text-foreground/90 sm:text-base">{blokVisi.isi}</p>
                ) : (
                  <RichContent content={visi.isi} className="text-sm sm:text-base" />
                )}
              </div>
              <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-2xl bg-primary text-white shadow-md">
                    <Target className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-extrabold tracking-tight text-foreground">Misi Kami</h3>
                </div>
                {blokMisi ? <MisiList content={blokMisi.isi} /> : <RichContent content={visi.isi} className="text-sm sm:text-base" />}
              </div>
            </div>
          ) : (
            <div className="mt-10 mx-auto max-w-4xl rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
              <RichContent content={visi.isi} className="text-sm sm:text-base" />
            </div>
          )}
        </section>
      )}

      {/* ===== KOMITMEN KAMI ===== */}
      {komitmen && (
        <section className="border-y border-border bg-secondary/30 py-16 sm:py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <HandHeart className="h-3.5 w-3.5" /> Komitmen Kami
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{komitmen.judul}</h2>
              {komitmen.ringkasan && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{komitmen.ringkasan}</p>}
            </div>
            <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="grid lg:grid-cols-2">
                <div className="p-6 sm:p-8">
                  <RichContent content={komitmen.isi} className="text-sm sm:text-base" />
                </div>
                {komitmen.imageUrl && (
                  <div className="relative">
                    <img src={komitmen.imageUrl} alt={komitmen.judul} className="h-56 w-full object-cover lg:h-full" />
                    <div className="absolute inset-0 bg-linear-to-t from-primary/40 to-transparent" aria-hidden />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== FOTO KEGIATAN PEMBELAJARAN ===== */}
      {fotoKegiatan.length > 0 && (
        <section className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Camera className="h-3.5 w-3.5" /> Suasana Belajar
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Foto Kegiatan Pembelajaran</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Momen belajar yang hangat dan menyenangkan bersama tutor serta murid Helped by Dinda.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fotoKegiatan.map((section) => (
              <div key={section.id} className="group relative overflow-hidden rounded-3xl border border-border shadow-sm">
                <img
                  src={section.imageUrl!}
                  alt={section.judul}
                  className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-110 sm:h-64"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <p className="absolute bottom-4 left-4 right-4 translate-y-2 text-sm font-bold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {section.judul}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== BAGIAN TAMBAHAN ===== */}
      {lainnya.map((section, index) => {
        const config = KATEGORI_SEKSI[section.kategori] || KATEGORI_SEKSI.profil;
        const Icon = config.ikon;
        const genap = index % 2 === 0;
        return (
          <section key={section.id} className={genap ? "" : "border-y border-border bg-secondary/30 py-10"}>
            <div className="container mx-auto max-w-6xl px-4 py-10 sm:px-6">
              <div className="grid items-center gap-8 md:grid-cols-2">
                {genap ? (
                  <>
                    <div>
                      <div className="flex items-start gap-3">
                        <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${config.latar} ${config.warna}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{section.judul}</h2>
                          {section.ringkasan && <p className="mt-2 text-sm font-medium text-muted-foreground">{section.ringkasan}</p>}
                        </div>
                      </div>
                      <RichContent content={section.isi} className="mt-6 text-sm sm:text-base" />
                    </div>
                    {section.imageUrl ? (
                      <div className="overflow-hidden rounded-3xl border border-border shadow-sm">
                        <img src={section.imageUrl} alt={section.judul} className="h-60 w-full object-cover transition-transform duration-500 hover:scale-105 sm:h-72" />
                      </div>
                    ) : (
                      <div className="flex h-60 items-center justify-center rounded-3xl border border-dashed border-border bg-linear-to-br from-primary/10 via-secondary to-background sm:h-72">
                        <Icon className="h-14 w-14 text-primary/40" />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {section.imageUrl ? (
                      <div className="overflow-hidden rounded-3xl border border-border shadow-sm">
                        <img src={section.imageUrl} alt={section.judul} className="h-60 w-full object-cover transition-transform duration-500 hover:scale-105 sm:h-72" />
                      </div>
                    ) : (
                      <div className="flex h-60 items-center justify-center rounded-3xl border border-dashed border-border bg-linear-to-br from-primary/10 via-secondary to-background sm:h-72">
                        <Icon className="h-14 w-14 text-primary/40" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-start gap-3">
                        <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${config.latar} ${config.warna}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{section.judul}</h2>
                          {section.ringkasan && <p className="mt-2 text-sm font-medium text-muted-foreground">{section.ringkasan}</p>}
                        </div>
                      </div>
                      <RichContent content={section.isi} className="mt-6 text-sm sm:text-base" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        );
      })}

      {/* ===== CTA ===== */}
      <section className="container mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-4xl bg-primary px-6 py-14 text-center shadow-xl sm:px-12">
          <div className="absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" aria-hidden />
          <div className="absolute -bottom-24 -left-16 size-72 rounded-full bg-white/10 blur-3xl" aria-hidden />
          <div className="relative">
            <Quote className="mx-auto h-10 w-10 text-white/80" />
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              Setiap anak berhak belajar dengan pendampingan yang tepat.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
              Mari bergabung bersama Helped by Dinda dan rasakan belajar yang lebih hangat, terarah, dan menyenangkan.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register">
                <Button variant="secondary" className="gap-2 font-bold">
                  Daftar Sekarang <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pengajar-publik">
                <Button variant="outline" className="gap-2 border-white/30 bg-white/10 font-bold text-white hover:bg-white/20 hover:text-white">
                  Kenali Tutor Kami
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
