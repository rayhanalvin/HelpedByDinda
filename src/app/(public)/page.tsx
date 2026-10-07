import Link from "next/link";
import { Sparkles, ArrowRight, CheckCircle2, CalendarCheck, Video, ShieldCheck, GraduationCap, Users, Award, Clock, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getPortalContent } from "@/lib/portal-content";
import { formatRupiah } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let beritaTerbaru: Array<{ id: string; slug: string; judul: string; ringkasan: string | null; isi: string; thumbnailUrl: string | null; kategori: string; createdAt: Date }> = [];
  let pengajar: Array<{ id: string; name: string; avatarUrl: string | null; spesialisasi: string; bio: string | null }> = [];
  let programs: Array<{ id: string; category: string; title: string; target: string; price: number; description: string; popular: boolean }> = [];
  const portalContent = await getPortalContent("beranda");

  try {
    beritaTerbaru = await prisma.berita.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  } catch (error) {
    console.warn("Berita homepage unavailable:", error instanceof Error ? error.message : error);
    beritaTerbaru = [];
  }

  try {
    const rows = await prisma.pengajar.findMany({
      where: { isActive: true },
      include: { user: { select: { name: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
      take: 4,
    });
    pengajar = rows.map((item) => ({ id: item.id, name: item.user.name, avatarUrl: item.user.avatarUrl, spesialisasi: item.spesialisasi, bio: item.bio }));
  } catch (error) {
    console.warn("Homepage teachers unavailable:", error instanceof Error ? error.message : error);
  }

  try {
    programs = await prisma.program.findMany({
      where: { isPublished: true },
      orderBy: [{ popular: "desc" }, { createdAt: "asc" }],
      take: 4,
      select: { id: true, category: true, title: true, target: true, price: true, description: true, popular: true },
    });
  } catch (error) {
    console.warn("Homepage programs unavailable:", error instanceof Error ? error.message : error);
  }

  return (
    <div className="flex flex-col gap-16 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 lg:pt-28 overflow-hidden">
        {/* Subtle background gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-linear-to-b from-primary/10 via-accent/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary/80 px-4 py-1.5 text-xs sm:text-sm font-semibold text-primary mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Platform Bimbel Digital Modern No. 1 untuk Generasi Berprestasi</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.15]">
            {portalContent?.judul || (
              <>
                Bimbingan Belajar Modern Bersama <span className="bg-linear-to-r from-primary to-purple-800 bg-clip-text text-transparent">Helped By Dinda</span>
              </>
            )}
          </h1>

          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {portalContent?.ringkasan || "Menghubungkan murid, pengajar hebat, dan admin dalam satu sistem terintegrasi. Absensi kehadiran digital realtime, materi video terstruktur, dan rekap transparan tanpa repot."}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="accent" size="lg" className="w-full sm:w-auto gap-2 text-base font-bold shadow-md hover:shadow-lg">
                Daftar Murid Baru
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/program" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                Lihat Program Belajar
              </Button>
            </Link>
          </div>

          {/* Quick Statistics Banner */}
          <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <p className="text-3xl font-extrabold text-primary tabular-nums">100%</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Absensi Digital Akurat</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <p className="text-3xl font-extrabold text-accent tabular-nums">500+</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Siswa Lolos PTN Impian</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <p className="text-3xl font-extrabold text-foreground tabular-nums">4.9 / 5</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Kepuasan Wali Murid</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <p className="text-3xl font-extrabold text-purple-600 tabular-nums">&lt; 2 Detik</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Rekap Fee Pengajar Otomatis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Keunggulan Utama Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="default" className="mb-3">
            Kenapa Memilih Kami?
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Bukan Sekadar Les Biasa, Ini Ekosistem Belajar Cerdas</h2>
          <p className="mt-3 text-sm text-muted-foreground">Kami menyelesaikan masalah pencatatan manual, jadwal bentrok, dan materi berserakan dengan teknologi modern.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md hover:border-primary/40 transition-all">
            <CardContent className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Absensi Digital Realtime</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Murid & pengajar melakukan presensi mandiri dengan validasi waktu jadwal. Status kehadiran akurat tanpa manipulasi.</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md hover:border-accent/40 transition-all">
            <CardContent className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent mb-5">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Materi Video Bunny CDN</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Streaming video penjelasan berkualitas tinggi dan modul latihan PDF tersusun rapi per mata pelajaran & jenjang kelas.</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md hover:border-purple-400 transition-all">
            <CardContent className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 mb-5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Pembayaran Midtrans Otomatis</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Tagihan bulanan terbit otomatis dan dapat dibayar melalui transfer bank dengan konfirmasi admin.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Program Belajar Highlights */}
      <section className="bg-secondary/40 border-y border-border py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <Badge variant="default" className="mb-2">
                Program Unggulan
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Pilihan Jenjang & Kurikulum</h2>
              <p className="text-sm text-muted-foreground mt-1">Tersedia bimbingan tatap muka (offline) maupun kelas daring interaktif (online).</p>
            </div>
            <Link href="/program">
              <Button variant="outline" className="gap-2">
                Lihat Seluruh Detail Program
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {programs.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {programs.map((program) => (
                <div key={program.id} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant="secondary">{program.category}</Badge>
                      {program.popular && <Badge variant="default">Rekomendasi</Badge>}
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">{program.target}</p>
                    <h3 className="mt-2 text-xl font-bold text-foreground">{program.title}</h3>
                    <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-muted-foreground">{program.description}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-xs font-semibold text-foreground">{formatRupiah(program.price)} / bln</span>
                    <Link href="/program" className="text-xs font-bold text-primary hover:underline">
                      Detail
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada program yang dipublikasikan.</p>
          )}
        </div>
      </section>

      {/* Featured Teachers */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <Badge variant="success" className="mb-2">
              Tutor Pilihan
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Belajar Bersama Pengajar Berpengalaman</h2>
            <p className="text-sm text-muted-foreground mt-1">Pengajar kami adalah lulusan PTN ternama yang mengajar dengan metode ramah dan santai.</p>
          </div>
          <Link href="/pengajar-publik">
            <Button variant="outline" className="gap-2">
              Lihat Semua Pengajar
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pengajar.map((tutor) => (
            <div key={tutor.id} className="rounded-2xl border border-border bg-card p-5 text-center flex flex-col items-center hover:shadow-md transition-all group">
              <div className="h-24 w-24 rounded-2xl overflow-hidden mb-4 border-2 border-primary/20 group-hover:border-primary transition-colors">
                <img src={tutor.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"} alt={tutor.name} className="h-full w-full object-cover" />
              </div>
              <h3 className="text-base font-bold text-foreground">{tutor.name}</h3>
              <p className="text-xs font-semibold text-primary mt-0.5">{tutor.spesialisasi}</p>
              <p className="text-xs text-muted-foreground mt-3 line-clamp-3 leading-relaxed">{tutor.bio || "Pengajar berpengalaman Helped By Dinda."}</p>
              <div className="mt-4 pt-3 border-t border-border w-full flex items-center justify-center gap-1 text-amber-500 text-xs font-bold">
                <Star className="h-4 w-4 fill-amber-400" />
                <span>4.9 / 5.0 rating</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Berita & Update Publik */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <Badge variant="default" className="mb-2">
              Berita Terbaru
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Update Platform & Prestasi Helped By Dinda</h2>
          </div>
          <Link href="/berita">
            <Button variant="outline" className="gap-2">
              Lihat Semua Berita
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {beritaTerbaru.length > 0 ? (
            beritaTerbaru.map((item) => (
              <Link key={item.id} href={`/berita#${item.slug}`} className="group block rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all">
                <div className="h-44 w-full bg-linear-to-br from-primary/10 via-accent/10 to-secondary">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.judul} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary">{item.kategori}</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {item.kategori}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{item.judul}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{item.ringkasan || item.isi.slice(0, 160)}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="md:col-span-3 rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">Belum ada berita publik yang dipublikasikan.</div>
          )}
        </div>
      </section>

      {/* Testimoni Realistis */}
      <section className="bg-muted/40 py-16 border-y border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <Badge variant="default" className="mb-2">
              Apa Kata Mereka?
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Dipercaya Ratusan Orang Tua & Murid</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="flex text-amber-400 gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground italic leading-relaxed">
                &ldquo;Sejak ikut bimbel di Helped By Dinda, nilai matematika anak saya (Rizky) melonjak dari 65 jadi 92. Jadwalnya sangat teratur dan absennya tercatat rapi di HP.&rdquo;
              </p>
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs font-bold text-foreground">Ir. Hendra Maulana</p>
                <p className="text-[11px] text-muted-foreground">Wali Murid Siswa Kelas 11 SMAN 1 Jakarta</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="flex text-amber-400 gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground italic leading-relaxed">
                &ldquo;Tutor Kak Siti asyik banget! Belajar grammar Bahasa Inggris sekarang nggak takut salah lagi. Materi videonya bisa diputar ulang kapan saja di rumah.&rdquo;
              </p>
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs font-bold text-foreground">Aisyah Nur Fadilah</p>
                <p className="text-[11px] text-muted-foreground">Siswa Kelas 8 SMPN 5 Bandung</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="flex text-amber-400 gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground italic leading-relaxed">&ldquo;Bedah soal UTBK bareng Kak Andi dan Kak Budi bikin saya paham konsep cepatnya. Alhamdulillah sekarang lolos di Teknik Elektro ITB!&rdquo;</p>
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs font-bold text-foreground">Fajar Ramadhan</p>
                <p className="text-[11px] text-muted-foreground">Alumni Kelas UTBK SMAN 3 Surabaya</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Pendaftaran Akhir */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-linear-to-r from-primary to-purple-800 p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Siap Raih Prestasi Terbaik Bersama Kami?</h2>
            <p className="text-white/85 text-sm sm:text-base leading-relaxed">Daftarkan putra-putri Anda sekarang atau konsultasikan kebutuhan belajar secara gratis dengan tim akademik kami.</p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register" className="w-full sm:w-auto">
                <Button variant="accent" size="lg" className="w-full sm:w-auto text-base font-bold">
                  Daftar Sekarang
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/kontak" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10 hover:border-white">
                  Hubungi WhatsApp Kami
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
