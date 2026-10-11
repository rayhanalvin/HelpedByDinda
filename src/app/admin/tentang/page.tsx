"use client";

import * as React from "react";

export default function AdminTentangRedirectPage() {
  React.useEffect(() => {
    window.location.replace("/admin/berita");
  }, []);

  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <p className="text-sm text-muted-foreground">Mengalihkan ke Kelola Konten Website…</p>
    </main>
  );
}