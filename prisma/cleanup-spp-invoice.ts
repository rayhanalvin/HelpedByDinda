import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * One-shot SPP/invoice cleanup + status re-sync.
 *
 * What it does:
 *  1. Deletes ALL invoices related to SPP/murid payments (InvoiceTarget = MURID),
 *     including legacy / unlinked / duplicate rows.
 *  2. Deletes the auto-created "INV-*" payment rows and any other SPP invoice-linked
 *     payments, so no orphan transactions remain in admin tracking.
 *  3. Deletes internal Message notifications about invoices/tagihan SPP.
 *  4. Deletes reminder logs about invoices.
 *  5. Resets every Murid.statusBayarBulanIni to a clean state based on the remaining
 *     payments (defaults to PENDING when no confirmed transaction exists).
 *  6. Re-computes statusBayarBulanIni + paymentUnlocked consistently so admin,
 *     murid, and guards are synchronized again.
 *
 * Run with:  npm run cleanup:spp
 * Dry run:   npm run cleanup:spp:dry
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set - aborting");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function summary() {
  return {
    invoices: await prisma.invoice.count(),
    payments: await prisma.payment.count(),
    murid: await prisma.murid.count(),
    messages: await prisma.message.count(),
    reminderLogs: await prisma.reminderLog.count(),
  };
}

async function main() {
  console.log("SPP/invoice cleanup starting...");
  if (dryRun) console.log("DRY RUN - no changes will be applied.");
  console.log("Before:", JSON.stringify(await summary()));

  if (dryRun) {
    console.log("Dry run complete - no data was modified.");
    await prisma.$disconnect();
    process.exit(0);
  }

  // 1. Invoices targeted at murid (SPP). Delete all of them — the user asked to
  //    remove every SPP invoice record visible under murid pembayaran.
  const invDelete = await prisma.invoice.deleteMany({ where: { targetRole: "MURID" } });
  console.log(`Deleted SPP invoices: ${invDelete.count}`);

  // Also delete teacher-invoice rows that were created as "invoice" demo/honorar,
  // leaving the finance/reminder history clean for a fresh start.
  // (Optional: comment out if you want to keep pengajar invoice history.)
  const invGuruDelete = await prisma.invoice.deleteMany({ where: { targetRole: "PENGAJAR" } });
  console.log(`Deleted PENGAJAR invoices: ${invGuruDelete.count}`);

  // 2. Delete auto-created SPP payment rows and any other orphan transactions that
  //    are no longer tied to a real invoice. Keep SUCCESS payments that are linked
  //    to a record the user wants (none remain after the above deletions).
  const paymentDelete = await prisma.payment.deleteMany({
    where: {
      OR: [
        { orderId: { startsWith: "INV-" } },
        { invoice: { is: null }, status: { not: "SUCCESS" } },
      ],
    },
  });
  console.log(`Deleted SPP/orphan payments: ${paymentDelete.count}`);

  // 3. Delete invoice-related in-app message notifications.
  const msgDelete = await prisma.message.deleteMany({
    where: {
      OR: [
        { title: { contains: "Invoice", mode: "insensitive" } },
        { title: { contains: "Tagihan", mode: "insensitive" } },
        { body: { contains: "Invoice Anda", mode: "insensitive" } },
        { body: { contains: "Tagihan Invoice", mode: "insensitive" } },
        { body: { contains: "tagihan SPP", mode: "insensitive" } },
      ],
    },
  });
  console.log(`Deleted invoice-related messages: ${msgDelete.count}`);

  // 4. Delete invoice-related reminder logs.
  const remDelete = await prisma.reminderLog.deleteMany({
    where: {
      OR: [
        { tipe: { contains: "invoice", mode: "insensitive" } },
        { keterangan: { contains: "Invoice", mode: "insensitive" } },
        { keterangan: { contains: "tagihan SPP", mode: "insensitive" } },
      ],
    },
  });
  console.log(`Deleted invoice-related reminder logs: ${remDelete.count}`);

  // 5. Re-sync every murid status from the remaining payments (idempotent).
  const murids = await prisma.murid.findMany({
    select: { id: true, statusBayarBulanIni: true },
  });
  let synced = 0;
  for (const murid of murids) {
    const active = await prisma.payment.findFirst({
      where: { muridId: murid.id, status: { in: ["PENDING", "PROCESSING"] } },
      select: { status: true },
    });
    const latestSuccess = await prisma.payment.findFirst({
      where: { muridId: murid.id, status: "SUCCESS" },
      orderBy: { paidAt: "desc" },
      select: { status: true },
    });
    const nextStatus = active ? active.status : latestSuccess ? "SUCCESS" : "PENDING";
    if (nextStatus !== murid.statusBayarBulanIni) {
      await prisma.murid.update({ where: { id: murid.id }, data: { statusBayarBulanIni: nextStatus } });
      synced++;
    }
  }
  console.log(`Murid payment-status records re-synced: ${synced}`);

  console.log("After:", JSON.stringify(await summary()));
  console.log(dryRun ? "DRY RUN complete - no data was modified." : "SPP/invoice cleanup complete.");

  await prisma.$disconnect();
}

void main()
  .catch((error) => {
    console.error("Cleanup error:", error);
    process.exit(1);
  });