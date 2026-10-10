import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { RichContent } from "@/components/shared/RichContent";
import { CalendarDays, User, ArrowLeft } from "lucide-react";

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

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/berita" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:gap-2.5 hover:text-primary/80">
        <ArrowLeft className="h-4 w-4" /> Kembali ke berita
      </Link>

      <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        {item.thumbnailUrl && (
          <div className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-secondary sm:h-80">
            <img src={item.thumbnailUrl} alt={item.judul} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        )}

        <div className="space-y-6 p-6 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="secondary" className="uppercase">
              {item.kategori}
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl leading-tight">{item.judul}</h1>
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" /> Oleh {item.authorName}
            </p>
          </div>

          {item.ringkasan && <p className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground/90 leading-relaxed">{item.ringkasan}</p>}

          <RichContent content={item.isi} />
        </div>
      </article>
    </main>
  );
}