import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";

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
      <Link href="/berita" className="mb-6 inline-flex text-sm font-semibold text-primary hover:underline">
        ← Kembali ke berita
      </Link>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        {item.thumbnailUrl && (
          <div className="h-72 w-full bg-gradient-to-br from-primary/10 via-accent/10 to-secondary">
            <img src={item.thumbnailUrl} alt={item.judul} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="secondary" className="uppercase">
              {item.kategori}
            </Badge>
            <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{item.judul}</h1>
            <p className="mt-3 text-sm text-muted-foreground">Oleh {item.authorName}</p>
          </div>

          {item.ringkasan && <p className="rounded-2xl border border-border bg-muted/20 p-4 text-sm text-foreground">{item.ringkasan}</p>}

          <article className="prose max-w-none text-foreground prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground">
            {item.isi.split("\n").map((paragraph, index) => (
              <p key={`${item.id}-${index}`} className="mb-4 text-base leading-8 text-foreground/90">
                {paragraph || " "}
              </p>
            ))}
          </article>
        </div>
      </div>
    </main>
  );
}