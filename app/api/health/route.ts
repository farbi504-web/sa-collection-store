import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Shows only whether settings exist and whether the database answers. Never returns a secret value.
export async function GET() {
  const has = (k: string) => !!(process.env[k] || "").trim();
  const env = {
    DATABASE_URL: has("DATABASE_URL"),
    DIRECT_URL: has("DIRECT_URL"),
    ADMIN_EMAIL: has("ADMIN_EMAIL"),
    ADMIN_PASSWORD: has("ADMIN_PASSWORD"),
    AUTH_SECRET_ok: (process.env.AUTH_SECRET || "").length >= 16,
    BLOB_READ_WRITE_TOKEN: has("BLOB_READ_WRITE_TOKEN")
  };
  let db = "ok";
  let tables = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
    try {
      await Promise.all([prisma.product.count(), prisma.variant.count(), prisma.order.count(), prisma.siteContent.count()]);
    } catch {
      tables = "missing_or_outdated";
    }
  } catch {
    db = "connection_failed";
    tables = "unknown";
  }
  return NextResponse.json({ env, db, tables }, { headers: { "Cache-Control": "no-store" } });
}
