"use client";

import * as React from "react";
import { Share2, Check } from "lucide-react";

export function ShareBeritaButton({ slug }: { slug: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleShare = async () => {
    const url = `https://helpedbydinda.vercel.app/berita/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard tidak tersedia */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={
        copied
          ? "inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors"
          : "inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      }
      title="Salin tautan berita"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "Tautan Disalin" : "Bagikan"}
    </button>
  );
}