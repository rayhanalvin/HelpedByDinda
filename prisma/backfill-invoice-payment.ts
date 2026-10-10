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

  await prisma.$executeRawUnsafe(`ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "relatedPaymentId" TEXT`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "invoices_relatedPaymentId_key" ON "invoices"("relatedPaymentId")`);
  console.log("Column + unique index ready.");

  const invoices = await prisma.invoice.findMany({
    where: { targetRole: "MURID", targetUserId: { not: null }, relatedPaymentId: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, targetUserId: true, createdAt: true, periode: true, title: true },
  });

  let linked = 0;
  let skipped = 0;

  for (const inv of invoices) {
    if (!inv.targetUserId) {
      skipped++;
      continue;
    }
    // The invoice POST creates a Payment with an orderId starting with INV-<muridId>-<timestamp>
    const murid = await prisma.murid.findUnique({ where: { userId: inv.targetUserId }, select: { id: true } });
    if (!murid) {
      skipped++;
      continue;
    }
    const prefix = `INV-${murid.id}-`;
    const candidates = await prisma.payment.findMany({
      where: { muridId: murid.id, orderId: { startsWith: prefix } },
      orderBy: { createdAt: "asc" },
      select: { id: true, createdAt: true, status: true },
    });
    let match = candidates.find((c) => Math.abs(c.createdAt.getTime() - inv.createdAt.getTime()) < 60_000);
    if (!match) {
      // Fallback: the closest payment for this murid within 3 minutes (regardless of orderId prefix)
      const nearby = await prisma.payment.findMany({
        where: { muridId: murid.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, createdAt: true, status: true },
      });
      match = nearby
        .map((c) => ({ ...c, diff: Math.abs(c.createdAt.getTime() - inv.createdAt.getTime()) }))
        .filter((c) => c.diff < 180_000)
        .sort((a, b) => a.diff - b.diff)[0];
    }
    if (match) {
      await prisma.invoice.update({ where: { id: inv.id }, data: { relatedPaymentId: match.id } });
      linked++;
    } else {
      skipped++;
    }
  }

  const remaining = await prisma.invoice.count({ where: { targetRole: "MURID", relatedPaymentId: null } });
  console.log(`Linked ${linked} invoice(s), skipped ${skipped}, remaining unlinked: ${remaining}`);
  await prisma.$disconnect();
}

void main();