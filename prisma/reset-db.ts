import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

async function main() {
  console.log("Deleting all users...");
  await prisma.user.deleteMany({});
  console.log("All users deleted.");

  console.log("Creating new admin user...");
  const adminEmail = "cs.helpeddinda@gmail.com";
  const adminPassword = "dindaadmin";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      name: "Admin Root",
      admin: {
        create: {},
      },
    },
  });
  console.log(`Admin user created with email: ${adminEmail} (id: ${adminUser.id})`);

  console.log("Database synchronization complete.");
}

main()
  .catch((e) => {
    console.error("Error during database synchronization:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
