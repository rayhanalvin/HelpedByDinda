import React from "react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import Link from "next/link";

export default async function AdminContactPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return <div className="p-8">Unauthorized</div>;
  }

  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Pesan Masuk</h1>
      <Link href="/admin/contact/deleted">Lihat pengguna yang dihapus</Link>
      <div className="mt-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-sm text-muted-foreground">Belum ada pesan.</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="p-4 border rounded-lg">
              <div className="text-sm font-semibold">
                {m.nama} — {m.whatsapp}
              </div>
              <div className="text-xs text-muted-foreground">{m.email}</div>
              <div className="mt-2 text-sm">{m.pesan}</div>
              <div className="mt-2 text-xs text-muted-foreground">{m.createdAt.toISOString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
