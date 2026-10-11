import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { getPortalContent } from "@/lib/portal-content";
import { ProfilPengajarCard } from "@/components/shared/ProfilPengajarCard";

export const dynamic = "force-dynamic";

export default async function PengajarPublikPage() {
  const portalContent = await getPortalContent("daftar-pengajar");
  let pengajar: Array<{ id: string; name: string; avatarUrl: string | null; spesialisasi: string; bio: string | null }> = [];

  try {
    const rows = await prisma.pengajar.findMany({
      where: { isActive: true },
      include: { user: { select: { name: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    });
    pengajar = rows.map((item) => ({
      id: item.id,
      name: item.user.name,
      avatarUrl: item.user.avatarUrl,
      spesialisasi: item.spesialisasi,
      bio: item.bio,
    }));
  } catch (error) {
    console.warn("Public teachers unavailable:", error instanceof Error ? error.message : error);
  }

  return (
    <div className="flex flex-col gap-12 py-12 pb-24">
      {/* Header */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 text-center">
        <Badge variant="default" className="mb-3">
          Tim Akademik & Pengajar
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">{portalContent?.judul || "Tutor Pilihan yang Ramah, Kompeten, & Menginspirasi"}</h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {portalContent?.ringkasan || "Seluruh pengajar di Helped By Dinda telah melalui kurasi ketat: memiliki latar belakang pendidikan unggulan dari perguruan tinggi terkemuka dan kemampuan pedagogik yang empatik."}
        </p>
      </section>

      {/* Feature highlights */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Kurasi Ketat</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">Setiap pengajar melalui seleksi akademik dan kualitas mengajar.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Lulusan PTN Ternama</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">Latar belakang pendidikan unggulan dengan pedagogik yang empatik.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Metode Fleksibel</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">Bimbingan daring maupun tatap muka sesuai kebutuhan murid.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Teachers Grid */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 sm:gap-8">
          {pengajar.map((tutor) => (
            <ProfilPengajarCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      </section>

      {/* Join as Tutor CTA */}
      <section className="container mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl border border-primary/20 bg-secondary/50 p-8 text-center flex flex-col items-center gap-4">
          <Badge variant="default">Karir Pendidik</Badge>
          <h3 className="text-2xl font-bold text-foreground">Kamu Tertarik Bergabung Sebagai Pengajar?</h3>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Dapatkan fleksibilitas jadwal mengajar, rekap fee transparan yang dihitung otomatis dari jam kehadiranmu, dan akses platform digital yang memudahkan kerjamu.
          </p>
          <Link href="/kontak">
            <Button variant="default" className="gap-2">
              Kirim Lamaran Tutor
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
