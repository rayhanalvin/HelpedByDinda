import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";

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
          <p className="text-sm font-semibold text-primary">Berita & Update</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">Semua Berita Publik</h1>
        </div>
      </div>

      {berita.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">Belum ada berita publik yang dipublikasikan.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {berita.map((item) => (
            <Link key={item.id} href={`/berita/${item.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md">
              <div className="h-48 w-full bg-gradient-to-br from-primary/10 via-accent/10 to-secondary">
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
                <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{item.judul}</h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{item.ringkasan || item.isi.slice(0, 180)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}