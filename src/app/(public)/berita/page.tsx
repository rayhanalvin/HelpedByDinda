import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { Newspaper, CalendarDays, ChevronRight, TrendingUp, PenLine, Users } from "lucide-react";

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

  const kategoriList = Array.from(new Set(berita.map((item) => item.kategori).filter(Boolean)));

  return (
    <main className="container mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-4xl bg-linear-to-br from-primary via-primary/90 to-purple-800 px-6 py-12 text-center text-white shadow-xl sm:px-12 sm:py-16 mt-6">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Newspaper className="h-3.5 w-3.5" /> Berita & Update
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">Update Platform & Kabar Terbaru</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Informasi terbaru seputar kegiatan, program, prestasi, dan perkembangan Helped by Dinda — semuanya dalam satu tempat.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      {berita.length > 0 && (
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground tabular-nums">{berita.length}</p>
              <p className="text-xs font-medium text-muted-foreground">Total Berita Publik</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground tabular-nums">{kategoriList.length}</p>
              <p className="text-xs font-medium text-muted-foreground">Kategori Berita</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-purple-600/10 text-purple-600">
              <PenLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground tabular-nums">Helped By Dinda</p>
              <p className="text-xs font-medium text-muted-foreground">Penerbit Resmi</p>
            </div>
          </div>
        </section>
      )}

      {/* Kategori chips */}
      {kategoriList.length > 0 && (
        <section className="mt-8 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Kategori:
          </span>
          {kategoriList.map((kategori) => (
            <Badge key={kategori} variant="secondary" className="px-3 py-1 text-[11px] hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
              {kategori}
            </Badge>
          ))}
        </section>
      )}

      {/* Grid berita */}
      {berita.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          Belum ada berita publik yang dipublikasikan.
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {berita.map((item, index) => (
            <Link
              key={item.id}
              href={`/berita/${item.slug}`}
              className="group overflow-hidden rounded-3xl border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${Math.min(index, 9) * 60}ms` }}
            >
              <div className="relative h-52 w-full overflow-hidden bg-linear-to-br from-primary/10 via-accent/10 to-secondary">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.judul} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary">{item.kategori}</div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute left-4 top-4">
                  <Badge variant="default" className="border-white/20 bg-white/90 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm backdrop-blur-sm">
                    {item.kategori}
                  </Badge>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary sm:text-xl">{item.judul}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">{item.ringkasan || item.isi.slice(0, 180)}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                  Baca selengkapnya
                  <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}