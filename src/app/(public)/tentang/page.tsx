import { Badge } from "@/components/ui/badge";
import { getPortalContentsByCategory } from "@/lib/portal-content";
import { RichContent } from "@/components/shared/RichContent";
import { Sparkles, Target, Heart, Users2, BookOpen, GraduationCap, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TentangPage() {
  const portalContents = await getPortalContentsByCategory("Tentang Kami");
  const [intro, ...sections] = portalContents;

  return (
    <div className="flex flex-col gap-16 py-12 pb-24">
      {/* Hero */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Badge variant="default" className="mb-4 gap-1.5">
          <Sparkles className="h-3 w-3" /> Tentang Kami
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">{intro?.judul || "Tentang Kami"}</h1>
        {intro?.ringkasan && <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{intro.ringkasan}</p>}
      </section>

      {/* Intro / Profil */}
      {intro?.isi && (
        <section className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-2 items-center rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            {intro.imageUrl && (
              <div className="relative order-2 md:order-1">
                <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/15 to-accent/20 blur-lg" aria-hidden />
                <img src={intro.imageUrl} alt={intro.judul} className="relative h-64 w-full rounded-2xl border border-border object-cover shadow-lg sm:h-96 transition-transform duration-500 hover:scale-[1.02]" />
              </div>
            )}
            <div className={`${intro.imageUrl ? "order-1 md:order-2" : "order-1 mx-auto max-w-3xl text-center"}`}>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <Heart className="h-3.5 w-3.5" /> Profil Kami
              </div>
              <RichContent content={intro.isi} className="mt-4" />
            </div>
          </div>
        </section>
      )}

      {/* Sections */}
      {sections.map((section, index) => {
        const alt = index % 2 === 1;
        const icons = [Target, Users2, BookOpen, GraduationCap, Sparkles];
        const Icon = icons[index % icons.length];
        return (
          <section key={section.id} className={alt ? "border-y border-border bg-secondary/30 py-14" : "py-6"}>
            <div className="container mx-auto max-w-6xl px-4 sm:px-6">
              <div className={`grid gap-8 md:grid-cols-5 items-center ${alt ? "md:[&>*:first-child]:order-2" : ""}`}>
                {section.imageUrl ? (
                  <div className="md:col-span-2">
                    <div className="group overflow-hidden rounded-2xl border border-border shadow-sm">
                      <img src={section.imageUrl} alt={section.judul} className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-72" />
                    </div>
                  </div>
                ) : (
                  <div className="md:col-span-2">
                    <div className="flex h-56 sm:h-72 items-center justify-center rounded-2xl border border-dashed border-border bg-gradient-to-br from-primary/10 via-accent/10 to-secondary">
                      <Icon className="h-14 w-14 text-primary/40" />
                    </div>
                  </div>
                )}
                <div className={section.imageUrl ? `md:col-span-3 space-y-4` : `md:col-span-3 space-y-4`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 grid size-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/5 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{section.judul}</h2>
                      {section.ringkasan && <p className="mt-2 text-sm font-medium text-muted-foreground">{section.ringkasan}</p>}
                    </div>
                  </div>
                  <RichContent content={section.isi} className="text-sm sm:text-base" />
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
