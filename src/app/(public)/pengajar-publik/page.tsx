import Link from "next/link";
import { Star, CheckCircle, GraduationCap, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getPortalContent } from "@/lib/portal-content";

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

      {/* Teachers Grid */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pengajar.map((tutor) => (
            <Card key={tutor.id} className="overflow-hidden hover:shadow-lg transition-all border-border">
              <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
                <div className="h-32 w-32 sm:h-36 sm:w-36 rounded-2xl overflow-hidden border-2 border-primary/20 shrink-0 mx-auto sm:mx-0 shadow-sm">
                  <img src={tutor.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"} alt={tutor.name} className="h-full w-full object-cover" />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="success" className="gap-1">
                      <CheckCircle className="h-3 w-3" /> Tutor Terverifikasi
                    </Badge>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <span>4.9 / 5.0 (90+ ulasan)</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground">{tutor.name}</h3>
                    <p className="text-sm font-semibold text-primary">{tutor.spesialisasi}</p>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{tutor.bio || "Pengajar Helped By Dinda yang siap mendampingi proses belajar murid."}</p>

                  <div className="pt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-lg bg-secondary px-2.5 py-1 text-secondary-foreground font-medium">Aktif Mengajar</span>
                    <span className="rounded-lg bg-muted px-2.5 py-1 text-muted-foreground font-medium">Bimbel Online & Offline</span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
