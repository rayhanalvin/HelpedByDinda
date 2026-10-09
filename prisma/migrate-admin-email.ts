import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

async function main() {
  const passwordHash = await bcrypt.hash("dindaadmin", 10);
  const dup = await prisma.user.findUnique({ where: { email: "cs.helpeddinda@gmail.com" } });
  const old = await prisma.user.findUnique({ where: { email: "dinda@helpedbydinda.id" } });

  if (dup && (!old || dup.id !== old.id)) {
    await prisma.user.delete({ where: { id: dup.id } });
    console.log("Akun duplikat cs.helpeddinda@gmail.com dihapus:", dup.id);
  }

  if (old) {
    await prisma.user.update({
      where: { id: old.id },
      data: { email: "cs.helpeddinda@gmail.com", passwordHash, role: "ADMIN", name: "Dinda Rizky Febriyanti" },
    });
    console.log("Akun lama diubah menjadi cs.helpeddinda@gmail.com:", old.id);
  }

  await prisma.admin.upsert({
    where: { userId: old?.id ?? "" },
    update: {},
    create: { userId: old!.id },
  });
}

main()
  .catch((e) => {
    console.error("Gagal migrasi admin:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());