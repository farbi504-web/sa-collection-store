import type { Prisma, OrderStatus } from "@prisma/client";

export const STATUSES: OrderStatus[] = ["NEW", "CONFIRMED", "PREPARING", "READY", "SENT", "DELIVERED", "CANCELLED", "RETURNED"];

export type OrderFilters = { status?: string; q?: string; wilaya?: string; from?: string; to?: string };

// Shared by the orders list and the CSV export so both always show the same rows
export function orderWhere(f: OrderFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  if (f.status && (STATUSES as string[]).includes(f.status)) where.status = f.status as OrderStatus;
  const q = (f.q || "").trim().slice(0, 40);
  if (q) where.OR = [{ ref: { contains: q.toUpperCase() } }, { customerName: { contains: q, mode: "insensitive" } }, { phone: { contains: q.replace(/[\s.-]/g, "") } }];
  const w = Number(f.wilaya);
  if (Number.isInteger(w) && w >= 1 && w <= 58) where.wilaya = w;
  const range: { gte?: Date; lt?: Date } = {};
  if (f.from && /^\d{4}-\d{2}-\d{2}$/.test(f.from)) range.gte = new Date(f.from + "T00:00:00+01:00");
  if (f.to && /^\d{4}-\d{2}-\d{2}$/.test(f.to)) range.lt = new Date(new Date(f.to + "T00:00:00+01:00").getTime() + 24 * 3600 * 1000);
  if (range.gte || range.lt) where.createdAt = range;
  return where;
}
