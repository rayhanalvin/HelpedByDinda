import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const raw = process.env.DATABASE_URL ?? "";
  const connectionString = raw
    .replace(/sslmode=require/gi, "sslmode=verify-full")
    .replace(/sslmode=prefer/gi, "sslmode=verify-full")
    .replace(/sslmode=verify-ca/gi, "sslmode=verify-full");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  await prisma.$executeRawUnsafe(`ALTER TABLE "pengajar_availability" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'TERSEDIA'`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "pengajar_availability_status_idx" ON "pengajar_availability"("status")`);
  console.log("Kolom status pengajar_availability siap.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));