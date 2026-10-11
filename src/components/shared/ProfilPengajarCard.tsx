"use client";

import * as React from "react";
import { CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RatingUlasanPengajar } from "@/components/shared/RatingUlasanPengajar";
import { JadwalTersediaPicker } from "@/components/shared/JadwalTersediaPicker";

type Tutor = {
  id: string;
  name: string;
  avatarUrl: string | null;
  spesialisasi: string;
  bio: string | null;
};

export function ProfilPengajarCard({ tutor }: { tutor: Tutor }) {
  const [expanded, setExpanded] = React.useState(false);
  const bio = tutor.bio || "Pengajar Helped By Dinda yang siap mendampingi proses belajar murid.";
  const bioIsLong = bio.length > 160;

  return (
    <article className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30">
      {/* Header kartu: foto + identitas */}
      <div className="relative flex flex-col items-center gap-4 px-5 pt-6 sm:flex-row sm:items-start sm:gap-5 sm:px-6">
        <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-br from-primary/15 via-primary/5 to-transparent" aria-hidden />
        <div className="relative z-10 h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-primary/20 shadow-sm sm:h-28 sm:w-28">
          <img
            src={tutor.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"}
            alt={`Foto ${tutor.name}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="relative z-10 w-full min-w-0 text-center sm:text-left">
          <Badge variant="success" className="gap-1 text-[10px]">
            <CheckCircle className="h-3 w-3" /> Tutor Terverifikasi
          </Badge>
          <h3 className="mt-2 text-lg font-bold text-foreground sm:text-xl" title={tutor.name}>
            {tutor.name}
          </h3>
          <p className="mt-0.5 text-sm font-semibold text-primary">{tutor.spesialisasi}</p>
        </div>
      </div>

      {/* Biodata: maksimal 4-5 baris, tombol Baca Selengkapnya */}
      <div className="px-5 pt-4 sm:px-6">
        <p className={`text-sm leading-relaxed text-muted-foreground ${expanded ? "" : "line-clamp-4"}`}>{bio}</p>
        {bioIsLong && (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            {expanded ? (
              <>
                Tampilkan Lebih Sedikit <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Baca Selengkapnya <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 px-5 pt-4 sm:px-6">
        <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">Aktif Mengajar</span>
        <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Bimbel Online & Offline</span>
      </div>

      {/* Rating + jadwal */}
      <div className="mt-auto space-y-3 border-t border-border/60 px-5 py-4 sm:px-6">
        <RatingUlasanPengajar pengajarId={tutor.id} pengajarNama={tutor.name} />
        <JadwalTersediaPicker pengajarId={tutor.id} pengajarNama={tutor.name} />
      </div>
    </article>
  );
}