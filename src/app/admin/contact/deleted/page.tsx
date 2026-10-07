import React from "react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export default async function DeletedUsersPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return <div className="p-8">Unauthorized</div>;
  }

  // We store deleted users info nowhere; instead show recent deletions by checking
  // users that would be non-admin were there any. As cleanup removed rows, we can't
  // reconstruct them here. Offer a guide and allow re-run of cleanup with confirmation.

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Pengguna yang Dihapus</h1>
      <p className="text-sm text-muted-foreground mb-4">Skrip penghapusan telah dijalankan sebelumnya. Database tidak menyimpan snapshot otomatis. Jika Anda ingin backup sebelum penghapusan, jalankan ekspor terlebih dahulu.</p>
      <div className="space-y-3">
        <p className="text-sm">Opsi:</p>
        <ul className="list-disc ml-6 text-sm">
          <li>Jalankan skrip `npm run cleanup:users` dengan `--dry-run` (belum tersedia) untuk melihat apa yang akan dihapus.</li>
          <li>Buat ekspor manual database sebelum menjalankan skrip.</li>
        </ul>
      </div>
    </div>
  );
}
