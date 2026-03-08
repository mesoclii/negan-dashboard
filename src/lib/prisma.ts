import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import "@/lib/dashboardStoreBootstrap";

declare global {
  // eslint-disable-next-line no-var
  var __possumDashboardPrisma: PrismaClient | undefined;
}

const adapter = new PrismaBetterSqlite3({
  url: path.join(process.cwd(), "prisma", "dashboard.db"),
});

const prisma =
  global.__possumDashboardPrisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__possumDashboardPrisma = prisma;
}

export default prisma;
