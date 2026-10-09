import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

async function upsertAdmin(email: string, password: string, name: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", name },
    create: {
      email,
      passwordHash,
      role: "ADMIN",
      name,
      phone: null,
      avatarUrl: null,
    },
  });

  await prisma.admin.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  console.log(`Admin OK: ${email} (id: ${user.id})`);
  return user;
}

async function main() {
  await upsertAdmin("cs.helpeddinda@gmail.com", "dindaadmin", "Dinda Rizky Febriyanti");
}

main()
  .catch((e) => {
    console.error("Gagal menyiapkan admin:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());