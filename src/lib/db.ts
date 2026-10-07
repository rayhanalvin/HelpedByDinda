import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const rawConnectionString = process.env.DATABASE_URL ?? "";
const connectionString = rawConnectionString
  .replace(/sslmode=require/gi, "sslmode=verify-full")
  .replace(/sslmode=prefer/gi, "sslmode=verify-full")
  .replace(/sslmode=verify-ca/gi, "sslmode=verify-full");

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
