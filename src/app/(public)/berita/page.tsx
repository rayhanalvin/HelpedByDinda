import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { Newspaper, CalendarDays, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BeritaPage() {
  let berita: Array<{ id: string; slug: string; judul: string; ringkasan: string | null; isi: string; thumbnailUrl: string | null; kategori: string; createdAt: Date }> = [];

  try {
    berita = await prisma.berita.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.warn("Berita list unavailable:", error instanceof Error ? error.message : error);
    berita = [];
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            <Newspaper className="h-4 w-4" /> Berita & Update
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">Semua Berita Publik</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Informasi terbaru seputar kegiatan, program, dan perkembangan Helped by Dinda.</p>
        </div>
      </div>

      {berita.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">Belum ada berita publik yang dipublikasikan.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {berita.map((item) => (
            <Link key={item.id} href={`/berita/${item.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg animate-in fade-in slide-in-from-bottom-2">
              <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-secondary">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.judul} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary">{item.kategori}</div>
                )}
                {item.thumbnailUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />}
              </div>
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {item.kategori}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{item.judul}</h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{item.ringkasan || item.isi.slice(0, 180)}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">
                  Baca selengkapnya <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}