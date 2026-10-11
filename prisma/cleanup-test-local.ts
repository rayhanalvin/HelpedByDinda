import "dotenv/config";
import { prisma } from "../src/lib/db";

// One-shot cleanup: delete temporary accounts created for local E2E testing
// (forgot-password flow). Dry-run guarded; run with `npm run cleanup:testlocal`.
async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const where = { email: { endsWith: "@test.local" } };
  const users = await prisma.user.findMany({ where, select: { id: true, email: true, name: true } });
  console.log(`Found ${users.length} user(s) with @test.local email`);
  for (const u of users) {
    console.log(`  - ${u.email} (${u.name})`);
  }
  if (dryRun) {
    console.log("DRY RUN complete - no data was modified.");
    process.exit(0);
  }
  await prisma.user.deleteMany({ where });
  console.log("Cleanup complete.");
}

main()
  .catch((e) => {
    console.error("Cleanup error:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());