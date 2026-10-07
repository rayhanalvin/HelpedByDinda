import { Badge } from "@/components/ui/badge";
import { getPortalContentsByCategory } from "@/lib/portal-content";

export const dynamic = "force-dynamic";

export default async function TentangPage() {
  const portalContents = await getPortalContentsByCategory("Tentang Kami");
  const [intro, ...sections] = portalContents;

  return (
    <div className="flex flex-col gap-16 py-12 pb-24">
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 text-center">
        <Badge variant="default" className="mb-4">
          Tentang Kami
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">{intro?.judul || "Tentang Kami"}</h1>
        {intro?.ringkasan && <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{intro.ringkasan}</p>}
      </section>

      {intro?.isi && (
        <section className="container mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10 md:flex-row">
            {intro.imageUrl && <img src={intro.imageUrl} alt={intro.judul} className="h-48 w-48 shrink-0 rounded-2xl border border-border object-cover sm:h-64 sm:w-64" />}
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{intro.isi}</p>
          </div>
        </section>
      )}

      {sections.map((section, index) => (
        <section key={section.id} className={index % 2 === 1 ? "border-y border-border bg-secondary/30 py-12" : "container mx-auto max-w-5xl px-4 sm:px-6"}>
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center">
            {section.imageUrl && <img src={section.imageUrl} alt={section.judul} className="h-48 w-full rounded-2xl border border-border object-cover md:w-64" />}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">{section.judul}</h2>
              {section.ringkasan && <p className="text-sm font-medium text-muted-foreground">{section.ringkasan}</p>}
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{section.isi}</p>
            </div>
          </div>
        </section>
      ))}

    </div>
  );
}
