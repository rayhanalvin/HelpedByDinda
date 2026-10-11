import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { RichContent } from "@/components/shared/RichContent";
import { ShareBeritaButton } from "@/components/shared/ShareBeritaButton";
import { CalendarDays, User, ArrowLeft, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BeritaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let item: Awaited<ReturnType<typeof prisma.berita.findUnique>> | null = null;

  try {
    item = await prisma.berita.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.warn("Berita detail unavailable:", error instanceof Error ? error.message : error);
    item = null;
  }

  if (!item || !item.isPublished) {
    notFound();
  }

  const formatTanggal = (date: Date) =>
    new Date(date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="container mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link href="/berita" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:gap-2.5 hover:text-primary/80">
          <ArrowLeft className="h-4 w-4" /> Kembali ke berita
        </Link>
        <Badge variant="secondary" className="gap-1.5 uppercase">
          <Tag className="h-3 w-3" /> {item.kategori}
        </Badge>
      </div>

      <article className="overflow-hidden rounded-4xl border border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        {item.thumbnailUrl && (
          <div className="relative h-64 w-full overflow-hidden bg-linear-to-br from-primary/10 via-accent/10 to-secondary sm:h-96">
            <img src={item.thumbnailUrl} alt={item.judul} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />
          </div>
        )}

        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              <CalendarDays className="h-4 w-4" /> {formatTanggal(item.createdAt)}
            </span>
            <ShareBeritaButton slug={item.slug} />
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">{item.judul}</h1>
          <div className="mt-4 flex items-center gap-3 border-y border-border py-4">
            <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{item.authorName}</p>
              <p className="text-xs text-muted-foreground">Penulis & Tim Redaksi</p>
            </div>
          </div>

          {item.ringkasan && (
            <p className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-foreground/90 sm:text-base">{item.ringkasan}</p>
          )}

          <div className="mt-8">
            <RichContent content={item.isi} className="text-[15px] leading-8 sm:text-base" />
          </div>
        </div>
      </article>
    </main>
  );
}