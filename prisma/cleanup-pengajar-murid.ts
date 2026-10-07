import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set - aborting");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Cleanup started: remove users with role PENGAJAR and MURID and related records (ADMIN preserved)");

  const before = {
    usersToRemove: await prisma.user.count({ where: { role: { in: ["PENGAJAR", "MURID"] } } }),
    pengajar: await prisma.pengajar.count(),
    murid: await prisma.murid.count(),
  };

  if (process.argv.includes("--dry-run")) {
    console.log("Dry run mode - no changes will be made");
    console.log("Would delete users count:", before.usersToRemove);
    await prisma.$disconnect();
    process.exit(0);
  }

  console.log("Before:", before);

  if (before.usersToRemove === 0 && before.pengajar === 0 && before.murid === 0) {
    console.log("No pengajar/murid data found. Nothing to delete.");
    return;
  }

  // Perform deletion in a transaction. Deleting users with roles PENGAJAR/MURID should cascade.
  const [deletedUsers] = await prisma.$transaction([prisma.user.deleteMany({ where: { role: { in: ["PENGAJAR", "MURID"] } } })]);

  console.log(`Deleted users count: ${deletedUsers.count}`);

  const after = {
    usersToRemove: await prisma.user.count({ where: { role: { in: ["PENGAJAR", "MURID"] } } }),
    pengajar: await prisma.pengajar.count(),
    murid: await prisma.murid.count(),
  };

  console.log("After:", after);
  console.log("Cleanup finished.");
}

main()
  .catch((e) => {
    console.error("Cleanup error:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
