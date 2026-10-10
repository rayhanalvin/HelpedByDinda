"use client";

import * as React from "react";
import { Star, MessageSquareQuote, Loader2 } from "lucide-react";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type Review = {
  id: string;
  rating: number;
  pemahamanMateri: number;
  komunikasi: number;
  ketepatanWaktu: number;
  deskripsi: string;
  muridNama: string;
  createdAt: string;
};

type RatingData = {
  pengajarId: string;
  total: number;
  average: number;
  distribution: { star: number; count: number }[];
  reviews: Review[];
};

export function RatingUlasanPengajar({ pengajarId, pengajarNama }: { pengajarId: string; pengajarNama: string }) {
  const [data, setData] = React.useState<RatingData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/public/pengajar-rating?pengajarId=${encodeURIComponent(pengajarId)}`, { cache: "no-store" });
      const json = (await response.json()) as { ok: boolean; data: RatingData };
      if (json.ok) setData(json.data);
    } catch {
      // Biarkan snapshot terakhir jika gagal
    } finally {
      setLoading(false);
    }
  }, [pengajarId]);

  React.useEffect(() => {
    void load();
  }, [load]);
  useVisiblePolling(load, 45000);

  const average = data?.average || 0;
  const total = data?.total || 0;

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50/60 p-3">
        <div className="flex items-center gap-1 text-amber-500">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={`h-4 w-4 ${star <= Math.round(average) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
          ))}
        </div>
        <span className="text-sm font-bold text-foreground tabular-nums">{average.toFixed(1)} / 5.0</span>
        <span className="text-xs text-muted-foreground">({total} ulasan murid)</span>
      </div>

      {loading && !data ? (
        <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat ulasan {pengajarNama}...
        </div>
      ) : data && data.reviews.length > 0 ? (
        <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
          {data.reviews.slice(0, 5).map((review) => (
            <div key={review.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-foreground">{review.muridNama}</span>
                <span className="flex items-center gap-0.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`h-3 w-3 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                  ))}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-3">{review.deskripsi}</p>
            </div>
          ))}
          {total > 5 && <p className="text-[10px] text-muted-foreground text-center">+{total - 5} ulasan lainnya</p>}
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MessageSquareQuote className="h-3.5 w-3.5" /> Belum ada ulasan murid untuk pengajar ini.
        </p>
      )}
    </div>
  );
}