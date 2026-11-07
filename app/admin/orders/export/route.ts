import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { orderWhere } from "@/lib/orderq";
import { wilayaName } from "@/lib/wilayas";

export const dynamic = "force-dynamic";

// CSV cells starting with = + - @ are prefixed so spreadsheets never run them as formulas
const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const orders = await prisma.order.findMany({ where: orderWhere(sp), orderBy: { createdAt: "desc" }, take: 5000, include: { items: true } });
  const head = ["ref", "date", "status", "name", "phone", "wilaya", "commune", "address", "items", "subtotal", "delivery", "total", "tracking", "notes"];
  const rows = orders.map((o) => [
    o.ref,
    o.createdAt.toISOString(),
    o.status,
    o.customerName,
    o.phone,
    wilayaName(o.wilaya),
    o.commune,
    o.address,
    o.items.map((i) => `${i.name} ${[i.size, i.color].filter(Boolean).join("/")} x${i.qty}`).join(" ; "),
    o.subtotal,
    o.deliveryFee,
    o.total,
    o.trackingCode,
    o.notes
  ]);
  const csv = "﻿" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="orders.csv"', "Cache-Control": "no-store" } });
}
